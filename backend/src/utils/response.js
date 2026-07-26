function success(res, data = null, message = 'Success', status = 200) {
    return res.status(status).json({ status: 'success', message, data });
}

function error(res, message = 'Error', status = 500, details = null) {
    return res.status(status).json({ status: 'error', message, details });
}

module.exports = { success, error };