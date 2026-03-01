import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API = '';  // uses nginx gateway via same origin

function App() {
  const [tab, setTab] = useState('patients');
  return (
    <div className="app">
      <header>
        <h1>❤️ MyHeart Healthcare System</h1>
        <nav>
          {['patients','appointments','bills','prescriptions','lab-reports','reviews'].map(t => (
            <button key={t} className={tab===t?'active':''} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
      </header>
      <main>
        {tab === 'patients'       && <Patients />}
        {tab === 'appointments'   && <Appointments />}
        {tab === 'bills'          && <Bills />}
        {tab === 'prescriptions'  && <Prescriptions />}
        {tab === 'lab-reports'    && <LabReports />}
        {tab === 'reviews'        && <Reviews />}
      </main>
    </div>
  );
}

/* -------- PATIENTS -------- */
function Patients() {
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', phone:'', gender:'', bloodType:'' });

  useEffect(() => { axios.get('/api/patients').then(r => setPatients(r.data)); }, []);

  const submit = async e => {
    e.preventDefault();
    await axios.post('/api/patients', form);
    const r = await axios.get('/api/patients');
    setPatients(r.data);
    setForm({ firstName:'', lastName:'', email:'', phone:'', gender:'', bloodType:'' });
  };

  return (
    <section>
      <h2>Patients</h2>
      <form onSubmit={submit} className="form-row">
        {['firstName','lastName','email','phone','gender','bloodType'].map(f => (
          <input key={f} placeholder={f} value={form[f]}
            onChange={e => setForm({...form, [f]: e.target.value})} required={['firstName','lastName','email'].includes(f)} />
        ))}
        <button type="submit">Add Patient</button>
      </form>
      <table>
        <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Gender</th><th>Blood</th></tr></thead>
        <tbody>
          {patients.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.firstName} {p.lastName}</td>
              <td>{p.email}</td><td>{p.phone}</td><td>{p.gender}</td><td>{p.bloodType}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/* -------- APPOINTMENTS -------- */
function Appointments() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ patient_id:'', doctor_name:'', department:'', appointment_date:'', notes:'' });

  useEffect(() => { axios.get('/api/appointments').then(r => setItems(r.data)); }, []);

  const submit = async e => {
    e.preventDefault();
    await axios.post('/api/appointments', form);
    const r = await axios.get('/api/appointments');
    setItems(r.data);
    setForm({ patient_id:'', doctor_name:'', department:'', appointment_date:'', notes:'' });
  };

  return (
    <section>
      <h2>Appointments</h2>
      <form onSubmit={submit} className="form-row">
        <input placeholder="Patient ID" value={form.patient_id} onChange={e=>setForm({...form,patient_id:e.target.value})} required />
        <input placeholder="Doctor Name" value={form.doctor_name} onChange={e=>setForm({...form,doctor_name:e.target.value})} required />
        <input placeholder="Department" value={form.department} onChange={e=>setForm({...form,department:e.target.value})} />
        <input type="datetime-local" value={form.appointment_date} onChange={e=>setForm({...form,appointment_date:e.target.value})} required />
        <input placeholder="Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
        <button type="submit">Schedule</button>
      </form>
      <table>
        <thead><tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Dept</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>
          {items.map(i => (
            <tr key={i.id}>
              <td>{i.id}</td><td>{i.patient_id}</td><td>{i.doctor_name}</td>
              <td>{i.department}</td><td>{new Date(i.appointment_date).toLocaleString()}</td>
              <td><span className={`badge ${i.status}`}>{i.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/* -------- BILLS -------- */
function Bills() {
  const [items, setItems] = useState([]);

  useEffect(() => { axios.get('/api/bills').then(r => setItems(r.data)); }, []);

  const pay = async id => {
    await axios.put(`/api/bills/${id}/pay`);
    const r = await axios.get('/api/bills');
    setItems(r.data);
  };

  return (
    <section>
      <h2>Bills</h2>
      <table>
        <thead><tr><th>ID</th><th>Patient</th><th>Amount</th><th>Description</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {items.map(i => (
            <tr key={i.id}>
              <td>{i.id}</td><td>{i.patient_id}</td>
              <td>${parseFloat(i.amount).toFixed(2)}</td>
              <td>{i.description}</td>
              <td><span className={`badge ${i.status}`}>{i.status}</span></td>
              <td>{i.status === 'pending' && <button onClick={() => pay(i.id)}>Pay</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/* -------- PRESCRIPTIONS -------- */
function Prescriptions() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ patient_id:'', doctor_name:'', medication:'', dosage:'', frequency:'', duration:'' });

  useEffect(() => { axios.get('/api/prescriptions').then(r => setItems(r.data)); }, []);

  const submit = async e => {
    e.preventDefault();
    await axios.post('/api/prescriptions', { ...form, patient_id: parseInt(form.patient_id) });
    const r = await axios.get('/api/prescriptions');
    setItems(r.data);
    setForm({ patient_id:'', doctor_name:'', medication:'', dosage:'', frequency:'', duration:'' });
  };

  return (
    <section>
      <h2>Prescriptions</h2>
      <form onSubmit={submit} className="form-row">
        {['patient_id','doctor_name','medication','dosage','frequency','duration'].map(f => (
          <input key={f} placeholder={f} value={form[f]} onChange={e=>setForm({...form,[f]:e.target.value})} required />
        ))}
        <button type="submit">Add</button>
      </form>
      <table>
        <thead><tr><th>Patient</th><th>Doctor</th><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead>
        <tbody>
          {items.map((i,idx) => (
            <tr key={idx}>
              <td>{i.patient_id}</td><td>{i.doctor_name}</td>
              <td>{i.medication}</td><td>{i.dosage}</td><td>{i.frequency}</td><td>{i.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/* -------- LAB REPORTS -------- */
function LabReports() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ patient_id:'', doctor_name:'', test_type:'', test_name:'', result:'', unit:'' });

  useEffect(() => { axios.get('/api/lab-reports').then(r => setItems(r.data)); }, []);

  const submit = async e => {
    e.preventDefault();
    await axios.post('/api/lab-reports', { ...form, patient_id: parseInt(form.patient_id) });
    const r = await axios.get('/api/lab-reports');
    setItems(r.data);
    setForm({ patient_id:'', doctor_name:'', test_type:'', test_name:'', result:'', unit:'' });
  };

  return (
    <section>
      <h2>Lab Reports</h2>
      <form onSubmit={submit} className="form-row">
        {['patient_id','doctor_name','test_type','test_name','result','unit'].map(f => (
          <input key={f} placeholder={f} value={form[f]} onChange={e=>setForm({...form,[f]:e.target.value})} required={f!=='unit'} />
        ))}
        <button type="submit">Add Report</button>
      </form>
      <table>
        <thead><tr><th>Patient</th><th>Doctor</th><th>Test</th><th>Result</th><th>Unit</th></tr></thead>
        <tbody>
          {items.map((i,idx) => (
            <tr key={idx}>
              <td>{i.patient_id}</td><td>{i.doctor_name}</td>
              <td>{i.test_name}</td><td>{i.result}</td><td>{i.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/* -------- REVIEWS -------- */
function Reviews() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ patient_id:'', doctor_name:'', rating:'5', comment:'' });

  useEffect(() => { axios.get('/api/reviews').then(r => setItems(r.data)); }, []);

  const submit = async e => {
    e.preventDefault();
    await axios.post('/api/reviews', { ...form, patient_id: parseInt(form.patient_id), rating: parseInt(form.rating) });
    const r = await axios.get('/api/reviews');
    setItems(r.data);
    setForm({ patient_id:'', doctor_name:'', rating:'5', comment:'' });
  };

  return (
    <section>
      <h2>Reviews</h2>
      <form onSubmit={submit} className="form-row">
        <input placeholder="Patient ID" value={form.patient_id} onChange={e=>setForm({...form,patient_id:e.target.value})} required />
        <input placeholder="Doctor Name" value={form.doctor_name} onChange={e=>setForm({...form,doctor_name:e.target.value})} required />
        <select value={form.rating} onChange={e=>setForm({...form,rating:e.target.value})}>
          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} ⭐</option>)}
        </select>
        <input placeholder="Comment" value={form.comment} onChange={e=>setForm({...form,comment:e.target.value})} />
        <button type="submit">Submit</button>
      </form>
      <table>
        <thead><tr><th>Patient</th><th>Doctor</th><th>Rating</th><th>Comment</th></tr></thead>
        <tbody>
          {items.map(i => (
            <tr key={i.id}>
              <td>{i.patient_id}</td><td>{i.doctor_name}</td>
              <td>{'⭐'.repeat(i.rating)}</td><td>{i.comment}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default App;
