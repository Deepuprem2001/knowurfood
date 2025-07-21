import React, { useState } from 'react';
import CaloriesBarChart from './CaloriesBarChart';
import CalorieDonutChart from './CaloriesDonutChart';
import NutritionDonutChart from './NutritionDonutChart';
import MealCard from './MealCard';
import 'bootstrap/dist/css/bootstrap.min.css';

function Home({ meals, onEditMeal, onDeleteMeal }) {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const getMealsByType = (type) => {
    return meals
      .filter((meal) => meal.mealType === type && meal.date === selectedDate);
  };

  return (
    <div className="home-container">
      <p className="TitleName">Hello Deepan</p>

      <div className="CalBarCharSection">
        <p className="SubTitleName">Calories Consumed</p>
        <CaloriesBarChart meals={meals} />
      </div>

      <div className="TodayChartsSection col-md-12">
        <div className="CalDonutSection">
          <p className="SubTitleName">Calorie Intake</p>
          <CalorieDonutChart meals={meals} />
        </div>
        <div className="NutriDonutSection">
          <p className="SubTitleName">Nutrition Intake</p>
          <NutritionDonutChart meals={meals} />
        </div>
      </div>

      <div className="FoodItemList">
        <div className="mb-3" style={{ maxWidth: '200px' }}>
          <label className="text-white">Filter Meals by Date:</label>
          <input
            type="date"
            className="form-control"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={today}
          />
        </div>

        {["Breakfast", "Lunch", "Dinner"].map((type) => (
          <div key={type}>
            <p className="SubTitleName">{type}</p>
            {getMealsByType(type).map((meal) =>
              meal.foodItems.map((item, i) => (
                <MealCard
                  key={`${type}-${meal.id}-${i}`}
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

export default Home;
