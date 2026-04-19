const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const pool = require('../db');
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post('/', async (req, res) => {
  try {
    const { text, url } = req.body;
    let rawText = text;

    // 1. Fetch text if URL is provided
    if (url) {
      if (!url.startsWith('http')) {
        return res.status(400).json({ error: 'Invalid URL format' });
      }
      try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        // Remove scripts and styles
        $('script, style, noscript').remove();
        rawText = $('body').text().replace(/\s+/g, ' ').trim();
        // Limit text length to avoid token limits
        rawText = rawText.substring(0, 15000);
      } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch the URL content' });
      }
    }

    if (!rawText) {
      return res.status(400).json({ error: 'Either text or url is required' });
    }

    // 2. Call OpenAI to structure data
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not configured in the backend' });
    }

    const systemPrompt = `You are an AI data extractor for a Crime Management Database. 
You will be provided with an unstructured text or a news article. 
Extract the entities according to this strict JSON schema. If an information piece is not available, try to infer reasonably or leave it as null/empty string.
Schema:
{
  "location": {
    "address": "string",
    "city": "string",
    "state": "string",
    "pincode": "string"
  },
  "crime": {
    "crime_type": "string (e.g. Theft, Fraud, Murder, Assault, Cybercrime)",
    "date": "YYYY-MM-DD (approximate if not exact)",
    "time": "HH:MM:SS",
    "description": "string (brief summary)",
    "status": "string (Open, Closed, Under Investigation)"
  },
  "persons": [
    {
      "name": "string",
      "age": number (or null),
      "gender": "string (Male/Female/Other)",
      "role": "string (Victim/Suspect/Witness)",
      "phone_number": "string",
      "address": "string"
    }
  ]
}

Return ONLY standard JSON without any markdown formatting wrappers like \`\`\`json.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: rawText }
      ],
      temperature: 0.1
    });

    let extractedData;
    try {
      const responseContent = completion.choices[0].message.content.trim();
      extractedData = JSON.parse(responseContent);
    } catch (parseError) {
      return res.status(500).json({ error: 'Failed to parse AI response into structured JSON.' });
    }

    // 3. Database Insertion in Transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create Location
      const loc = extractedData.location || {};
      const [locResult] = await connection.query(
        'INSERT INTO Location (address, city, state, pincode) VALUES (?, ?, ?, ?)',
        [loc.address || '', loc.city || 'Unknown', loc.state || '', loc.pincode || '']
      );
      const locationId = locResult.insertId;

      // Create Crime
      const crime = extractedData.crime || {};
      const [crimeResult] = await connection.query(
        'INSERT INTO Crime (crime_type, date, time, location_id, description, status) VALUES (?, ?, ?, ?, ?, ?)',
        [
          crime.crime_type || 'Unknown',
          crime.date || new Date().toISOString().split('T')[0],
          crime.time || '00:00:00',
          locationId,
          crime.description || 'Auto-imported from text',
          crime.status || 'Open'
        ]
      );
      const crimeId = crimeResult.insertId;

      // Create Persons & link
      const persons = extractedData.persons || [];
      const createdPersons = [];
      for (const p of persons) {
        if (!p.name) continue; // Skip invalid persons
        const [personResult] = await connection.query(
          'INSERT INTO Person (name, age, gender, phone_number, address) VALUES (?, ?, ?, ?, ?)',
          [p.name, p.age || null, p.gender || 'Unknown', p.phone_number || '', p.address || '']
        );
        const personId = personResult.insertId;
        createdPersons.push({ ...p, person_id: personId });

        // Link crime and person
        await connection.query(
          'INSERT INTO Crime_Person (crime_id, person_id, role) VALUES (?, ?, ?)',
          [crimeId, personId, p.role || 'Witness']
        );
      }

      await connection.commit();
      connection.release();

      res.status(200).json({
        message: 'Successfully generated and saved structured data',
        data: {
          location_id: locationId,
          crime_id: crimeId,
          extracted_details: extractedData
        }
      });
    } catch (dbError) {
      await connection.rollback();
      connection.release();
      throw dbError;
    }
  } catch (error) {
    console.error('Analyze Error:', error);
    res.status(500).json({ error: error.message || 'An error occurred during processing.' });
  }
});

module.exports = router;
