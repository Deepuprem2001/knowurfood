import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import AddMealModal from './components/AddMeal';
import AuthPage from './components/AuthPage';
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
  const [showModel, setShowModel] = useState(false);
  const [editMealData, setEditMealData] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mealToDelete, setMealToDelete] = useState(null);

  // Load user session + meals on first render
  useEffect(() => {
    const loadUserAndMeals = async () => {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUser(user);
        const data = await getAllMeals();
        setMeals(data);
      }
    };
    loadUserAndMeals();
  }, []);

  const handleLoginSuccess = async (user) => {
    setCurrentUser(user);
    const data = await getAllMeals();
    setMeals(data);
  };

  const handleSaveMeal = async (mealData) => {
    if (!currentUser) return;
    const fullData = { ...mealData, userId: currentUser.id };

    if (editMealData) {
      await updateMeal({ ...fullData, id: editMealData.id });
      const updated = meals.map((m) =>
        m.id === editMealData.id ? { ...fullData, id: editMealData.id } : m
      );
      setMeals(updated);
      setEditMealData(null);
    } else {
      await addMeal(fullData);
      const all = await getAllMeals();
      setMeals(all);
    }
    setShowModel(false);
  };

  const handleDeleteMeal = async (id) => {
    await deleteMeal(id);
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

  return (
    <>
      <Home
        meals={meals}
        onEditMeal={(meal) => {
          setEditMealData(meal);
          setShowModel(true);
        }}
        onDeleteMeal={(id) => {
          setMealToDelete(id);
          setShowDeleteModal(true);
        }}
        setShowDeleteModal={setShowDeleteModal}
        setMealToDelete={setMealToDelete}
      />
      <Navbar
        onAddClick={() => setShowModel(true)}
        onLogout={handleLogout}
        username={currentUser.username}
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
    </>
  );
}

export default App;
