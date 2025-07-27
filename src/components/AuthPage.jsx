import React, { useState } from 'react';
import {
  loginUser,
  registerUser,
  setCurrentUser,
} from '../services/dbService';
import '../App.css';
import '../css/AuthPage.css';
import logo from '../../public/vite.svg';

function AuthPage({ onLoginSuccess }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [mealOrder, setMealOrder] = useState('Breakfast,Lunch,Dinner');
  const [unit, setUnit] = useState('g');
  const [darkMode, setDarkMode] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user =
        mode === 'register'
          ? await registerUser({
              username,
              password,
              firstName,
              lastName,
              calorieGoal: Number(calorieGoal),
              mealOrder,
              unit,
              darkMode,
            })
          : await loginUser({ username, password });

      await setCurrentUser(user);
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container fade-slide-in">
      <div className="auth-box shadow rounded">
        <img src={logo} alt="App Logo" className="auth-logo" />
        <h1 className="app-name">KnowUrFood</h1>
        <h2 className="auth-title">{mode === 'login' ? 'LOGIN' : 'REGISTER'}</h2>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            className="form-control mb-2"
            placeholder="Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <div className="position-relative mb-2">
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-control pe-5"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <i
              className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} toggle-password-icon`}
              onClick={() => setShowPassword((prev) => !prev)}
              title="Toggle password"
            />
          </div>

          {mode === 'register' && (
            <>
              <input
                type="text"
                className="form-control mb-2"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />

              <input
                type="text"
                className="form-control mb-2"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />

              <input
                type="number"
                className="form-control mb-2"
                placeholder="Daily Calorie Goal"
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(e.target.value)}
                required
              />

              <select
                className="form-control mb-2"
                value={mealOrder}
                onChange={(e) => setMealOrder(e.target.value)}
              >
                <option value="Breakfast,Lunch,Dinner">Breakfast → Lunch → Dinner</option>
                <option value="Dinner,Lunch,Breakfast">Dinner → Lunch → Breakfast</option>
              </select>

              <select
                className="form-control mb-2"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                <option value="g">Grams (g)</option>
                <option value="mg">Milligrams (mg)</option>
                <option value="kcal">Calories (kcal)</option>
              </select>

              <div className="form-check form-switch mb-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={darkMode}
                  onChange={() => setDarkMode(!darkMode)}
                  id="darkModeToggle"
                />
                <label className="form-check-label text-white" htmlFor="darkModeToggle">
                  Enable Dark Mode
                </label>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary w-100 mb-2">
            {mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>

        <p className="text-white text-center">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <span className="text-link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Register' : 'Login'}
          </span>
        </p>

        {error && <p className="text-danger text-center">{error}</p>}
      </div>
    </div>
  );
}

export default AuthPage;
