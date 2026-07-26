const express = require('express');
const siteController = require('../controllers/site.controller');

const router = express.Router();

router.get('/', siteController.getAll);
router.get('/:id', siteController.getById);
router.post('/', siteController.create);
router.put('/:id', siteController.update);
router.delete('/:id', siteController.remove);

module.exports = router;