import React, { useState, useEffect } from 'react';

function ProfileTab({ user, meals, onLogout, clearAllMeals }) {
  const [mealOrder, setMealOrder] = useState('Breakfast-Lunch-Dinner');
  const [darkMode, setDarkMode] = useState(false);
  const [unit, setUnit] = useState('g');

  useEffect(() => {
    const prefs = JSON.parse(localStorage.getItem('preferences')) || {};
    setMealOrder(prefs.mealOrder || 'Breakfast-Lunch-Dinner');
    setDarkMode(prefs.darkMode || false);
    setUnit(prefs.unit || 'g');
  }, []);

  const savePreferences = () => {
    localStorage.setItem('preferences', JSON.stringify({ mealOrder, darkMode, unit }));
    alert('✅ Preferences saved!');
  };

  const totalMeals = meals?.length || 0;
  const uniqueDates = [...new Set(meals?.map(m => m.date))];
  const avgMealsPerDay = uniqueDates.length > 0 ? (totalMeals / uniqueDates.length).toFixed(1) : 0;

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(meals, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'meals.json';
    link.click();
  };

  const confirmClear = () => {
    if (window.confirm("⚠️ Are you sure you want to clear all meal data? This cannot be undone.")) {
      clearAllMeals();
    }
  };

  return (
    <div className="home-container">
      <div className="text-center mb-4">
        <i className="bi bi-person-circle TitleName" style={{ fontSize: '3rem' }}></i>
        <h4 className="mt-2 fw-bold TitleName">{user.username}</h4>
        <small className="text-white">Profile</small>
      </div>

      <div className="card bg-dark border-0 p-3 mb-3 shadow-sm text-white">
        <h6 className="fw-bold">Usage Summary</h6>
        <p style={{ fontSize: '14px' }}>📅 Days Tracked: {uniqueDates.length}</p>
        <p style={{ fontSize: '14px' }}>🍽️ Meals Logged: {totalMeals}</p>
        <p style={{ fontSize: '14px' }}>📊 Avg Meals/Day: {avgMealsPerDay}</p>
      </div>

      <div className="card bg-dark border-0 p-3 mb-3 shadow-sm text-white">
        <h6 className="fw-bold">Preferences</h6>
        <div className="mb-2">
          <label className="form-label small">Meal Order</label>
          <select className="form-select form-select-sm" value={mealOrder} onChange={e => setMealOrder(e.target.value)}>
            <option>Breakfast-Lunch-Dinner</option>
            <option>Lunch-Dinner-Breakfast</option>
            <option>Dinner-Breakfast-Lunch</option>
          </select>
        </div>

        <div className="form-check form-switch mb-2">
          <input className="form-check-input" type="checkbox" id="darkMode" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
          <label className="form-check-label small" htmlFor="darkMode">Enable Dark Mode (future)</label>
        </div>

        <div className="mb-2">
          <label className="form-label small">Units</label>
          <select className="form-select form-select-sm" value={unit} onChange={e => setUnit(e.target.value)}>
            <option>g</option>
            <option>mg</option>
            <option>kcal</option>
          </select>
        </div>

        <button className="btn btn-sm btn-primary mt-2" onClick={savePreferences}>
          <i className="bi bi-save me-1"></i> Save Preferences
        </button>
      </div>

      <div className="card bg-dark border-0 p-3 mb-3 shadow-sm text-white">
        <h6 className="fw-bold mb-3">Data Management</h6>
        <button className="btn btn-outline-light btn-sm w-100 mb-2" onClick={exportJSON}>
          <i className="bi bi-download me-1"></i> Export Data (.json)
        </button>
        <button className="btn btn-outline-danger btn-sm w-100" onClick={confirmClear}>
          <i className="bi bi-trash me-1"></i> Clear All Meals
        </button>
      </div>

      <div className="card bg-dark border-0 p-3 shadow-sm text-white">
        <h6 className="fw-bold">Account</h6>
        <button className="btn btn-danger w-100 mt-2" onClick={onLogout}>
          <i className="bi bi-box-arrow-right me-2"></i> Logout
        </button>
      </div>
    </div>
  );
}

export default ProfileTab;
