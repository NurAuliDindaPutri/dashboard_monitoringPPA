const express = require('express');
const pendingSupplyController = require('../controllers/pendingSupply.controller');

const router = express.Router();

router.get('/', pendingSupplyController.getAll);
router.get('/:id', pendingSupplyController.getById);
router.post('/', pendingSupplyController.create);
router.put('/:id', pendingSupplyController.update);
router.delete('/:id', pendingSupplyController.remove);

module.exports = router;