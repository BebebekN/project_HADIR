import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';
import { GURUS, JADWALS, SISWAS } from './seedData.js';
import { getJakartaNow, getPredikat } from './time.js';

let _sql = null;
let _initPromise = null;

export function getSql() {
  if (!_sql) {
    const connStr =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.DATABASE_URL_UNPOOLED;
    if (!connStr) {
      throw new Error('DATABASE_URL environment variable is not configured.');
    }
    _sql = neon(connStr);
  }
  return _sql;
}

export async function ensureDbReady() {
  const sql = getSql();
  if (!_initPromise) {
    _initPromise = initSchemaAndSeed(sql).catch((err) => {
      _initPromise = null;
      throw err;
    });
  }
  await _initPromise;
  return sql;
}

async function initSchemaAndSeed(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      nis_nip VARCHAR(50) UNIQUE NOT NULL,
      nama_lengkap VARCHAR(150) NOT NULL,
      kelas VARCHAR(30),
      avatar_path VARCHAR(500),
      child_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'siswa',
      password VARCHAR(255) NOT NULL,
      poin_kedisiplinan INTEGER NOT NULL DEFAULT 100,
      bintang NUMERIC(2,1) NOT NULL DEFAULT 5.0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_path VARCHAR(500)
  `;
  await sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS child_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS jadwals (
      id SERIAL PRIMARY KEY,
      kelas VARCHAR(30) NOT NULL,
      hari VARCHAR(20) NOT NULL,
      nama_kegiatan VARCHAR(150) NOT NULL,
      nama_guru VARCHAR(150),
      jam_mulai VARCHAR(10) NOT NULL,
      jam_selesai VARCHAR(10) NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS presensis (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tanggal DATE NOT NULL,
      jam_datang VARCHAR(10),
      jam_pulang VARCHAR(10),
      status VARCHAR(30),
      poin_perubahan INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, tanggal)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS daily_qr_tokens (
      id SERIAL PRIMARY KEY,
      tanggal DATE UNIQUE NOT NULL,
      token VARCHAR(100) NOT NULL,
      jam_mulai VARCHAR(10) DEFAULT '06:00:00',
      jam_selesai VARCHAR(10) DEFAULT '17:00:00'
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS api_tokens (
      id SERIAL PRIMARY KEY,
      token_hash VARCHAR(64) UNIQUE NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  const countRows = await sql`SELECT COUNT(*)::int AS cnt FROM users`;
  if ((countRows[0]?.cnt ?? 0) === 0) {
    const adminHash = bcrypt.hashSync('admin123', 8);
    const guruHash = bcrypt.hashSync('guru123', 8);
    const siswaHash = bcrypt.hashSync('siswa123', 8);

    await sql`
      INSERT INTO users (nis_nip, nama_lengkap, kelas, role, password, poin_kedisiplinan, bintang)
      VALUES ('admin', 'Administrator HADIR', NULL, 'admin', ${adminHash}, 100, 5.0)
      ON CONFLICT (nis_nip) DO NOTHING
    `;

    for (const g of GURUS) {
      await sql`
        INSERT INTO users (nis_nip, nama_lengkap, kelas, role, password, poin_kedisiplinan, bintang)
        VALUES (${g.nis_nip}, ${g.nama_lengkap}, NULL, 'guru', ${guruHash}, 100, 5.0)
        ON CONFLICT (nis_nip) DO NOTHING
      `;
    }

    const studentMap = {};
    for (const s of SISWAS) {
      const isLateSample = s.nis_nip === '541251254';
      const rows = await sql`
        INSERT INTO users (nis_nip, nama_lengkap, kelas, role, password, poin_kedisiplinan, bintang)
        VALUES (${s.nis_nip}, ${s.nama_lengkap}, 'XI PPLG 4', 'siswa', ${siswaHash}, ${isLateSample ? 95 : 100}, 5.0)
        ON CONFLICT (nis_nip) DO UPDATE SET nama_lengkap = EXCLUDED.nama_lengkap
        RETURNING id, nis_nip, nama_lengkap
      `;
      const student = rows[0];
      studentMap[s.nis_nip] = student.id;

      const doubleNis = `${s.nis_nip}${s.nis_nip}`;
      const parentHash = `sha256:${crypto.createHash('sha256').update(doubleNis).digest('hex')}`;
      await sql`
        INSERT INTO users (nis_nip, nama_lengkap, kelas, child_user_id, role, password, poin_kedisiplinan, bintang)
        VALUES (${doubleNis}, ${'Orang Tua ' + s.nama_lengkap}, 'XI PPLG 4', ${student.id}, 'orang_tua', ${parentHash}, 100, 5.0)
        ON CONFLICT (nis_nip) DO NOTHING
      `;
    }

    const jakartaNow = getJakartaNow();
    const samples = [
      { nis: '541251041', jam_datang: '06:45:00', jam_pulang: '15:35:00', status: 'Tepat Waktu', poin: 0 },
      { nis: '541251185', jam_datang: '06:50:00', jam_pulang: '15:35:00', status: 'Tepat Waktu', poin: 0 },
      { nis: '541251254', jam_datang: '07:12:00', jam_pulang: '15:35:00', status: 'Terlambat', poin: -5 },
    ];
    for (const sp of samples) {
      const uid = studentMap[sp.nis];
      if (uid) {
        await sql`
          INSERT INTO presensis (user_id, tanggal, jam_datang, jam_pulang, status, poin_perubahan)
          VALUES (${uid}, ${jakartaNow.yesterdayStr}, ${sp.jam_datang}, ${sp.jam_pulang}, ${sp.status}, ${sp.poin})
          ON CONFLICT (user_id, tanggal) DO NOTHING
        `;
      }
    }
  }

  const jadwalCount = await sql`SELECT COUNT(*)::int AS cnt FROM jadwals`;
  if ((jadwalCount[0]?.cnt ?? 0) === 0) {
    for (const [hari, nama_kegiatan, nama_guru, jam_mulai, jam_selesai] of JADWALS) {
      await sql`
        INSERT INTO jadwals (kelas, hari, nama_kegiatan, nama_guru, jam_mulai, jam_selesai)
        VALUES ('XI PPLG 4', ${hari}, ${nama_kegiatan}, ${nama_guru}, ${jam_mulai}, ${jam_selesai})
      `;
    }
  }

  const jakartaNow = getJakartaNow();
  const tokenToday = `HADIR-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
  await sql`
    INSERT INTO daily_qr_tokens (tanggal, token, jam_mulai, jam_selesai)
    VALUES (${jakartaNow.dateStr}, ${tokenToday}, '06:00:00', '17:00:00')
    ON CONFLICT (tanggal) DO NOTHING
  `;
}

export function verifyPassword(plain, stored) {
  if (!stored) return false;
  if (stored.startsWith('sha256:')) {
    const hex = crypto.createHash('sha256').update(plain).digest('hex');
    return stored === `sha256:${hex}`;
  }
  const normalized = stored.startsWith('$2y$') ? `$2a$${stored.slice(4)}` : stored;
  return bcrypt.compareSync(plain, normalized);
}

export async function resolveSubject(sql, user) {
  if (user.role === 'orang_tua' && user.child_user_id) {
    const rows = await sql`SELECT * FROM users WHERE id = ${user.child_user_id} LIMIT 1`;
    if (rows[0]) return rows[0];
  }
  return user;
}

export function formatUserPayload(user, subject, origin) {
  const bintang = Number(subject.bintang ?? 5.0);
  const avatarPath = user.avatar_path || null;
  const avatarUrl = avatarPath
    ? avatarPath.startsWith('http://') || avatarPath.startsWith('https://')
      ? avatarPath
      : `${origin.replace(/\/$/, '')}/${avatarPath.replace(/^\/+/, '')}`
    : null;

  return {
    id: user.id,
    nis_nip: user.nis_nip,
    nama_lengkap: user.nama_lengkap,
    kelas: subject.kelas || null,
    role: user.role,
    avatar_path: avatarPath,
    avatar_url: avatarUrl,
    child_nis: user.role === 'orang_tua' ? subject.nis_nip : null,
    child_name: user.role === 'orang_tua' ? subject.nama_lengkap : null,
    poin_kedisiplinan: Number(subject.poin_kedisiplinan ?? 100),
    bintang,
    predikat: getPredikat(bintang),
  };
}

export async function authenticateBearer(sql, request) {
  const authHeader = request.headers.get('authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const rawToken = match[1].trim();
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const rows = await sql`
    SELECT u.*, t.token_hash
    FROM api_tokens t
    JOIN users u ON u.id = t.user_id
    WHERE t.token_hash = ${tokenHash}
    LIMIT 1
  `;
  const user = rows[0];
  if (!user) return null;
  const subject = await resolveSubject(sql, user);
  return { user, subject, tokenHash };
}
