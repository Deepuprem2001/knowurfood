import React, { useState } from 'react';
import CaloriesBarChart from './CaloriesBarChart';
import CalorieDonutChart from './CaloriesDonutChart';
import NutritionDonutChart from './NutritionDonutChart';
import MealCard from './MealCard';
import WeightLogger from './WeightLogger'; // ✅ NEW IMPORT
import WeightLineChart from './WeightLineChart'; // ✅ NEW IMPORT
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

  const calculateBMI = (weight, height) => {
  if (!weight || !height) return null;
  const h = height / 100;
  return weight / (h * h);
};

const getBMICategory = (bmi) => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

const bmi = calculateBMI(user.currentWeight, user.height);
const bmiCategory = getBMICategory(bmi);
const bmiPercent = Math.min((bmi / 40) * 100, 100); // scale to 100%


  return (
    <div className="home-container">
      <div className="d-flex align-items-center justify-content-between flex-wrap mb-3">
        <p className="TitleName mb-1">Hello {user.firstName}</p>
        <div className="text-end">
          <span className="small fw-bold" style={{ color: 'deepskyblue' }}>Level {level}</span>
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

      {/* ✅ Weight tracker UI */}

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

      <WeightLineChart user={user} />

      {bmi && (
        <div className="card bg-dark text-white p-3 mb-3 shadow-sm text-center">
          <h6 className="fw-bold mb-2 SubTitleName">Your BMI</h6>
          <p className="fs-5 mb-1">
            {bmi.toFixed(1)} – <span className="fw-bold text-info">{bmiCategory}</span>
          </p>
          
          <div className="progress bmi-progress mb-1" style={{ height: '15px' }}>
            <div
              className={`progress-bar ${bmiCategory.toLowerCase()}-bar`}
              role="progressbar"
              style={{ width: `${bmiPercent}%` }}
              aria-valuenow={bmiPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            ></div>
          </div>

          <div className="d-flex justify-content-between text-muted small px-2">
            <span>Underweight</span>
            <span>Normal</span>
            <span>Overweight</span>
            <span>Obese</span>
          </div>
        </div>
      )}



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
                  kcal={meal.kcal || null}  // ✅ pass kcal to MealCard
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
