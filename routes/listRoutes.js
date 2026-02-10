const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const listController = require('../controllers/listController');

// GET /api/list/
router.get('/', authMiddleware, listController.getLists);

// POST /api/list/
router.post('/', authMiddleware, listController.createList);

// DELETE /api/list/:id
router.delete('/:id', authMiddleware, listController.deleteList);

// POST /api/list/:id/join
router.post('/:id/join', authMiddleware, listController.joinList);

module.exports = router;
