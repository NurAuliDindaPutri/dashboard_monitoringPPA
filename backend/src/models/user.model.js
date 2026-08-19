const { pool } = require('../config/db');

async function findByEmail(email) {
    const [rows] = await pool.execute(
        `
        SELECT
            id,
            full_name,
            email,
            password_hash,
            is_active,
            last_login_at
        FROM users
        WHERE email = ?
        LIMIT 1
        `,
        [email]
    );

    return rows[0] || null;
}

async function findActiveById(id) {
    const [rows] = await pool.execute(
        `
        SELECT
            id,
            full_name,
            email,
            is_active,
            last_login_at
        FROM users
        WHERE id = ?
          AND is_active = 1
        LIMIT 1
        `,
        [id]
    );

    return rows[0] || null;
}

async function updateLastLogin(id) {
    await pool.execute(
        `
        UPDATE users
        SET last_login_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [id]
    );
}

async function createUser({
    fullName,
    email,
    passwordHash,
}) {
    const [result] = await pool.execute(
        `
        INSERT INTO users
            (
                full_name,
                email,
                password_hash,
                is_active
            )
        VALUES (?, ?, ?, 1)
        `,
        [fullName, email, passwordHash]
    );

    return {
        id: result.insertId,
        full_name: fullName,
        email,
    };
}

module.exports = {
    findByEmail,
    findActiveById,
    updateLastLogin,
    createUser,
};