const db = require('../config/db');

const WORK_START_HOUR = 8;
const WORK_END_HOUR = 17; // 5 PM

// Returns an error string if the appointment is invalid, or null if it's fine
async function validateAppointment(serviceId, appointmentTime, excludeId = null) {
  const svcResult = await db.query('SELECT duration_minutes FROM services WHERE id = $1', [serviceId]);
  if (svcResult.rows.length === 0) return 'Service not found';

  const duration = svcResult.rows[0].duration_minutes;
  const newStart = new Date(appointmentTime);
  const newEnd = new Date(newStart.getTime() + duration * 60000);

  const workStart = new Date(newStart);
  workStart.setHours(WORK_START_HOUR, 0, 0, 0);
  const workEnd = new Date(newStart);
  workEnd.setHours(WORK_END_HOUR, 0, 0, 0);

  if (newStart < workStart) return 'Appointments cannot be booked before 8:00 AM';
  if (newEnd > workEnd) return `This appointment would end at ${newEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, past the 5:00 PM closing time`;

  const query = excludeId
    ? `SELECT a.appointment_time, s.duration_minutes
       FROM appointments a JOIN services s ON a.service_id = s.id
       WHERE a.id != $1`
    : `SELECT a.appointment_time, s.duration_minutes
       FROM appointments a JOIN services s ON a.service_id = s.id`;

  const result = await db.query(query, excludeId ? [excludeId] : []);

  for (const row of result.rows) {
    const existStart = new Date(row.appointment_time);
    const existEnd = new Date(existStart.getTime() + row.duration_minutes * 60000);
    if (newStart < existEnd && newEnd > existStart) {
      return `This time slot overlaps with an existing appointment (${existStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${existEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    }
  }

  return null;
}

// GET all appointments (filtered by role)
exports.getAllAppointments = async (req, res) => {
  try {
    let result;

    if (req.user.role === 'admin') {
      result = await db.query(
        `SELECT a.*, u.name AS customer_name, s.name AS service_name
         FROM appointments a
         LEFT JOIN users u ON a.user_id = u.id
         LEFT JOIN services s ON a.service_id = s.id
         ORDER BY a.id`
      );
    } else {
      result = await db.query(
        `SELECT a.*, s.name AS service_name
         FROM appointments a
         LEFT JOIN services s ON a.service_id = s.id
         WHERE a.user_id = $1
         ORDER BY a.id`,
        [req.user.userId]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// GET appointment by ID
exports.getAppointmentById = async (req, res) => {
  const { id } = req.params;

  try {
    let result;

    if (req.user.role === 'admin') {
      result = await db.query(
        `SELECT a.*, u.name AS customer_name, s.name AS service_name
         FROM appointments a
         LEFT JOIN users u ON a.user_id = u.id
         LEFT JOIN services s ON a.service_id = s.id
         WHERE a.id = $1`,
        [id]
      );
    } else {
      result = await db.query(
        `SELECT a.*, s.name AS service_name
         FROM appointments a
         LEFT JOIN services s ON a.service_id = s.id
         WHERE a.id = $1 AND a.user_id = $2`,
        [id, req.user.userId]
      );
    }

    if (result.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
};

// CREATE appointment
exports.createAppointment = async (req, res) => {
  const user_id = req.user.userId;
  const { service_id, appointment_time, status } = req.body;
  try {
    const validationError = await validateAppointment(service_id, appointment_time);
    if (validationError) return res.status(409).json({ error: validationError });

    const result = await db.query(
      `INSERT INTO appointments (user_id, service_id, appointment_time, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, service_id, appointment_time, status || 'scheduled']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

// UPDATE appointment
exports.updateAppointment = async (req, res) => {
  const { id } = req.params;
  const { service_id, appointment_time } = req.body;

  if (req.user.role !== 'admin') {
    const check = await db.query('SELECT * FROM appointments WHERE id = $1 AND user_id = $2', [id, req.user.userId]);
    if (check.rows.length === 0) {
      return res.status(403).json({ error: 'Not allowed to update this appointment' });
    }
  }

  try {
    const validationError = await validateAppointment(service_id, appointment_time, id);
    if (validationError) return res.status(409).json({ error: validationError });

    const result = await db.query(
      `UPDATE appointments
       SET service_id = $1, appointment_time = $2
       WHERE id = $3
       RETURNING *`,
      [service_id, appointment_time, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};

// DELETE appointment
exports.deleteAppointment = async (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'admin') {
    const check = await db.query('SELECT * FROM appointments WHERE id = $1 AND user_id = $2', [id, req.user.userId]);
    if (check.rows.length === 0) {
      return res.status(403).json({ error: 'Not allowed to delete this appointment' });
    }
  }
  try {
    const result = await db.query('DELETE FROM appointments WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
};
