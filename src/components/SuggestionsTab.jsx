// SuggestionsTab.jsx
import React, { useEffect, useState } from 'react';
import CaloriesBarChart from './CaloriesBarChart';
import { getWeightLogs } from '../services/dbService'; // ✅ import Firestore logic

function SuggestionsTab({ meals, user }) {
  const [thisWeek, setThisWeek] = useState({});
  const [lastWeek, setLastWeek] = useState({});
  const [behindSchedule, setBehindSchedule] = useState(false); // ✅ alert state

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 6);

  const nutrientTargets = {
    Protein: 50 * 7,
    Carbohydrate: 260 * 7,
    Fat: 70 * 7,
    'Carbs as Sugar': 30 * 7,
    Fibre: 30 * 7,
    Salt: 6 * 7,
  };

  const getWeekRange = (offset = 0) => {
    const today = new Date();
    const end = new Date(today.setDate(today.getDate() - offset));
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const computeAverages = (days) => {
    const totals = {};
    let daysWithData = 0;

    days.forEach(date => {
      const mealsForDay = meals.filter(m => m.date === date);
      if (mealsForDay.length > 0) {
        daysWithData++;
        mealsForDay.forEach(meal => {
          meal.foodItems.forEach(item => {
            item.nutrients.forEach(n => {
              const val = parseFloat(n.total) || 0;
              totals[n.type] = (totals[n.type] || 0) + val;
            });
          });
        });
      }
    });

    const averages = {};
    Object.keys(totals).forEach(key => {
      averages[key] = totals[key] / daysWithData;
    });

    return averages;
  };

  useEffect(() => {
    const thisWeekDays = getWeekRange(0);
    const lastWeekDays = getWeekRange(7);

    setThisWeek(computeAverages(thisWeekDays));
    setLastWeek(computeAverages(lastWeekDays));
  }, [meals]);

  // ✅ Step 5A – weight goal tracking logic
  useEffect(() => {
    const checkProgress = async () => {
      if (!user?.goalDate || !user?.goalWeight || !user?.currentWeight) return;

      const logs = await getWeightLogs(user.uid);
      if (logs.length === 0) return;

      const startDate = new Date(user.createdAt || logs[0].date);
      const today = new Date();
      const goalDate = new Date(user.goalDate);
      const totalDays = Math.max(1, (goalDate - startDate) / 86400000);
      const daysPassed = Math.max(1, (today - startDate) / 86400000);

      const weightDiff = user.goalWeight - user.currentWeight;
      const expectedChange = (weightDiff / totalDays) * daysPassed;
      const expectedWeight = user.currentWeight + expectedChange;

      const latestWeight = logs.reduce((a, b) => (a.date > b.date ? a : b)).weight;

      if ((weightDiff > 0 && latestWeight < expectedWeight - 0.5) ||
          (weightDiff < 0 && latestWeight > expectedWeight + 0.5)) {
        setBehindSchedule(true);
      }
    };

    checkProgress();
  }, [user]);

  const suggestions = [];
  Object.keys(nutrientTargets).forEach(type => {
    const avg = thisWeek[type] || 0;
    const diff = (thisWeek[type] || 0) - (lastWeek[type] || 0);
    if (avg < 0.6 * nutrientTargets[type]) {
      suggestions.push(`⬇️ Your ${type} intake is quite low this week. Consider improving it.`);
    } else if (avg > 1.2 * nutrientTargets[type]) {
      suggestions.push(`⚠️ You're exceeding recommended ${type} levels.`);
    } else if (diff > 5) {
      suggestions.push(`🔺 ${type} increased significantly this week.`);
    } else if (diff < -5) {
      suggestions.push(`🔻 ${type} dropped since last week.`);
    }
  });

  return (
    <div className="home-container">
      <p className="TitleName">Suggestions</p>

      {behindSchedule && (
        <div className="CalBarCharSection text-white fw-bold small mb-2 bg-dark">
          ⚠️ You're behind your weight goal progress. Try adjusting your intake!
        </div>
      )}

      <div className="CalBarCharSection bg-dark mb-2">
        <p className="SubTitleName mb-2">Weekly Calorie Trend</p>
        <CaloriesBarChart meals={meals} startOfWeek={startOfWeek} />
      </div>

      <div className="NutritionProgressSection mb-2 bg-dark list-group" style={{ padding: '5%' }}>
        <p className="SubTitleName">This Week's Nutrient Averages</p>
        {Object.keys(nutrientTargets).map(type => {
          const avg = thisWeek[type] || 0;
          const target = nutrientTargets[type];
          const diff = (thisWeek[type] || 0) - (lastWeek[type] || 0);
          const percent = Math.min((avg / target) * 100, 150);
          const isOver = avg > target;
          const arrow = diff > 1 ? '▲' : diff < -1 ? '▼' : '•';
          const trend = diff ? `${arrow} ${Math.abs(diff).toFixed(1)}g from last week` : '';

          return (
            <div key={type} className="mb-3">
              <div className="d-flex justify-content-between small">
                <span className="text-white">{type}</span>
                <span className="text-white">{avg.toFixed(1)} / {target}g</span>
              </div>
              <div className="progress" style={{ height: '8px' }}>
                <div
                  className={`progress-bar ${isOver ? 'bg-danger' : 'bg-success'} progress-bar-striped progress-bar-animated`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="small text-white">{trend}</div>
            </div>
          );
        })}
      </div>

      <div className="SuggestionsBox">
        {suggestions.length > 0 ? (
          <ul className="list-group bg-dark" style={{ padding: '5%' }}>
            <p className="SubTitleName">Suggestions</p>
            {suggestions.map((s, i) => (
              <li key={i} className="list-group-item small bg-dark text-white border-0 ps-0">{s}</li>
            ))}
          </ul>
        ) : (
          <p className="text-success">✅ You're on track this week!</p>
        )}
      </div>
    </div>
  );
}

export default SuggestionsTab;
