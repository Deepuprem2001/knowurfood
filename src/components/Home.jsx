import React, { useState } from 'react';
import CaloriesBarChart from './CaloriesBarChart';
import CalorieDonutChart from './CaloriesDonutChart';
import NutritionDonutChart from './NutritionDonutChart';
import MealCard from './MealCard';
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';

  const getXPProgress = (xp) => {
  const level = Math.floor(xp / 100) + 1;
  const currentXP = xp % 100;
  const nextXP = 100;
  const percent = (currentXP / nextXP) * 100;
  return { level, currentXP, nextXP, percent };
  };


function Home({ meals, onEditMeal, onDeleteMeal, user }) {
  const { level, currentXP, nextXP, percent } = getXPProgress(user.xp || 0);
  const selectedDate = new Date().toISOString().split('T')[0];

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
      <div className="d-flex align-items-center justify-content-between flex-wrap mb-3">
        <p className="TitleName mb-1">Hello {user.firstName}</p>
        <div className="text-end">
          <span className="small fw-bold" style={{color:'deepskyblue'}}>Level {level}</span>
          <div className="progress" style={{ height: '6px', width: '150px', background: '#444' }}>
            <div
              className="progress-bar"
              role="progressbar"
              style={{ width: `${percent}%`, backgroundColor: 'deepskyblue' }}
              aria-valuenow={currentXP}
              aria-valuemin={0}
              aria-valuemax={nextXP}
            ></div>
          </div>
        </div>
      </div>

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

        {(user.mealOrder || ["Breakfast", "Lunch", "Dinner"]).map((type) => (
          <div key={type} className='mb-3'>
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
