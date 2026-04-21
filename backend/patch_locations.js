require('dotenv').config();
const pool = require('./db');

async function runPatch() {
  try {
    console.log('Adding latitude and longitude columns to Location table...');
    // Add columns if they don't exist
    try {
      await pool.query('ALTER TABLE Location ADD COLUMN latitude DECIMAL(10, 6)');
      await pool.query('ALTER TABLE Location ADD COLUMN longitude DECIMAL(10, 6)');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') {
        throw e;
      }
      console.log('Columns already exist. Proceeding to update...');
    }

    const updates = [
      { city: 'Delhi', lat: 28.6139, lng: 77.2090 },
      { city: 'Mumbai', lat: 19.0760, lng: 72.8777 },
      { city: 'Bangalore', lat: 12.9716, lng: 77.5946 },
      { city: 'Chennai', lat: 13.0827, lng: 80.2707 },
      { city: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
      { city: 'Allahabad', lat: 25.4358, lng: 81.8463 },
      { city: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
      { city: 'Kolkata', lat: 22.5726, lng: 88.3639 },
      { city: 'Pune', lat: 18.5204, lng: 73.8567 }
    ];

    for (const data of updates) {
      await pool.query('UPDATE Location SET latitude = ?, longitude = ? WHERE city = ?', [data.lat, data.lng, data.city]);
    }

    console.log('Successfully updated Location table with coordinates.');
  } catch (error) {
    console.error('Patch Error:', error);
  } finally {
    process.exit();
  }
}

runPatch();
