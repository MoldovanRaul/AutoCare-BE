const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const authenticateToken = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

// GET all services
router.get('/', authenticateToken, allowRoles('admin', 'customer'), serviceController.getAllServices);

// GET single service by ID
router.get('/:id', authenticateToken, allowRoles('admin', 'customer'), serviceController.getServiceById);

// CREATE a new service
router.post('/', authenticateToken, allowRoles('admin'), serviceController.createService);

// UPDATE a service
router.put('/:id', authenticateToken, allowRoles('admin'), serviceController.updateService);

// DELETE a service
router.delete('/:id', authenticateToken, allowRoles('admin'), serviceController.deleteService);

module.exports = router;
