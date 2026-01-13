require('dotenv/config');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { randomBytes, scryptSync, timingSafeEqual } = require('crypto');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    file: null,
    generate: 0,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--file') {
      options.file = args[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--generate') {
      options.generate = Number(args[i + 1] || 0);
      i += 1;
    }
  }

  return options;
}

function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const hash = Buffer.from(hashHex, 'hex');
  const candidate = scryptSync(password, salt, 64);
  return timingSafeEqual(hash, candidate);
}

function parseUsersFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const users = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split('|').map((value) => value.trim());
    if (parts.length < 4) {
      throw new Error(`Invalid line (expected 4 columns): ${line}`);
    }

    const [username, fullName, role, password] = parts;
    users.push({
      username,
      fullName,
      role,
      password,
    });
  }

  return users;
}

function generateVoters(count) {
  const users = [];
  for (let i = 1; i <= count; i += 1) {
    const username = `voter${i}`;
    users.push({
      username,
      fullName: 'VOTANTE',
      role: 'voter',
      password: username,
    });
  }
  return users;
}

async function main() {
  const { file, generate } = parseArgs();
  if (!file && !generate) {
    throw new Error('Usage: node tools/seed/seed-users.js --file users.txt --generate 100');
  }

  const users = [];
  if (file) {
    const resolved = path.resolve(process.cwd(), file);
    if (!fs.existsSync(resolved)) {
      throw new Error(`File not found: ${resolved}`);
    }
    users.push(...parseUsersFile(resolved));
  }
  if (generate > 0) {
    users.push(...generateVoters(generate));
  }

  const allowedRoles = new Set(['admin', 'voter']);
  const pool = new Pool({
    connectionString: process.env.PG_URI,
    host: process.env.PG_HOST,
    port: process.env.PG_PORT ? Number(process.env.PG_PORT) : undefined,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const user of users) {
      if (!allowedRoles.has(user.role)) {
        throw new Error(`Invalid role for ${user.username}: ${user.role}`);
      }

      const passwordHash = hashPassword(user.password);
      const res = await client.query(
        `INSERT INTO users (username, full_name, role, enabled, password_hash)
         VALUES ($1, $2, $3, true, $4)
         ON CONFLICT (username)
         DO UPDATE SET
           full_name = EXCLUDED.full_name,
           role = EXCLUDED.role,
           enabled = EXCLUDED.enabled,
           password_hash = EXCLUDED.password_hash,
           updated_at = now()
         RETURNING id, username, password_hash`,
        [user.username, user.fullName, user.role, passwordHash],
      );

      const row = res.rows[0];
      if (!row) {
        throw new Error(`Insert failed for ${user.username}`);
      }
      if (!verifyPassword(user.password, row.password_hash)) {
        throw new Error(`Password verification failed for ${user.username}`);
      }
    }
    await client.query('COMMIT');
    console.log(`Seeded ${users.length} users.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
