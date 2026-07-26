const express = require('express');
const criticalItemController = require('../controllers/criticalItem.controller');

const router = express.Router();

router.get('/', criticalItemController.getAll);
router.get('/:id', criticalItemController.getById);
router.post('/', criticalItemController.create);
router.put('/:id', criticalItemController.update);
router.delete('/:id', criticalItemController.remove);

module.exports = router;