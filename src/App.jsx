import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import AddMealModal from './components/AddMeal';
import './App.css';

function App() {
  const [showModel, setShowModel] = useState(false);

  const [meals, setMeals] = useState(() => {
    const saved = localStorage.getItem("meals");
    return saved ? JSON.parse(saved) : [];
  });

  const [editMealIndex, setEditMealIndex] = useState(null);
  const [editMealData, setEditMealData] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mealToDelete, setMealToDelete] = useState(null);

  const handleSaveMeal = (mealData) => {
    if (editMealIndex !== null) {
      const updatedMeals = [...meals];
      updatedMeals[editMealIndex] = mealData;
      setMeals(updatedMeals);
      setEditMealIndex(null);
      setEditMealData(null);
    } else {
      setMeals((prev) => [...prev, mealData]);
    }
  };

  const handleDeleteMeal = (index) => {
  const updated = meals.filter((_, i) => i !== index);
  setMeals(updated);
  localStorage.setItem('meals', JSON.stringify(updated)); // ✅ sync to localStorage
  };

  useEffect(() => {
    localStorage.setItem("meals", JSON.stringify(meals));
  }, [meals]);

  return (
    <>
      <Home 
        meals={meals}
        onEditMeal={(meal, index) => {setEditMealData(meal); setEditMealIndex(index); setShowModel(true);} } 
        onDeleteMeal={handleDeleteMeal} 
        setShowDeleteModal = {setShowDeleteModal}
        setMealToDelete = {setMealToDelete}
      />
      <Navbar onAddClick={() => setShowModel(true)} />
      <AddMealModal 
        isOpen={showModel} 
        onClose={() => {setShowModel(false); setEditMealData(null); setEditMealIndex(null);}} 
        onSave={handleSaveMeal} 
        editMeal={editMealData}
        />
        {showDeleteModal && (
          <div className="modal-backdrop">
            <div className="modal-container p-4 text-center">
              <p className='text-white fw-bold'>Are you sure you want to delete this meal?</p>
              <div className="d-flex justify-content-center gap-3 mt-3">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={() => {
                  if (mealToDelete !== null) {
                    const updated = meals.filter((_, i) => i !== mealToDelete);
                    setMeals(updated);
                    localStorage.setItem('meals', JSON.stringify(updated));
                    setShowDeleteModal(false);
                    setMealToDelete(null);
                  }
                }}>
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
