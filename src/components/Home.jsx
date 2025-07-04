import React, {useState} from 'react';
import CaloriesBarChart from './CaloriesBarChart';
import CalorieDonutChart from './CaloriesDonutChart';
import NutritionDonutChart from './NutritionDonutChart';
import MealCard from './MealCard';
import 'bootstrap/dist/css/bootstrap.min.css';
import { color } from 'chart.js/helpers';

function Home({ meals, onEditMeal, setShowDeleteModal, setMealToDelete  }) {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const getMealsByType = (type) => {
    return meals
      .map((meal, index) => ({ ...meal, index })) // Attach index for editing
      .filter((meal) => meal.mealType === type && meal.date === selectedDate);
  };

  return (
    <div className="home-container">
      <p className='TitleName'>Hello Deepan</p>

      <div className='CalBarCharSection'>
        <p className='SubTitleName'>Calories Consumed</p>
        <CaloriesBarChart meals={meals} />
      </div>

      <div className='TodayChartsSection col-md-12'>
        <div className='CalDonutSection'>
          <p className='SubTitleName'>Calorie Intake</p>
          <CalorieDonutChart meals={meals} />
        </div>

        <div className='NutriDonutSection'>
          <p className='SubTitleName'>Nutrition Intake</p>
          <NutritionDonutChart meals={meals} />
        </div>
      </div>

      <div className='FoodItemList'>
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

        <p className='SubTitleName'>Breakfast</p>
        {getMealsByType("Breakfast").map((meal) =>
          meal.foodItems.map((item, i) => (
            <MealCard
              key={`breakfast-${meal.index}-${i}`}
              name={item.name}
              nutrients={item.nutrients}
              onEdit={() => onEditMeal(meal, meal.index)}
              onDelete={() => {
                setMealToDelete(meal.index);
                setShowDeleteModal(true);
              }}

            />
          ))
        )}

        <p className='SubTitleName'>Lunch</p>
        {getMealsByType("Lunch").map((meal) =>
          meal.foodItems.map((item, i) => (
            <MealCard
              key={`lunch-${meal.index}-${i}`}
              name={item.name}
              nutrients={item.nutrients}
              onEdit={() => onEditMeal(meal, meal.index)}
              onDelete={() => {
                setMealToDelete(meal.index);
                setShowDeleteModal(true);
              }}

            />
          ))
        )}

        <p className='SubTitleName'>Dinner</p>
        {getMealsByType("Dinner").map((meal) =>
          meal.foodItems.map((item, i) => (
            <MealCard
              key={`dinner-${meal.index}-${i}`}
              name={item.name}
              nutrients={item.nutrients}
              onEdit={() => onEditMeal(meal, meal.index)}
              onDelete={() => {
                setMealToDelete(meal.index);
                setShowDeleteModal(true);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default Home;
