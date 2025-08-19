import React, { useState, useEffect } from 'react';
import { addWeightLog, getWeightLogs } from '../services/dbService';
import { useToast } from '../contexts/ToastContext';

function WeightLogger({ user, onWeightLogged, onClose }) {
  const formatLocalDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`; // YYYY-MM-DD
  };

  const [weight, setWeight] = useState('');
  const [logs, setLogs] = useState([]);
  const [today, setToday] = useState(formatLocalDate(new Date()));
  const { showToast } = useToast();

  useEffect(() => {
    if (user?.uid) {
      getWeightLogs(user.uid).then(setLogs);
    }
  }, [user]);

  const handleSave = async () => {
    if (!weight || isNaN(weight)) return;
    await addWeightLog(user.uid, today, parseFloat(weight));

    // refresh logs
    const updated = await getWeightLogs(user.uid);
    setLogs(updated);

    // ✅ Toast + XP message
    showToast("✅ Weight logged! +10 XP 🎉", "success");

    // reset input
    setWeight('');

    // notify parent so WeightLineChart updates instantly
    if (onWeightLogged) onWeightLogged(updated);

    // close modal if passed
    if (onClose) onClose();
  };

  return (
    <div className="card bg-dark p-3 mb-3 text-white shadow-sm">
      <h6 className="fw-bold mb-2 SubTitleName">Weight Tracker</h6>
      <div className="d-flex gap-2 mb-2">
        <input
          type="date"
          className="form-control"
          value={today}
          max={formatLocalDate(new Date())}
          onChange={(e) => setToday(e.target.value)}
        />
        <input
          type="number"
          placeholder="Weight (kg)"
          className="form-control"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <button className="btn btn-primary" onClick={()=> {handleSave(); onClose()}}>
          Save
        </button>
      </div>
    </div>
  );
}

export default WeightLogger;
