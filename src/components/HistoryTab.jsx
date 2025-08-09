import React, { useEffect, useState } from 'react';
import CaloriesDonutChart from './CaloriesDonutChart';
import NutritionDonutChart from './NutritionDonutChart';
import { getWeightLogs } from '../services/dbService';

function HistoryTab({ user, meals }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const mealsForDate = meals.filter(meal => meal.date === selectedDate);
  const [weightLogs, setWeightLogs] = useState([]);

  useEffect(() => {
    if (user?.uid) {
      getWeightLogs(user.uid).then(setWeightLogs);
    }
  }, [user]);

  const changeDateBy = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);

    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize to start of day

    if (newDate > today) return; // prevent going past today

    setSelectedDate(newDate.toISOString().split("T")[0]);
  };


  const exportMealsAsJSON = (meals, date) => {
    const blob = new Blob([JSON.stringify(meals, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `meals-${date}.json`;
    link.click();
  };

  const exportMealsAsCSV = (meals, date) => {
    const rows = [["Food Name", "Calories", "Protein", "Fat", "Carbohydrate", "Sugar", "Salt", "Fibre"]];
    meals.forEach(meal => {
      meal.foodItems.forEach(item => {
        const row = [
          item.name,
          item.kcal || '',
          ...["Protein", "Fat", "Carbohydrate", "Sugar", "Salt", "Fibre"].map(nutrient => {
            const n = item.nutrients.find(n => n.type === nutrient);
            return n?.total || '';
          })
        ];
        rows.push(row);
      });
    });

    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `meals-${date}.csv`;
    link.click();
  };

  const filteredMeals = mealsForDate.filter(meal =>
    meal.foodItems.some(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nutrients.some(n => n.type.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  const DAILY_TARGETS = {
    Protein: 50,
    Carbohydrate: 260,
    Fat: 70,
    Sugar: 30,
    Fibre: 30,
    Salt: 6,
  };

  const getNutrientTotals = () => {
    const totals = {};
    mealsForDate.forEach(meal =>
      meal.foodItems.forEach(item =>
        item.nutrients.forEach(n => {
          const t = parseFloat(n.total) || 0;
          totals[n.type] = (totals[n.type] || 0) + t;
        })
      )
    );
    return totals;
  };

  const nutrientTotals = getNutrientTotals();
  const weightForDate = weightLogs.find(log => log.date === selectedDate)?.weight || null;

  return (
    <div className="home-container">
      <h5 className="TitleName">History</h5>

      {/* 📅 Date Selector */}
      <div className="d-flex align-items-center gap-2 mb-2 DateRangePicker">
        <span style={{ cursor: 'pointer', marginRight: '10px' }} onClick={() => changeDateBy(-1)}>◀</span>
        <input
          type="date"
          className="form-control"
          value={selectedDate}
          max={new Date().toISOString().split("T")[0]}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ maxWidth: '150px' }}
        />
        <span style={{ cursor: 'pointer', marginLeft: '10px' }} onClick={() => changeDateBy(1)}>▶</span>
      </div>

      {/* 📤 Export Buttons */}
      <div className="d-flex gap-2 mb-2">
        <button className="btn btn-outline-info btn-sm" onClick={() => exportMealsAsJSON(mealsForDate, selectedDate)}>Export JSON</button>
        <button className="btn btn-outline-info btn-sm" onClick={() => exportMealsAsCSV(mealsForDate, selectedDate)}>Export CSV</button>
      </div>

      {/* 🔍 Search Input */}
      <input
        type="text"
        className="form-control mb-3"
        placeholder="🔍 Search food or nutrient..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {weightForDate !== null && (
        <div className="mb-2 text-white FoodItemList">
          <strong>Weight Logged:</strong> {weightForDate} kg
        </div>
      )}

      {/* If no meals for this date */}
      {mealsForDate.length === 0 ? (
        <div className="text-center text-white mt-4">
          <p className="fw-bold">📅 No data available for {selectedDate}</p>
          <p className="small ">Try selecting a different date or log a meal to see your history.</p>
        </div>
      ) : (
        <>
          {/* Charts */}
          <div className="TodayChartsSection mb-3">
            <div className="CalDonutSection">
              <CaloriesDonutChart meals={mealsForDate} goal={user.calorieGoal} selectedDate={selectedDate} />
            </div>
            <div className="NutriDonutSection">
              <NutritionDonutChart meals={mealsForDate} selectedDate={selectedDate}/>
            </div>
          </div>

          {/* Daily Goal Bars */}
          <div className="bg-dark p-3 rounded mb-3">
            <p className="SubTitleName mb-2">Daily Goal Progress</p>
            {Object.entries(DAILY_TARGETS).map(([type, goal]) => {
              const value = nutrientTotals[type] || 0;
              const percent = Math.min((value / goal) * 100, 100);
              return (
                <div key={type} className="mb-2">
                  <div className="d-flex justify-content-between small text-white">
                    <span>{type}</span>
                    <span>{value.toFixed(1)} / {goal}g</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div
                      className={`progress-bar ${value >= goal ? 'bg-success' : 'bg-warning'} progress-bar-striped progress-bar-animated`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Meal List */}
          {filteredMeals.map((meal, i) => (
            <div key={i} className="FoodItemList">
              <h6 className="SubTitleName">{meal.mealType}</h6>
              {meal.foodItems.map((item, idx) => (
                <div key={idx} className="card bg-dark text-white p-2 mb-2">
                  <p className="fw-bold mb-1">{item.name}</p>
                  <p className="mb-1">Calories: {item.kcal} kcal</p>
                  {item.nutrients.map((n, ni) => (
                    <p key={ni} className="mb-0">
                      {n.type}: {n.total} {n.unit || 'g'}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default HistoryTab;
