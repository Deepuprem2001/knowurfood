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

  useEffect(() => {
    const loadUserAndMeals = async () => {
      const user = await getCurrentUser();
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
      }, 1500); // splash only once
    } else {
      setLoading(false);
    }

    loadUserAndMeals();
  }, []);

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
    const updatedUser = await getCurrentUser(); // 🔁 Refresh user profile
    setMeals(all);
    setCurrentUser(updatedUser); // ✅ Triggers XP/level bar update

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
    <>
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
              await deleteAllMeals(currentUser.uid); // Firestore cleanup
              setMeals([]);                          // App state reset
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
      <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
        <div className="toast show bg-success text-white">
          <div className="toast-body fw-bold">{toastMessage}</div>
        </div>
      </div>
    )}

    </>
  );
}

export default App;
