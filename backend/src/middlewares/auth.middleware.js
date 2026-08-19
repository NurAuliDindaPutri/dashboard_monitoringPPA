const jwt = require('jsonwebtoken');

const env = require('../config/env');
const UserModel = require('../models/user.model');
const { error } = require('../utils/response');

async function requireAuth(req, res, next) {
    try {
        const token =
            req.cookies?.[
            env.auth.cookieName
            ];

        if (!token) {
            return error(
                res,
                'Silakan login terlebih dahulu.',
                401
            );
        }

        const payload = jwt.verify(
            token,
            env.auth.jwtSecret,
            {
                issuer: 'ppa-nexus-api',
                audience: 'ppa-nexus-web',
            }
        );

        const user =
            await UserModel.findActiveById(
                payload.sub
            );

        if (!user) {
            return error(
                res,
                'Sesi tidak valid atau akun sudah dinonaktifkan.',
                401
            );
        }

        req.user = user;
        return next();
    } catch (authError) {
        if (
            authError.name !==
            'JsonWebTokenError' &&
            authError.name !==
            'TokenExpiredError'
        ) {
            return next(authError);
        }

        return error(
            res,
            authError.name ===
                'TokenExpiredError'
                ? 'Sesi sudah berakhir. Silakan login kembali.'
                : 'Sesi tidak valid. Silakan login kembali.',
            401
        );
    }
}

module.exports = requireAuth;