const express = require('express');
const unitModelController = require('../controllers/unitModel.controller');

const router = express.Router();

router.get('/', unitModelController.getAll);
router.get('/:id', unitModelController.getById);
router.post('/', unitModelController.create);
router.put('/:id', unitModelController.update);
router.delete('/:id', unitModelController.remove);

module.exports = router;