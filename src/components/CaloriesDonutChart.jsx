import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function CalorieDonutChart({ meals, selectedDate, goal = 2000 }) {
  const today = selectedDate || new Date().toISOString().split('T')[0];
  const mealsToday = meals.filter(meal => meal.date === today);

  const caloriesToday = mealsToday.reduce((total, meal) => {
    if (meal.kcal) {
      return total + meal.kcal;
    }

    let mealKcal = 0;
    meal.foodItems.forEach(item => {
      item.nutrients.forEach(n => {
        const val = parseFloat(n.total) || 0;
        if (n.type === "Carbohydrate" || n.type === "Protein") mealKcal += val * 4;
        if (n.type === "Fat") mealKcal += val * 9;
      });
    });

    return total + mealKcal;
  }, 0);

  const roundedCalories = Math.round(caloriesToday)
  const remaining = goal - roundedCalories;

  const data = {
    labels: ['Calories Consumed'],
    datasets: [
      {
        data: [caloriesToday, remaining > 0 ? remaining : 0],
        backgroundColor: ['deepskyblue', '#a9c9f8ff'],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    cutout: '85%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: 'white',
          font: {
            size: 12,
            weight: 'bold',
          },
          padding: 15,
          boxWidth: 10,
          boxHeight: 10,
        },
      },
    },
  };

  return (
    <div className="donut-chart" style={{ position: 'relative' }}>
      <Doughnut data={data} options={options} />
      <div className='DonutWordings'>
        {remaining > 0 ? `${remaining} Remaining` : 'Goal Reached'}
      </div>
    </div>
  );
}

export default CalorieDonutChart;
