const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authenticateToken = require('../middleware/authMiddleware');

// All appointment routes require a logged-in user
router.use(authenticateToken);

// GET all appointments
router.get('/', appointmentController.getAllAppointments);

// GET appointment by ID
router.get('/:id', appointmentController.getAppointmentById);

// CREATE appointment
router.post('/', appointmentController.createAppointment);

// UPDATE appointment
router.put('/:id', appointmentController.updateAppointment);

// DELETE appointment
router.delete('/:id', appointmentController.deleteAppointment);

module.exports = router;
