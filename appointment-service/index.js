const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  host: process.env.DB_HOST || 'appointment-db',
  port: 5432,
  database: process.env.DB_NAME || 'appointmentdb',
  user: process.env.DB_USER || 'appt_user',
  password: process.env.DB_PASS || 'appt_pass',
});

// Init table
pool.query(`
  CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL,
    doctor_name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    appointment_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).then(() => console.log('Appointments table ready'));

// GET all
app.get('/api/appointments', async (req, res) => {
  const result = await pool.query('SELECT * FROM appointments ORDER BY appointment_date');
  res.json(result.rows);
});

// GET by patient
app.get('/api/appointments/patient/:patientId', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM appointments WHERE patient_id = $1', [req.params.patientId]
  );
  res.json(result.rows);
});

// GET by id
app.get('/api/appointments/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM appointments WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
  res.json(result.rows[0]);
});

// POST create
app.post('/api/appointments', async (req, res) => {
  const { patient_id, doctor_name, department, appointment_date, notes } = req.body;
  const result = await pool.query(
    `INSERT INTO appointments (patient_id, doctor_name, department, appointment_date, notes)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [patient_id, doctor_name, department, appointment_date, notes]
  );
  // Notify billing service
  try {
    const fetch = (await import('node-fetch')).default;
    await fetch('http://billing-service:8083/api/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id,
        appointment_id: result.rows[0].id,
        amount: 100.00,
        description: `Appointment with Dr. ${doctor_name}`,
        status: 'pending'
      })
    });
  } catch (e) {
    console.log('Billing notification failed (non-blocking):', e.message);
  }
  res.status(201).json(result.rows[0]);
});

// PUT update
app.put('/api/appointments/:id', async (req, res) => {
  const { doctor_name, department, appointment_date, status, notes } = req.body;
  const result = await pool.query(
    `UPDATE appointments SET doctor_name=$1, department=$2, appointment_date=$3, status=$4, notes=$5
     WHERE id=$6 RETURNING *`,
    [doctor_name, department, appointment_date, status, notes, req.params.id]
  );
  res.json(result.rows[0]);
});

// DELETE
app.delete('/api/appointments/:id', async (req, res) => {
  await pool.query('DELETE FROM appointments WHERE id = $1', [req.params.id]);
  res.status(204).send();
});

app.listen(8082, () => console.log('Appointment service running on port 8082'));
