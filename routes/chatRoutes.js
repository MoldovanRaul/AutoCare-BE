const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authenticateToken = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

// POST issue text and get top ML service predictions
router.post('/predict', authenticateToken, allowRoles('admin', 'customer'), chatController.predictFromText);

module.exports = router;
