const readline = require('node:readline/promises');
const {
    stdin: input,
    stdout: output,
} = require('node:process');
const bcrypt = require('bcryptjs');

const { pool } = require('../config/db');

async function main() {
    const rl = readline.createInterface({
        input,
        output,
    });

    try {
        const fullName = String(
            await rl.question(
                'Nama lengkap: '
            )
        ).trim();

        const email = String(
            await rl.question('Email: ')
        )
            .trim()
            .toLowerCase();

        const password = String(
            await rl.question(
                'Password minimal 8 karakter (teks terlihat saat diketik): '
            )
        );

        if (!fullName || !email) {
            throw new Error(
                'Nama dan email wajib diisi.'
            );
        }

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                email
            )
        ) {
            throw new Error(
                'Format email tidak valid.'
            );
        }

        if (password.length < 8) {
            throw new Error(
                'Password minimal 8 karakter.'
            );
        }

        const passwordHash =
            await bcrypt.hash(
                password,
                8
            );

        await pool.execute(
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
            [
                fullName,
                email,
                passwordHash,
            ]
        );

        console.log(
            `Akun ${email} berhasil dibuat.`
        );
    } catch (scriptError) {
        if (scriptError.code === 'ER_DUP_ENTRY') {
            console.error(
                'Email tersebut sudah terdaftar.'
            );
        } else {
            console.error(
                scriptError.message
            );
        }

        process.exitCode = 1;
    } finally {
        rl.close();
        await pool.end();
    }
}

main();