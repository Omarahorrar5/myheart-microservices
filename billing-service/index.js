const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  host: process.env.DB_HOST || 'billing-db',
  port: 5432,
  database: process.env.DB_NAME || 'billingdb',
  user: process.env.DB_USER || 'billing_user',
  password: process.env.DB_PASS || 'billing_pass',
});

pool.query(`
  CREATE TABLE IF NOT EXISTS bills (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL,
    appointment_id INTEGER,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
  )
`).then(() => console.log('Bills table ready'));

app.get('/api/bills', async (req, res) => {
  const result = await pool.query('SELECT * FROM bills ORDER BY created_at DESC');
  res.json(result.rows);
});

app.get('/api/bills/patient/:patientId', async (req, res) => {
  const result = await pool.query('SELECT * FROM bills WHERE patient_id = $1', [req.params.patientId]);
  res.json(result.rows);
});

app.get('/api/bills/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM bills WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
  res.json(result.rows[0]);
});

app.post('/api/bills', async (req, res) => {
  const { patient_id, appointment_id, amount, description, status } = req.body;
  const result = await pool.query(
    `INSERT INTO bills (patient_id, appointment_id, amount, description, status)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [patient_id, appointment_id, amount, description, status || 'pending']
  );
  res.status(201).json(result.rows[0]);
});

app.put('/api/bills/:id/pay', async (req, res) => {
  const result = await pool.query(
    `UPDATE bills SET status='paid', paid_at=CURRENT_TIMESTAMP WHERE id=$1 RETURNING *`,
    [req.params.id]
  );
  res.json(result.rows[0]);
});

app.delete('/api/bills/:id', async (req, res) => {
  await pool.query('DELETE FROM bills WHERE id = $1', [req.params.id]);
  res.status(204).send();
});

app.listen(8083, () => console.log('Billing service running on port 8083'));
