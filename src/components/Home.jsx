import React, { useState } from 'react';
import CaloriesBarChart from './CaloriesBarChart';
import CalorieDonutChart from './CaloriesDonutChart';
import NutritionDonutChart from './NutritionDonutChart';
import MealCard from './MealCard';
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';

function Home({ meals, onEditMeal, onDeleteMeal, user }) {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const getMealsByType = (type) => {
    return meals.filter((meal) => meal.mealType === type && meal.date === selectedDate);
  };

  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const [startOfWeek, setStartOfWeek] = useState(getMonday(new Date()));

  const handleWeekShift = (days) => {
    const newStart = new Date(startOfWeek);
    newStart.setDate(startOfWeek.getDate() + days);
    setStartOfWeek(newStart);
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB');
  };

  return (
    <div className="home-container">
      <p className="TitleName">Hello {user.firstName}</p>

      <div className="CalBarCharSection bg-dark">
        <div className="d-flex col-md-12 mb-2 justify-content-between">
          <p className="SubTitleName mb-0">Calories Consumed</p>
          <div className="d-flex align-items-center DateRangePicker">
            <span style={{ cursor: 'pointer', marginRight: '10px' }} onClick={() => handleWeekShift(-7)}>◀</span>
            {formatDate(startOfWeek)} – {formatDate(new Date(startOfWeek.getTime() + 6 * 86400000))}
            <span style={{ cursor: 'pointer', marginLeft: '10px' }} onClick={() => handleWeekShift(7)}>▶</span>
          </div>
        </div>
        <CaloriesBarChart meals={meals} startOfWeek={startOfWeek} />
      </div>

      <div className="TodayChartsSection col-md-12">
        <div className="CalDonutSection bg-dark">
          <p className="SubTitleName">Calorie Intake</p>
          <CalorieDonutChart meals={meals} selectedDate={selectedDate} goal={user.calorieGoal} />
        </div>
        <div className="NutriDonutSection bg-dark">
          <p className="SubTitleName">Nutrition Intake</p>
          <NutritionDonutChart meals={meals} selectedDate={selectedDate} />
        </div>
      </div>

      <div className="FoodItemList bg-dark">
        <div className="mb-3" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <label className="text-white" style={{ width: '100%', fontSize: '14px', fontWeight: 'bold', alignContent: 'center' }}>Filter Meals by Date:</label>
          <input
            type="date"
            className="form-control"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={today}
          />
        </div>

        {(user.mealOrder || ["Breakfast", "Lunch", "Dinner"]).map((type) => (
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
                  unit={user.unit || 'g'}
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
