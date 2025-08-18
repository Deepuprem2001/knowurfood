// SuggestionsTab.jsx
import React, { useEffect, useState } from 'react';
import CaloriesBarChart from './CaloriesBarChart';
import { getWeightLogs } from '../services/dbService'; // ✅ import Firestore logic

function SuggestionsTab({ meals, user }) {
  const [thisWeek, setThisWeek] = useState({});
  const [lastWeek, setLastWeek] = useState({});
  const [behindSchedule, setBehindSchedule] = useState(false); // ✅ alert state

  // ✅ Always show last week's Monday → Sunday range in chart
  const today = new Date();
  const currentDay = today.getDay(); // 0=Sun, 1=Mon...
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

  const thisWeekMonday = new Date(today);
  thisWeekMonday.setDate(today.getDate() + diffToMonday);

  const lastWeekMonday = new Date(thisWeekMonday);
  lastWeekMonday.setDate(thisWeekMonday.getDate() - 7);

  const lastWeekSunday = new Date(lastWeekMonday);
  lastWeekSunday.setDate(lastWeekMonday.getDate() + 6);

  const nutrientTargets = {
    Protein: 50 * 7,
    Carbohydrate: 260 * 7,
    Fat: 70 * 7,
    'Carbs as Sugar': 30 * 7,
    Fibre: 30 * 7,
    Salt: 6 * 7,
  };

  const getWeekRange = (start, end) => {
    const days = [];
    const date = new Date(start);
    while (date <= end) {
      days.push(date.toISOString().split('T')[0]);
      date.setDate(date.getDate() + 1);
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
    const thisWeekDays = getWeekRange(thisWeekMonday, new Date(thisWeekMonday.getTime() + 6 * 86400000));
    const lastWeekDays = getWeekRange(lastWeekMonday, lastWeekSunday);

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

  // Generate natural-language advice based on nutrient type
  const getFriendlyAdvice = (type, avg, target) => {
    const ratio = avg / target;

    if (ratio < 0.6) {
      if (type === "Protein") return " You're low on protein today — add eggs, chicken, or beans to boost it.";
      if (type === "Fibre") return " Fibre intake is low — whole grains, fruits, and veggies can help.";
      if (type === "Carbohydrate") return " Carbs are too low — try rice, bread, or oats for energy.";
      if (type === "Fat") return " Healthy fats are low — nuts, avocado, or olive oil are good sources.";
      return ` Your ${type} intake is low. Consider foods rich in ${type}.`;
    } 
    else if (ratio > 1.2) {
      if (type === "Salt") return "⚠️ Salt intake is high — reduce processed foods and snacks.";
      if (type === "Fat") return "⚠️ You're exceeding fat intake — cut down on fried foods.";
      if (type === "Carbohydrate") return "⚠️ Too many carbs — balance with lean protein.";
      if (type === "Sugar" || type.includes("Sugar")) return "⚠️ Sugar intake is high — cut back on sweets and sodas.";
      return `⚠️ You're exceeding recommended ${type} levels.`;
    }

    return null; // no special advice
  };


  const suggestions = [];
  Object.keys(nutrientTargets).forEach(type => {
    const avg = thisWeek[type] || 0;
    const diff = (thisWeek[type] || 0) - (lastWeek[type] || 0);
    const advice = getFriendlyAdvice(type, avg, nutrientTargets[type]);
    if (advice) {
      suggestions.push(advice);
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
        <p className="SubTitleName mb-2">
          Last Week's Calories ({lastWeekMonday.toLocaleDateString()} - {lastWeekSunday.toLocaleDateString()})
        </p>
        <CaloriesBarChart meals={meals} startOfWeek={lastWeekMonday} />
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
