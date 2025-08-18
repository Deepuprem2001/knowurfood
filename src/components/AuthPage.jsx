import React, { useState, useEffect } from 'react';
import {
  loginUser,
  registerUser
} from '../services/dbService';

import '../App.css';
import '../css/AuthPage.css';
import logo from '../../src/assets/Logo.png';

import {
  getAuth,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';

import { getUserProfile } from '../services/firestoreService';

function AuthPage({ onLoginSuccess }) {
  const [mode, setMode] = useState('login');
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [mealOrder, setMealOrder] = useState('Breakfast,Lunch,Dinner');
  const [unit, setUnit] = useState('g');
  const [currentWeight, setCurrentWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [breakfastTime, setBreakfastTime] = useState('08:00');
  const [lunchTime, setLunchTime] = useState('13:00');
  const [dinnerTime, setDinnerTime] = useState('19:00');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false); // ✅ NEW

  useEffect(() => {
    if (
      currentWeight && height && goalWeight && goalDate &&
      age && gender
    ) {
      const daysToGoal = Math.max(1, Math.ceil((new Date(goalDate) - new Date()) / (1000 * 60 * 60 * 24)));
      const weightDiff = goalWeight - currentWeight;
      const adjustment = (weightDiff * 7700) / daysToGoal;
      const baseBMR = gender === 'male'
        ? 10 * currentWeight + 6.25 * height - 5 * age + 5
        : 10 * currentWeight + 6.25 * height - 5 * age - 161;
      const goal = Math.round(baseBMR + adjustment);
      if (!isNaN(goal)) setCalorieGoal(goal);
    }
  }, [currentWeight, height, goalWeight, goalDate, age, gender]);

  const resetFields = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setCalorieGoal(2000);
    setMealOrder('Breakfast,Lunch,Dinner');
    setUnit('g');
    setCurrentWeight('');
    setHeight('');
    setGoalWeight('');
    setGoalDate('');
    setBreakfastTime('08:00');
    setLunchTime('13:00');
    setDinnerTime('19:00');
    setAge('');
    setGender('male');
    setError('');
    setFieldErrors({});
    setStep(1);
    setRememberMe(false);
  };

  const handleModeSwitch = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    resetFields();
  };

  const handleNext = () => {
    const errors = {};

    if (step === 1) {
      if (!username) errors.username = 'Email is required';
      if (!password) errors.password = 'Password is required';
      if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
      if (password && confirmPassword && password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    if (step === 2) {
      if (!firstName) errors.firstName = 'First name is required';
      if (!lastName) errors.lastName = 'Last name is required';
      if (!age) errors.age = 'Age is required';
      if (!currentWeight) errors.currentWeight = 'Current weight is required';
      if (!height) errors.height = 'Height is required';
      if (!goalWeight) errors.goalWeight = 'Goal weight is required';
      if (!goalDate) errors.goalDate = 'Goal date is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setError('');
    setStep(step + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      let user;

      if (mode === 'register') {
        user = await registerUser({
          email: username,
          password,
          firstName,
          lastName,
          calorieGoal: Number(calorieGoal),
          mealOrder: mealOrder.split(','),
          unit,
          currentWeight: parseFloat(currentWeight),
          height: parseFloat(height),
          goalWeight: parseFloat(goalWeight),
          goalDate,
          breakfastTime,
          lunchTime,
          dinnerTime,
          age: parseInt(age),
          gender
        });
        } else {
          const auth = getAuth();
          const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
          await setPersistence(auth, persistenceType);

          const result = await signInWithEmailAndPassword(auth, username, password);
          const authUser = result.user;

          // store rememberMe flag
          if (rememberMe) {
            localStorage.setItem("rememberMe", "true");
          } else {
            localStorage.removeItem("rememberMe");
          }

          // ✅ Fetch Firestore profile immediately
          const profile = await getUserProfile(authUser.uid);

          // ✅ Merge and send full profile to App
          user = { uid: authUser.uid, email: authUser.email, ...profile };
        }
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderRegisterSteps = () => {
    switch (step) {
      case 1:
        return (
          <>
            <div className="form-row">
              <label>Email</label>
              <input type="email" className={`form-control ${fieldErrors.username ? 'is-invalid' : ''}`} value={username} onChange={(e) => setUsername(e.target.value)} />
              {fieldErrors.username && <div className="text-danger">{fieldErrors.username}</div>}
            </div>
            <div className="form-row">
              <label>Password</label>
              <input type={showPassword ? 'text' : 'password'} className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`} value={password} onChange={(e) => setPassword(e.target.value)} />
              {fieldErrors.password && <div className="text-danger">{fieldErrors.password}</div>}
            </div>
            <div className="form-row">
              <label>Confirm Password</label>
              <input type={showPassword ? 'text' : 'password'} className={`form-control ${fieldErrors.confirmPassword ? 'is-invalid' : ''}`} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              {fieldErrors.confirmPassword && <div className="text-danger">{fieldErrors.confirmPassword}</div>}
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div className="form-row"><label>First Name</label><input type="text" className={`form-control ${fieldErrors.firstName ? 'is-invalid' : ''}`} value={firstName} onChange={(e) => setFirstName(e.target.value)} />{fieldErrors.firstName && <div className="text-danger">{fieldErrors.firstName}</div>}</div>
            <div className="form-row"><label>Last Name</label><input type="text" className={`form-control ${fieldErrors.lastName ? 'is-invalid' : ''}`} value={lastName} onChange={(e) => setLastName(e.target.value)} />{fieldErrors.lastName && <div className="text-danger">{fieldErrors.lastName}</div>}</div>
            <div className="form-row"><label>Age</label><input type="number" className={`form-control ${fieldErrors.age ? 'is-invalid' : ''}`} value={age} onChange={(e) => setAge(e.target.value)} />{fieldErrors.age && <div className="text-danger">{fieldErrors.age}</div>}</div>
            <div className="form-row"><label>Gender</label><select className="form-control" value={gender} onChange={(e) => setGender(e.target.value)}><option value="male">Male</option><option value="female">Female</option></select></div>
            <div className="form-row"><label>Current Weight (kg)</label><input type="number" className={`form-control ${fieldErrors.currentWeight ? 'is-invalid' : ''}`} value={currentWeight} onChange={(e) => setCurrentWeight(e.target.value)} />{fieldErrors.currentWeight && <div className="text-danger">{fieldErrors.currentWeight}</div>}</div>
            <div className="form-row"><label>Height (cm)</label><input type="number" className={`form-control ${fieldErrors.height ? 'is-invalid' : ''}`} value={height} onChange={(e) => setHeight(e.target.value)} />{fieldErrors.height && <div className="text-danger">{fieldErrors.height}</div>}</div>
            <div className="form-row"><label>Goal Weight (kg)</label><input type="number" className={`form-control ${fieldErrors.goalWeight ? 'is-invalid' : ''}`} value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} />{fieldErrors.goalWeight && <div className="text-danger">{fieldErrors.goalWeight}</div>}</div>
            <div className="form-row"><label>Goal Date</label><input type="date" className={`form-control ${fieldErrors.goalDate ? 'is-invalid' : ''}`} value={goalDate} onChange={(e) => setGoalDate(e.target.value)} />{fieldErrors.goalDate && <div className="text-danger">{fieldErrors.goalDate}</div>}</div>
          </>
        );
      case 3:
        return (
          <>
            <div className="form-row"><label>Calorie Goal</label><input type="number" className="form-control" value={calorieGoal} onChange={(e) => setCalorieGoal(e.target.value)} /></div>
            <div className="form-row"><label>Meal Order</label><select className="form-control" value={mealOrder} onChange={(e) => setMealOrder(e.target.value)}><option value="Breakfast,Lunch,Dinner">Breakfast → Lunch → Dinner</option><option value="Dinner,Lunch,Breakfast">Dinner → Lunch → Breakfast</option></select></div>
            <div className="form-row"><label>Preferred Unit</label><select className="form-control" value={unit} onChange={(e) => setUnit(e.target.value)}><option value="g">Grams</option><option value="mg">Milligrams</option><option value="kcal">Calories</option></select></div>
            <div className="form-row"><label>Breakfast Time</label><input type="time" className="form-control" value={breakfastTime} onChange={(e) => setBreakfastTime(e.target.value)} /></div>
            <div className="form-row"><label>Lunch Time</label><input type="time" className="form-control" value={lunchTime} onChange={(e) => setLunchTime(e.target.value)} /></div>
            <div className="form-row"><label>Dinner Time</label><input type="time" className="form-control" value={dinnerTime} onChange={(e) => setDinnerTime(e.target.value)} /></div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="auth-container fade-slide-in">
      <div className="text-center">
        <img src={logo} alt="KnowUrFood Logo" style={{ width: '200px' }} />
      </div>

      <div className="auth-box shadow rounded">
        <h2 className="auth-title">{mode === 'login' ? 'LOGIN' : 'REGISTER'}</h2>

        <form onSubmit={(e) => e.preventDefault()} className="auth-form">
          {mode === 'login' ? (
            <>
              <div className="form-row">
                <label>Email</label>
                <input type="email" className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="form-row">
                <label>Password</label>
                <input type={showPassword ? 'text' : 'password'} className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              {/* ✅ REMEMBER ME */}
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="rememberMe">
                  Remember Me
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 mt-3 mb-2"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </>
          ) : (
            <div className={`fade-step step-${step}`}>
              {/* Step indicators */}
              {/* Registration multi-step fields */}
              {renderRegisterSteps()}
              <div className="d-flex justify-content-between mt-3">
                {step > 1 && <button type="button" className="btn btn-outline-light" onClick={() => setStep(step - 1)}>← Back</button>}
                {step < 3
                  ? <button type="button" className="btn btn-primary ms-auto" onClick={handleNext}>Next →</button>
                  : <button
                      type="submit"
                      onClick={handleSubmit}
                      className="btn btn-success ms-auto"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Registering...
                        </>
                      ) : (
                        "Register"
                      )}
                    </button>
                }
              </div>
            </div>
          )}
        </form>

        <p className="text-white text-center mt-3">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <span className="text-link" onClick={handleModeSwitch}>
            {mode === 'login' ? 'Register' : 'Login'}
          </span>
        </p>

        {error && <p className="text-danger text-center mt-2">{error}</p>}
      </div>
    </div>
  );
}

export default AuthPage;
