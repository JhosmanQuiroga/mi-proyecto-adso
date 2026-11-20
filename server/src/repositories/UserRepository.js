import { pool } from '../config/db.js';
import { AppError } from '../middlewares/errorHandler.js';

// Código de PostgreSQL para violación de restricción UNIQUE
const PG_UNIQUE_VIOLATION = '23505';

// El correo se guarda siempre en minúsculas (lo exige chk_users_email_lower de la Sesión 06)
export const normalizeEmail = (email) => email.trim().toLowerCase();

/**
 * Crea un usuario y devuelve sus datos públicos (incluido el UUID generado por PostgreSQL).
 */
async function createUser({ email, passwordHash, role = 'user' }) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, email, role, is_verified, created_at, updated_at`,
      [normalizeEmail(email), passwordHash, role]
    );
    return rows[0];
  } catch (err) {
    if (err.code === PG_UNIQUE_VIOLATION && err.constraint === 'uq_users_email') {
      throw new AppError(409, 'EMAIL_ALREADY_EXISTS', 'El correo ya está registrado.');
    }
    throw err; // Cualquier otro error lo maneja el errorHandler global (500)
  }
}
/**
 * Busca un usuario por correo. Devuelve null si no existe.
 */
async function findByEmail(email) {
  const { rows } = await pool.query(
    `SELECT id, email, role, is_verified, created_at, updated_at
       FROM users
      WHERE email = $1
      LIMIT 1`,
    [normalizeEmail(email)]
  );
  return rows[0] ?? null;
}
/**
 * Busca un usuario por su UUID. Devuelve null si no existe.
 */
async function findById(id) {
  const { rows } = await pool.query(
    `SELECT id, email, role, is_verified, created_at, updated_at
       FROM users
      WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}