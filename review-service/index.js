const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  host: process.env.DB_HOST || 'review-db',
  port: 5432,
  database: process.env.DB_NAME || 'reviewdb',
  user: process.env.DB_USER || 'review_user',
  password: process.env.DB_PASS || 'review_pass',
});

pool.query(`
  CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL,
    doctor_name VARCHAR(100) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).then(() => console.log('Reviews table ready'));

app.get('/api/reviews', async (req, res) => {
  const result = await pool.query('SELECT * FROM reviews ORDER BY created_at DESC');
  res.json(result.rows);
});

app.get('/api/reviews/doctor/:doctorName', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM reviews WHERE doctor_name = $1', [req.params.doctorName]
  );
  res.json(result.rows);
});

app.post('/api/reviews', async (req, res) => {
  const { patient_id, doctor_name, rating, comment } = req.body;
  const result = await pool.query(
    `INSERT INTO reviews (patient_id, doctor_name, rating, comment)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [patient_id, doctor_name, rating, comment]
  );
  res.status(201).json(result.rows[0]);
});

app.delete('/api/reviews/:id', async (req, res) => {
  await pool.query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
  res.status(204).send();
});

app.listen(8086, () => console.log('Review service running on port 8086'));
