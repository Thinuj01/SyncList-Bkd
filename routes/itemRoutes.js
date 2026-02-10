const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const itemController = require('../controllers/itemController');

// POST /api/item/
router.post('/', authMiddleware, itemController.createItem);

// GET /api/item/:id
router.get('/:id', authMiddleware, itemController.getListItems);

// DELETE /api/item/:id
router.delete('/:id', authMiddleware, itemController.deleteItem);

// PUT /api/item/claim/:id
router.put('/claim/:id', authMiddleware, itemController.claimItem);

module.exports = router;
