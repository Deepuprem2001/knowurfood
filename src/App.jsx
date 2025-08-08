import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Home';
import HistoryTab from './components/HistoryTab';
import AddMealModal from './components/AddMeal';
import AuthPage from './components/AuthPage';
import ProfileTab from './components/ProfileTab';
import SuggestionsTab from './components/SuggestionsTab';
import { deleteAllMeals } from './services/dbService';
import logo from '../src/assets/Logo.png';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import './App.css';

import {
  addMeal,
  getAllMeals,
  updateMeal,
  deleteMeal,
  getCurrentUser,
  logoutUser
} from './services/dbService';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [meals, setMeals] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModel, setShowModel] = useState(false);
  const [editMealData, setEditMealData] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mealToDelete, setMealToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasShownSplash = useRef(false);
  const nodeRef = useRef(null);
  const [authReady, setAuthReady] = useState(false); // ✅ new state


  useEffect(() => {
    const loadUserAndMeals = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user || null);
      setAuthReady(true); // ✅ auth is now ready
      if (user) {
        setCurrentUser(user);
        const data = await getAllMeals(user.uid);
        setMeals(data);
      }
    };

    if (!hasShownSplash.current) {
      setTimeout(() => {
        setLoading(false);
        hasShownSplash.current = true;
      }, 1500);
    } else {
      setLoading(false);
    }

    loadUserAndMeals();
  }, []);

  // ✅ Step 5B: Meal-time notifications
useEffect(() => {
  if ("Notification" in window && currentUser) {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        scheduleMealReminders(currentUser);
      }
    });
  }
}, [currentUser]);


  const handleLoginSuccess = async (user) => {
    setCurrentUser(user);
    const data = await getAllMeals(user.uid);
    setMeals(data);
  };

  const handleSaveMeal = async (mealData) => {
    if (!currentUser) return;
    const fullData = { ...mealData, userId: currentUser.uid };

    if (editMealData) {
      await updateMeal({ ...fullData, id: editMealData.id }, currentUser.uid);
      const updated = meals.map((m) =>
        m.id === editMealData.id ? { ...fullData, id: editMealData.id } : m
      );
      setMeals(updated);
      setEditMealData(null);
    } else {
      await addMeal(fullData, currentUser.uid);
      setToastMessage('+10 XP! 🎉');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      const all = await getAllMeals(currentUser.uid);
      const updatedUser = await getCurrentUser();
      setMeals(all);
      setCurrentUser(updatedUser);
    }
    setShowModel(false);
  };

  const handleDeleteMeal = async (id) => {
    await deleteMeal(id, currentUser.uid);
    const updated = meals.filter((m) => m.id !== id);
    setMeals(updated);
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setMeals([]);
  };

  function scheduleMealReminders(user) {
  const meals = [
    { label: "Breakfast", time: user.breakfastTime || "08:00" },
    { label: "Lunch", time: user.lunchTime || "13:00" },
    { label: "Dinner", time: user.dinnerTime || "19:00" },
  ];

  meals.forEach(({ label, time }) => {
    const [hour, minute] = time.split(":").map(Number);
    const now = new Date();
    const target = new Date();

    target.setHours(hour, minute, 0, 0);

    // If time already passed today, schedule for tomorrow
    if (target <= now) target.setDate(target.getDate() + 1);

    const timeout = target.getTime() - now.getTime();

    setTimeout(() => {
      new Notification(`${label} Reminder 🍽️`, {
        body: `It's time to log your ${label.toLowerCase()}!`,
      });
    }, timeout);
  });
}


  if (!authReady || loading) {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-black">
      <img src={logo} alt="Logo" style={{ width: '150px', height: '150px' }} />
    </div>
  );
}

  if (!currentUser) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-black">
        <img src={logo} alt="Logo" style={{ width: '150px', height: '150px' }} />
      </div>
    );
  }

  return (
  <SwitchTransition mode="out-in">
  <CSSTransition
    key={activeTab} // 🔑 triggers transition when tab changes
    timeout={300} // ⏱ duration for enter/exit animations
    classNames="tab-transition" // 👕 links to CSS classes
    unmountOnExit
    nodeRef={nodeRef}
  >
    <div style={{height:'100%'}} ref={nodeRef}>
      {activeTab === 'dashboard' && (
        <Dashboard
          user={currentUser}
          meals={meals}
          onEditMeal={(meal) => {
            setEditMealData(meal);
            setShowModel(true);
          }}
          onDeleteMeal={(id) => {
            setMealToDelete(id);
            setShowDeleteModal(true);
          }}
        />
      )}

      {activeTab === 'history' && (
        <HistoryTab
          user={currentUser}
          meals={meals}
          onEditMeal={(meal) => {
            setEditMealData(meal);
            setShowModel(true);
          }}
          onDeleteMeal={(id) => {
            setMealToDelete(id);
            setShowDeleteModal(true);
          }}
        />
      )}

      {activeTab === 'suggestions' && <SuggestionsTab meals={meals} user={currentUser} />}

      {activeTab === 'profile' && (
        <ProfileTab
          user={currentUser}
          meals={meals}
          onLogout={handleLogout}
          clearAllMeals={async () => {
            await deleteAllMeals(currentUser.uid);
            setMeals([]);
          }}
        />
      )}

      <Navbar
        onAddClick={() => setShowModel(true)}
        onLogout={handleLogout}
        onTabChange={(tab) => setActiveTab(tab)}
        currentTab={activeTab}
      />

      <AddMealModal
        isOpen={showModel}
        onClose={() => {
          setShowModel(false);
          setEditMealData(null);
        }}
        onSave={handleSaveMeal}
        user={currentUser}
        editMeal={editMealData}
      />

      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal-container p-4 text-center">
            <p className="text-white fw-bold">Are you sure you want to delete this meal?</p>
            <div className="d-flex justify-content-center gap-3 mt-3">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  if (mealToDelete !== null) {
                    await handleDeleteMeal(mealToDelete);
                    setShowDeleteModal(false);
                    setMealToDelete(null);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="toast-container position-fixed top-0 start-50 translate-middle-x p-3"
            style={{ zIndex: 9999 }}>
          <div className="toast show bg-success text-white">
            <div className="toast-body fw-bold text-center">{toastMessage}</div>
          </div>
        </div>
      )}
    </div>
    </CSSTransition>
    </SwitchTransition>
  );
}

export default App;
