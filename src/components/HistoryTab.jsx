import React, { useState } from 'react';
import CaloriesDonutChart from './CaloriesDonutChart';
import NutritionDonutChart from './NutritionDonutChart';
import MealCard from './MealCard';

function HistoryTab({ meals, onEditMeal, onDeleteMeal }) {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

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

      <div className="TodayChartsSection d-flex">
        <div className="CalDonutSection bg-dark">
          <CaloriesDonutChart meals={mealsForDate} selectedDate={selectedDate}/>
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
