import React, { useState } from 'react';
import CaloriesDonutChart from './CaloriesDonutChart';
import NutritionDonutChart from './NutritionDonutChart';
import MealCard from './MealCard';
import WeightLogger from './WeightLogger';
import { useEffect } from 'react';
import { getWeightLogs } from '../services/dbService';


function HistoryTab({ meals, onEditMeal, onDeleteMea, user }) {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const [weightLogs, setWeightLogs] = useState([]);
  const [weightForDate, setWeightForDate] = useState(null);

  useEffect(() => {
    if (user?.uid) {
      getWeightLogs(user.uid).then((logs) => {
        setWeightLogs(logs);
      });
    }
  }, [user]);

  useEffect(() => {
    const log = weightLogs.find(w => w.date === selectedDate);
    setWeightForDate(log?.weight || null);
  }, [selectedDate, weightLogs]);


  const mealsForDate = meals.filter((meal) => meal.date === selectedDate);

  const groupedByMealType = {
    Breakfast: [],
    Lunch: [],
    Dinner: [],
  };

  mealsForDate.forEach((meal) => {
    if (groupedByMealType[meal.mealType]) {
      groupedByMealType[meal.mealType].push(meal);
    }
  });

  return (
    <div className="home-container">
      <h4 className='mb-2 TitleName'>History</h4>  
      <h5 className="SubTitleName">Select a Date</h5>
      <input
        type="date"
        className="form-control mb-3"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        max={today}
      />

      <div className="FoodItemList mb-2 bg-dark">
        <h6 className='SubTitleName mb-2'>Weight Logged: </h6>
        {weightForDate ? (
         <span className="fw-bold text-info">{weightForDate} kg</span>
        ) : (
          <p className="text-muted">No weight logged on {selectedDate}</p>
        )}
      </div>


      <div className="TodayChartsSection d-flex">
        <div className="CalDonutSection bg-dark">
          <CaloriesDonutChart meals={mealsForDate} selectedDate={selectedDate} goal={user.calorieGoal}/>
        </div>
        <div className="NutriDonutSection bg-dark">
          <NutritionDonutChart meals={mealsForDate} selectedDate={selectedDate}/>
        </div>
      </div>

      <div className="FoodItemList bg-dark mt-2">
        {['Breakfast', 'Lunch', 'Dinner'].map((type) => (
          <div key={type} className="mb-3">
            <h6 className="SubTitleName">{type}</h6>
            {groupedByMealType[type].length === 0 && (
              <p className="text-muted ms-2" style={{ fontSize: '13px' }}>
                No meals logged
              </p>
            )}
            {groupedByMealType[type].map((meal, idx) =>
              meal.foodItems.map((item, i) => (
                <MealCard
                  key={`${meal.id}-${i}`}
                  name={item.name}
                  nutrients={item.nutrients}
                  onEdit={() => onEditMeal(meal)}
                  onDelete={() => onDeleteMeal(meal.id)}
                />
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default HistoryTab;
