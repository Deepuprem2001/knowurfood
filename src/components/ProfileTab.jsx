import React, { useState, useEffect } from 'react';
import { getAuth, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { updateUserProfile } from '../services/dbService';
import { useToast } from '../contexts/ToastContext';

function ProfileTab({ user, meals, onLogout, clearAllMeals }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [mealOrder, setMealOrder] = useState('Breakfast-Lunch-Dinner');
  const [unit, setUnit] = useState('g');
  const [darkMode, setDarkMode] = useState(false);
  const [clearing, setClearing] = useState(false);

  const [breakfastTime, setBreakfastTime] = useState('08:00');
  const [lunchTime, setLunchTime] = useState('13:00');
  const [dinnerTime, setDinnerTime] = useState('19:00');

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  const { showToast } = useToast();

  const level = user.level || 1;
  const xp = user.xp || 0;
  const currentXP = xp % 100;
  const nextXP = 100;
  const xpPercent = (currentXP / nextXP) * 100;
  const badges = user.badges || [];

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setAge(user.age || 25);
      setGender(user.gender || 'male');
      setHeight(user.height || '');
      setCurrentWeight(user.currentWeight || '');
      setGoalWeight(user.goalWeight || '');
      setGoalDate(user.goalDate || '');
      setMealOrder(user.mealOrder?.join('-') || 'Breakfast-Lunch-Dinner');
      setUnit(user.unit || 'g');
      setDarkMode(user.darkMode ?? false);
      setBreakfastTime(user.breakfastTime || '08:00');
      setLunchTime(user.lunchTime || '13:00');
      setDinnerTime(user.dinnerTime || '19:00');
    }
  }, [user]);

  const savePreferences = async () => {
    const prefs = {
      firstName,
      lastName,
      age,
      gender,
      height,
      currentWeight,
      goalWeight,
      goalDate,
      mealOrder: mealOrder.split('-'),
      unit,
      darkMode,
      breakfastTime,
      lunchTime,
      dinnerTime,
    };
    await updateUserProfile(user.uid, prefs);
    showToast('Preferences updated successfully!', "success");
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(meals, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'meals.json';
    link.click();
  };

  const exportCSV = () => {
  if (!meals || meals.length === 0) {
    showToast("⚠️ No meals to export.", "warning");
    return;
  }

  // ✅ CSV header
  const rows = [
    [
      "Date",
      "Meal Type",
      "Food Name",
      "Calories (kcal)",
      "Protein (g)",
      "Fat (g)",
      "Carbohydrate (g)",
      "Sugar (g)",
      "Fibre (g)",
      "Salt (g)",
      "Caffeine (mg)",
      "Unit"
    ]
  ];

  // ✅ Helper to get nutrient total by type
  const getTotal = (item, type) => {
    return (
      item.nutrients.find(
        (n) => n.type?.toLowerCase() === type.toLowerCase()
      )?.total || ""
    );
  };

  // ✅ Helper to always get calories (from meal.kcal OR calculate)
  const getCalories = (meal, item) => {
    if (meal.kcal) return meal.kcal;

    let kcal = 0;
    item.nutrients.forEach((n) => {
      const c = parseFloat(n.total || 0);
      if (n.type?.toLowerCase() === "fat") kcal += c * 9;
      if (n.type?.toLowerCase() === "protein") kcal += c * 4;
      if (n.type?.toLowerCase().includes("carbohydrate")) kcal += c * 4;
    });
    return Math.round(kcal);
  };

  meals.forEach((meal) => {
    meal.foodItems.forEach((item) => {
      const kcal = getCalories(meal, item);

      rows.push([
        meal.date,
        meal.mealType,
        item.name,
        kcal,
        getTotal(item, "protein"),
        getTotal(item, "fat"),
        getTotal(item, "carbohydrate"),
        getTotal(item, "sugar"),
        getTotal(item, "fibre"),
        getTotal(item, "salt"),
        getTotal(item, "caffeine"),
        unit
      ]);
    });
  });

  const csvContent = rows.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "meals.csv";
  link.click();
};


  const confirmClear = async () => {
    const confirm = window.confirm("⚠️ Are you sure you want to clear all meal data?");
    if (confirm) {
      setClearing(true);
      await clearAllMeals();
      setClearing(false);
      showToast("All meals deleted.", "success");
    }
  };

  const handleUpdateEmailPassword = async () => {
    if (!newEmail && !newPassword) {
      showToast("Please enter a new email or password.", "warning");
      return;
    }

    try {
      setUpdating(true);
      const auth = getAuth();
      const currentUser = auth.currentUser;

      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );

      await reauthenticateWithCredential(currentUser, credential);

      if (newEmail) {
        await updateEmail(currentUser, newEmail);
        await updateUserProfile(currentUser.uid, { email: newEmail });
        showToast("Email updated.", "success");
      }

      if (newPassword) {
        await updatePassword(currentUser, newPassword);
        showToast("Password updated.", "success");
      }

      setNewEmail('');
      setNewPassword('');
      setCurrentPassword('');
    } catch (error) {
      console.error(error);
      showToast(`${error.message}`, "danger");
    } finally {
      setUpdating(false);
    }
  };

  const totalMeals = meals?.length || 0;
  const uniqueDates = [...new Set(meals?.map(m => m.date))];
  const avgMealsPerDay = uniqueDates.length > 0 ? (totalMeals / uniqueDates.length).toFixed(1) : 0;

  return (
    <div className="home-container">
      <div className="text-center mb-4">
        <i className="bi bi-person-circle TitleName" style={{ fontSize: '3rem' }}></i>
        <h4 className="mt-2 fw-bold TitleName">{firstName}</h4>
        <small className="text-white">Profile</small>
      </div>

      <div className="card bg-dark border-0 p-3 mb-3 shadow-sm text-white">
        <h6 className="fw-bold">Usage Summary</h6>
        <p>📅 Days Tracked: {uniqueDates.length}</p>
        <p>🍽️ Meals Logged: {totalMeals}</p>
        <p>📊 Avg Meals/Day: {avgMealsPerDay}</p>
      </div>

      <div className="card bg-dark border-0 p-3 mb-3 shadow-sm text-white">
        <h6 className="fw-bold">Your Rewards</h6>
        <p>🎮 Level {level}</p>
        <div className="progress mb-2" style={{ height: '6px', background: '#444' }}>
          <div className="progress-bar bg-success" style={{ width: `${xpPercent}%` }} title={`${currentXP}/${nextXP} XP`} />
        </div>
        <p>🏅 Badges Unlocked:</p>
        {badges.length === 0 ? (
          <p className="text-muted small">No badges yet.</p>
        ) : (
          <div className="d-flex flex-wrap gap-2">
            {badges.map((badge, i) => (
              <span key={i} className="badge rounded-pill bg-info text-dark p-2">{badge}</span>
            ))}
          </div>
        )}
      </div>

      <div className="card bg-dark border-0 p-3 mb-3 text-white">
        <h6 className="fw-bold">Personal Info</h6>
        <div className="row g-2">
          <div className="col"><input className="form-control form-control-sm" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
          <div className="col"><input className="form-control form-control-sm" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} /></div>
        </div>
        <div className="row g-2 mt-2">
          <div className="col"><input type="number" className="form-control form-control-sm" placeholder="Age" value={age} onChange={e => setAge(e.target.value)} /></div>
          <div className="col">
            <select className="form-select form-select-sm" value={gender} onChange={e => setGender(e.target.value)}>
              <option value="male">Male</option><option value="female">Female</option>
            </select>
          </div>
        </div>
        <div className="row g-2 mt-2">
          <div className="col"><input type="number" className="form-control form-control-sm" placeholder="Height (cm)" value={height} onChange={e => setHeight(e.target.value)} /></div>
          <div className="col"><input type="number" className="form-control form-control-sm" placeholder="Current Weight" value={currentWeight} onChange={e => setCurrentWeight(e.target.value)} /></div>
        </div>
        <div className="row g-2 mt-2">
          <div className="col"><input type="number" className="form-control form-control-sm" placeholder="Goal Weight" value={goalWeight} onChange={e => setGoalWeight(e.target.value)} /></div>
          <div className="col"><input type="date" className="form-control form-control-sm" value={goalDate} onChange={e => setGoalDate(e.target.value)} /></div>
        </div>
      </div>

      <div className="card bg-dark border-0 p-3 mb-3 text-white">
        <h6 className="fw-bold">Preferences</h6>
        <div className="mb-2">
          <label className="form-label small">Meal Order</label>
          <select className="form-select form-select-sm" value={mealOrder} onChange={e => setMealOrder(e.target.value)}>
            <option>Breakfast-Lunch-Dinner</option>
            <option>Lunch-Dinner-Breakfast</option>
            <option>Dinner-Breakfast-Lunch</option>
          </select>
        </div>
        <div className="mb-2">
          <label className="form-label small">Units</label>
          <select className="form-select form-select-sm" value={unit} onChange={e => setUnit(e.target.value)}>
            <option>g</option><option>mg</option><option>kcal</option>
          </select>
        </div>
      </div>

      <div className="card bg-dark border-0 p-3 mb-3 text-white">
        <h6 className="fw-bold">Reminder Times</h6>
        <div className="row g-2 mb-2">
          <div className="col"><input type="time" className="form-control form-control-sm" value={breakfastTime} onChange={e => setBreakfastTime(e.target.value)} /></div>
          <div className="col"><input type="time" className="form-control form-control-sm" value={lunchTime} onChange={e => setLunchTime(e.target.value)} /></div>
          <div className="col"><input type="time" className="form-control form-control-sm" value={dinnerTime} onChange={e => setDinnerTime(e.target.value)} /></div>
        </div>
      </div>

      <button className="btn btn-primary btn-sm w-100 mb-3" onClick={savePreferences}>Save All Changes</button>

      <div className="card bg-dark border-0 p-3 mb-3 text-white">
        <h6 className="fw-bold">Update Email / Password</h6>
        <input type="password" className="form-control form-control-sm mb-2" placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        <input type="email" className="form-control form-control-sm mb-2" placeholder="New Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
        <input type="password" className="form-control form-control-sm mb-2" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <button className="btn btn-outline-light btn-sm w-100" onClick={handleUpdateEmailPassword} disabled={updating}>
          {updating ? "Updating..." : "Update Email / Password"}
        </button>
      </div>

      <div className="card bg-dark border-0 p-3 mb-3 text-white">
        <h6 className="fw-bold">Data Management</h6>
        <button className="btn btn-outline-light btn-sm w-100 mb-2" onClick={exportJSON}>Export JSON</button>
        <button className="btn btn-outline-light btn-sm w-100 mb-2" onClick={exportCSV}>Export CSV</button>
        <button className="btn btn-outline-danger btn-sm w-100" onClick={confirmClear} disabled={clearing}>
          {clearing ? "Clearing..." : "Clear All Meals"}
        </button>
      </div>

      <div className="card bg-dark border-0 p-3 text-white">
        <h6 className="fw-bold">Account</h6>
        <button className="btn btn-danger w-100 mt-2" onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}

export default ProfileTab;
