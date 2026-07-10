const db = require('../config/db');

// GET all services
exports.getAllServices = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM services ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

// GET service by ID
exports.getServiceById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM services WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Service not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch service' });
  }
};

// CREATE new service
exports.createService = async (req, res) => {
  const { name, description, duration_minutes } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO services (name, description, duration_minutes) VALUES ($1, $2, $3) RETURNING *',
      [name, description, duration_minutes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create service' });
  }
};

// UPDATE a service
exports.updateService = async (req, res) => {
  const { id } = req.params;
  const { name, description, duration_minutes } = req.body;
  try {
    const result = await db.query(
      'UPDATE services SET name = $1, description = $2, duration_minutes = $3 WHERE id = $4 RETURNING *',
      [name, description, duration_minutes, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Service not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update service' });
  }
};

// DELETE a service
exports.deleteService = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM services WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Service not found' });
    res.json({ message: 'Service deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
};

