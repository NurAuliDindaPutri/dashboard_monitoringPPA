const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const env = require('../config/env');
const UserModel = require('../models/user.model');
const {
    success,
    error,
} = require('../utils/response');

function getCookieOptions() {
    return {
        httpOnly: true,
        secure: env.auth.cookieSecure,
        sameSite:
            env.auth.cookieSameSite,
        maxAge:
            env.auth.cookieMaxAgeMs,
        path: '/',
    };
}

function getClearCookieOptions() {
    const options =
        getCookieOptions();

    delete options.maxAge;
    return options;
}

function toPublicUser(user) {
    return {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
    };
}

async function register(req, res, next) {
    try {
        const fullName = String(
            req.body?.full_name || ''
        ).trim();

        const email = String(
            req.body?.email || ''
        )
            .trim()
            .toLowerCase();

        const password = String(
            req.body?.password || ''
        );

        if (!fullName || !email || !password) {
            return error(
                res,
                'Nama, email, dan password wajib diisi.',
                400
            );
        }

        if (
            fullName.length < 3 ||
            fullName.length > 100
        ) {
            return error(
                res,
                'Nama harus terdiri dari 3 sampai 100 karakter.',
                400
            );
        }

        if (
            email.length > 191 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                email
            )
        ) {
            return error(
                res,
                'Format email tidak valid.',
                400
            );
        }

        if (
            password.length < 8 ||
            password.length > 200
        ) {
            return error(
                res,
                'Password harus terdiri dari minimal 8 karakter.',
                400
            );
        }

        const existingUser =
            await UserModel.findByEmail(
                email
            );

        if (existingUser) {
            return error(
                res,
                'Email tersebut sudah terdaftar.',
                409
            );
        }

        const passwordHash =
            await bcrypt.hash(
                password,
                8
            );

        const newUser =
            await UserModel.createUser({
                fullName,
                email,
                passwordHash,
            });

        return success(
            res,
            {
                user: toPublicUser(
                    newUser
                ),
            },
            'Registrasi berhasil. Silakan login.',
            201
        );
    } catch (registerError) {
        if (
            registerError.code ===
            'ER_DUP_ENTRY'
        ) {
            return error(
                res,
                'Email tersebut sudah terdaftar.',
                409
            );
        }

        return next(registerError);
    }
}

async function login(req, res, next) {
    try {
        const email = String(
            req.body?.email || ''
        )
            .trim()
            .toLowerCase();

        const password = String(
            req.body?.password || ''
        );

        if (!email || !password) {
            return error(
                res,
                'Email dan password wajib diisi.',
                400
            );
        }

        if (
            email.length > 191 ||
            password.length > 200
        ) {
            return error(
                res,
                'Email atau password tidak valid.',
                400
            );
        }

        const user =
            await UserModel.findByEmail(
                email
            );

        const passwordMatches =
            user
                ? await bcrypt.compare(
                    password,
                    user.password_hash
                )
                : false;

        if (
            !user ||
            !passwordMatches ||
            Number(user.is_active) !== 1
        ) {
            return error(
                res,
                'Email atau password salah.',
                401
            );
        }

        const token = jwt.sign(
            {
                sub: String(user.id),
                email: user.email,
            },
            env.auth.jwtSecret,
            {
                expiresIn:
                    env.auth.jwtExpiresIn,
                issuer: 'ppa-nexus-api',
                audience: 'ppa-nexus-web',
            }
        );

        res.cookie(
            env.auth.cookieName,
            token,
            getCookieOptions()
        );

        await UserModel.updateLastLogin(
            user.id
        );

        return success(
            res,
            {
                user: toPublicUser(user),
            },
            'Login berhasil'
        );
    } catch (controllerError) {
        return next(controllerError);
    }
}

function logout(req, res) {
    res.clearCookie(
        env.auth.cookieName,
        getClearCookieOptions()
    );

    return success(
        res,
        null,
        'Logout berhasil'
    );
}

function me(req, res) {
    return success(
        res,
        {
            user: toPublicUser(
                req.user
            ),
        },
        'Sesi aktif'
    );
}

module.exports = {
    register,
    login,
    logout,
    me,
};