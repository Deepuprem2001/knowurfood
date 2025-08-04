// components/WeightLogger.jsx
import React, { useState, useEffect } from 'react';
import { addWeightLog, getWeightLogs } from '../services/dbService';

function WeightLogger({ user }) {
  const [weight, setWeight] = useState('');
  const [logs, setLogs] = useState([]);
  const [today, setToday] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (user?.uid) {
      getWeightLogs(user.uid).then(setLogs);
    }
  }, [user]);

  const handleSave = async () => {
    if (!weight || isNaN(weight)) return;
    await addWeightLog(user.uid, today, parseFloat(weight));
    const updated = await getWeightLogs(user.uid);
    setLogs(updated);
    setWeight('');
  };

  return (
    <div className="card bg-dark p-3 mb-3 text-white shadow-sm">
      <h6 className="fw-bold mb-2 SubTitleName">Weight Tracker</h6>
      <div className="d-flex gap-2 mb-2">
        <input
          type="date"
          className="form-control"
          value={today}
          max={new Date().toISOString().split('T')[0]}
          onChange={(e) => setToday(e.target.value)}
        />
        <input
          type="number"
          placeholder="Weight (kg)"
          className="form-control"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleSave}>
          Save
        </button>
      </div>

    </div>
  );
}

export default WeightLogger;
