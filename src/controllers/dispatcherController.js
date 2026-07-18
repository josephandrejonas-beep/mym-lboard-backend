const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Get all drivers
exports.getAllDrivers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.id, d.phone_number, d.full_name, d.email, d.created_at,
              dp.vehicle_info, dp.insurance_info, dp.zip_code,
              da.status, dl.latitude, dl.longitude
       FROM drivers d
       LEFT JOIN driver_profiles dp ON d.id = dp.driver_id
       LEFT JOIN driver_availability da ON d.id = da.driver_id
       LEFT JOIN driver_locations dl ON d.id = dl.driver_id
       ORDER BY d.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get all drivers error:', err);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
};

// Get driver details
exports.getDriverDetails = async (req, res) => {
  try {
    const driverId = req.params.id;
    const result = await pool.query(
      `SELECT d.id, d.phone_number, d.full_name, d.email, d.created_at,
              dp.vehicle_info, dp.insurance_info, dp.zip_code,
              da.status, dl.latitude, dl.longitude
       FROM drivers d
       LEFT JOIN driver_profiles dp ON d.id = dp.driver_id
       LEFT JOIN driver_availability da ON d.id = da.driver_id
       LEFT JOIN driver_locations dl ON d.id = dl.driver_id
       WHERE d.id = $1`,
      [driverId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get driver details error:', err);
    res.status(500).json({ error: 'Failed to fetch driver details' });
  }
};

// Get all drivers' locations
exports.getAllDriverLocations = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.id, d.full_name, dl.latitude, dl.longitude, dl.zip_code, dl.updated_at,
              da.status
       FROM drivers d
       LEFT JOIN driver_locations dl ON d.id = dl.driver_id
       LEFT JOIN driver_availability da ON d.id = da.driver_id
       WHERE dl.latitude IS NOT NULL AND dl.longitude IS NOT NULL
       ORDER BY dl.updated_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get all locations error:', err);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
};

// Get all loads
exports.getAllLoads = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, la.driver_id FROM loads l
       LEFT JOIN load_assignments la ON l.id = la.load_id
       ORDER BY l.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get all loads error:', err);
    res.status(500).json({ error: 'Failed to fetch loads' });
  }
};

// Create load
exports.createLoad = async (req, res) => {
  try {
    const { pickup_location, delivery_location, pickup_date, delivery_date, customer_info, special_instructions, rate } = req.body;

    if (!pickup_location || !delivery_location || !pickup_date || !delivery_date || !rate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const loadId = uuidv4();
    const result = await pool.query(
      `INSERT INTO loads 
       (id, pickup_location, delivery_location, pickup_date, delivery_date, customer_info, special_instructions, rate, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW(), NOW())
       RETURNING *`,
      [loadId, pickup_location, delivery_location, pickup_date, delivery_date, customer_info, special_instructions, rate]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create load error:', err);
    res.status(500).json({ error: 'Failed to create load' });
  }
};

// Update load
exports.updateLoad = async (req, res) => {
  try {
    const loadId = req.params.id;
    const { pickup_location, delivery_location, pickup_date, delivery_date, customer_info, special_instructions, rate } = req.body;

    const result = await pool.query(
      `UPDATE loads SET 
       pickup_location = COALESCE($1, pickup_location),
       delivery_location = COALESCE($2, delivery_location),
       pickup_date = COALESCE($3, pickup_date),
       delivery_date = COALESCE($4, delivery_date),
       customer_info = COALESCE($5, customer_info),
       special_instructions = COALESCE($6, special_instructions),
       rate = COALESCE($7, rate),
       updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [pickup_location, delivery_location, pickup_date, delivery_date, customer_info, special_instructions, rate, loadId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Load not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update load error:', err);
    res.status(500).json({ error: 'Failed to update load' });
  }
};

// Delete load
exports.deleteLoad = async (req, res) => {
  try {
    const loadId = req.params.id;

    // Delete assignments first
    await pool.query('DELETE FROM load_assignments WHERE load_id = $1', [loadId]);

    // Delete load
    const result = await pool.query('DELETE FROM loads WHERE id = $1 RETURNING *', [loadId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Load not found' });
    }

    res.json({ message: 'Load deleted successfully' });
  } catch (err) {
    console.error('Delete load error:', err);
    res.status(500).json({ error: 'Failed to delete load' });
  }
};

// Assign load to driver
exports.assignLoad = async (req, res) => {
  try {
    const loadId = req.params.id;
    const { driver_id } = req.body;

    if (!driver_id) {
      return res.status(400).json({ error: 'Driver ID required' });
    }

    // Check if load exists
    const loadResult = await pool.query('SELECT * FROM loads WHERE id = $1', [loadId]);
    if (loadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Load not found' });
    }

    // Check if driver exists
    const driverResult = await pool.query('SELECT * FROM drivers WHERE id = $1', [driver_id]);
    if (driverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const assignmentId = uuidv4();
    const result = await pool.query(
      `INSERT INTO load_assignments (id, load_id, driver_id, assigned_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [assignmentId, loadId, driver_id]
    );

    // Update load status to in_transit
    await pool.query('UPDATE loads SET status = $1 WHERE id = $2', ['in_transit', loadId]);

    // Update driver status to in_transit
    await pool.query(
      `INSERT INTO driver_availability (driver_id, status, status_updated_at)
       VALUES ($1, 'in_transit', NOW())
       ON CONFLICT (driver_id) DO UPDATE SET status = 'in_transit', status_updated_at = NOW()`,
      [driver_id]
    );

    res.status(201).json({ message: 'Load assigned successfully', assignment: result.rows[0] });
  } catch (err) {
    console.error('Assign load error:', err);
    res.status(500).json({ error: 'Failed to assign load' });
  }
};

// Update load status
exports.updateLoadStatus = async (req, res) => {
  try {
    const loadId = req.params.id;
    const { status } = req.body;

    const validStatuses = ['pending', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE loads SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, loadId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Load not found' });
    }

    // If delivered, update driver status back to available
    if (status === 'delivered') {
      const assignmentResult = await pool.query(
        'SELECT driver_id FROM load_assignments WHERE load_id = $1',
        [loadId]
      );
      if (assignmentResult.rows.length > 0) {
        const driverId = assignmentResult.rows[0].driver_id;
        await pool.query(
          `UPDATE driver_availability SET status = 'available', status_updated_at = NOW()
           WHERE driver_id = $1`,
          [driverId]
        );
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update load status error:', err);
    res.status(500).json({ error: 'Failed to update load status' });
  }
};

module.exports = exports;
