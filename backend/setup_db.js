/**
 * Crime Management System — Database Setup Runner
 * Run: npm run setup-db   (from crime-mgmt/backend/)
 *
 * Reads database/setup.sql, parses DELIMITER blocks correctly,
 * and executes everything against MySQL using mysql2.
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// ── Colours for terminal output
const C = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
};

const log   = (msg) => console.log(`${C.green}✓${C.reset} ${msg}`);
const warn  = (msg) => console.log(`${C.yellow}⚠${C.reset}  ${msg}`);
const err   = (msg) => console.log(`${C.red}✗${C.reset} ${msg}`);
const info  = (msg) => console.log(`${C.cyan}→${C.reset} ${msg}`);
const dim   = (msg) => console.log(`  ${C.dim}${msg}${C.reset}`);

// ── SQL statement parser — correctly handles DELIMITER changes
function parseStatements(sql) {
  const statements = [];
  let delimiter = ';';
  let buffer    = '';

  const lines = sql.split('\n');

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    // Skip blank lines and pure comment lines when buffer is empty
    if (!buffer.trim() && (trimmed === '' || trimmed.startsWith('--'))) continue;

    // Detect DELIMITER directive
    const delimMatch = trimmed.match(/^DELIMITER\s+(\S+)\s*$/i);
    if (delimMatch) {
      if (buffer.trim()) {
        statements.push(buffer.trim());
        buffer = '';
      }
      delimiter = delimMatch[1];
      continue;
    }

    buffer += rawLine + '\n';

    const bufTrimmed = buffer.trimEnd();
    if (bufTrimmed.endsWith(delimiter)) {
      let stmt;
      if (delimiter === ';') {
        stmt = bufTrimmed.slice(0, -1).trim();
      } else {
        stmt = bufTrimmed.slice(0, -delimiter.length).trim();
      }
      if (stmt && stmt.length > 0) {
        statements.push(stmt);
      }
      buffer = '';
    }
  }

  if (buffer.trim()) statements.push(buffer.trim());

  return statements.filter(s => {
    const t = s.trim();
    return t.length > 0 && !t.startsWith('--');
  });
}

// ── Classify statement for progress reporting
function classify(stmt) {
  const u = stmt.trim().toUpperCase();
  if (u.startsWith('DROP DATABASE'))     return 'DROP DATABASE';
  if (u.startsWith('CREATE DATABASE'))   return 'CREATE DATABASE';
  if (u.startsWith('USE '))              return 'USE';
  if (u.startsWith('CREATE TABLE'))      return 'TABLE';
  if (u.startsWith('CREATE INDEX'))      return 'INDEX';
  if (u.startsWith('CREATE VIEW'))       return 'VIEW';
  if (u.startsWith('CREATE PROCEDURE'))  return 'PROCEDURE';
  if (u.startsWith('CREATE FUNCTION'))   return 'FUNCTION';
  if (u.startsWith('CREATE TRIGGER'))    return 'TRIGGER';
  if (u.startsWith('INSERT INTO LOCATION'))      return 'SEED:Location';
  if (u.startsWith('INSERT INTO PERSON'))        return 'SEED:Person';
  if (u.startsWith('INSERT INTO POLICE_STATION'))return 'SEED:Station';
  if (u.startsWith('INSERT INTO POLICE_OFFICER'))return 'SEED:Officer';
  if (u.startsWith('INSERT INTO CRIME '))        return 'SEED:Crime';
  if (u.startsWith('INSERT INTO CASE_FILE'))     return 'SEED:CaseFile';
  if (u.startsWith('INSERT INTO FIR'))           return 'SEED:FIR';
  if (u.startsWith('INSERT INTO COURT_CASE'))    return 'SEED:CourtCase';
  if (u.startsWith('INSERT INTO EVIDENCE'))      return 'SEED:Evidence';
  if (u.startsWith('INSERT INTO CRIME_PERSON'))  return 'SEED:CrimePerson';
  if (u.startsWith('INSERT INTO CASE_OFFICER'))  return 'SEED:CaseOfficer';
  if (u.startsWith('INSERT INTO AUDIT_LOG'))     return 'SEED:AuditLog';
  if (u.startsWith('INSERT'))            return 'INSERT';
  return 'OTHER';
}

async function main() {
  console.log(`\n${C.bold}${C.cyan}╔═══════════════════════════════════════════╗
║  Crime Management System — DB Setup      ║
╚═══════════════════════════════════════════╝${C.reset}\n`);

  // ── Connection config from .env
  const config = {
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
    multipleStatements: false,
  };

  info(`Connecting to MySQL   ${C.dim}${config.user}@${config.host}:${config.port}${C.reset}`);

  let conn;
  try {
    conn = await mysql.createConnection(config);
    log('Connected to MySQL server');
  } catch (e) {
    err(`Connection failed: ${e.message}`);
    console.log(`\n  Make sure:\n  · MySQL is running\n  · Credentials in ${C.cyan}backend/.env${C.reset} are correct`);
    process.exit(1);
  }

  // ── Read and parse SQL
  const sqlPath = path.join(__dirname, '..', 'database', 'setup.sql');
  if (!fs.existsSync(sqlPath)) {
    err(`Setup file not found: ${sqlPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  const statements = parseStatements(sql);
  info(`Parsed ${C.bold}${statements.length}${C.reset} SQL statements from setup.sql\n`);

  // ── Execute all statements with progress tracking
  const counts = {};
  let done = 0;
  let skipped = 0;

  for (const stmt of statements) {
    const type = classify(stmt);
    try {
      await conn.query(stmt);
      done++;
      counts[type] = (counts[type] || 0) + 1;

      // Print milestone messages
      switch (type) {
        case 'DROP DATABASE':    log('Existing database dropped (clean slate)'); break;
        case 'CREATE DATABASE':  log('Database crime_db created'); break;
        case 'USE':              break;
        case 'TABLE':            dim(`Table created`); break;
        case 'VIEW':             dim(`View created`); break;
        case 'PROCEDURE':        dim(`Stored procedure created`); break;
        case 'FUNCTION':         dim(`Stored function created`); break;
        case 'TRIGGER':          dim(`Trigger created`); break;
        case 'INDEX':            break;
        default:
          if (type.startsWith('SEED:')) dim(`Seeded: ${type.replace('SEED:', '')} data`);
      }
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') { skipped++; continue; }
      err(`Failed at statement ${done + 1} (${type}):`);
      console.log(`  ${C.dim}${stmt.substring(0, 120)}...${C.reset}`);
      console.log(`  ${C.red}${e.message}${C.reset}\n`);
      await conn.end();
      process.exit(1);
    }
  }

  // ── Summary
  console.log(`\n${C.bold}${C.green}✨  Setup complete!${C.reset}\n`);

  // Count actual rows
  try {
    const tables = ['Location', 'Person', 'Police_Station', 'Police_Officer',
                    'Crime', 'Case_File', 'FIR', 'Evidence', 'Court_Case',
                    'Crime_Person', 'Case_Officer', 'Audit_Log'];
    console.log(`${C.bold}  Database Summary:${C.reset}`);
    let total = 0;
    for (const t of tables) {
      const [[row]] = await conn.query(`SELECT COUNT(*) as n FROM \`${t}\``);
      console.log(`  · ${t.padEnd(20)} ${String(row.n).padStart(4)} rows`);
      total += row.n;
    }
    console.log(`  ${'─'.repeat(35)}`);
    console.log(`  · ${'TOTAL'.padEnd(20)} ${String(total).padStart(4)} rows\n`);
  } catch { /* non-fatal */ }

  console.log(`${C.cyan}  You can now start the server:${C.reset}  npm run dev\n`);
  await conn.end();
}

main();
