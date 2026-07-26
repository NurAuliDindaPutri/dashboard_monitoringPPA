const multer = require('multer');

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
    const allowedExt = /\.(xlsx|xls)$/i;
    if (!allowedExt.test(file.originalname)) {
        return cb(new Error('File harus berformat .xlsx atau .xls'));
    }
    cb(null, true);
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // maks 5MB
});

module.exports = upload;