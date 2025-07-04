import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function CalorieDonutChart({ meals }) {
  const today = new Date().toISOString().split('T')[0];

  const mealsToday = meals.filter(meal => meal.date === today);

  const caloriesToday = mealsToday.reduce((total, meal) => {
    meal.foodItems.forEach(item => {
      item.nutrients.forEach(n => {
        const val = parseFloat(n.total) || 0;
        if (n.type === "Carbohydrate" || n.type === "Protein") total += val * 4;
        if (n.type === "Fat") total += val * 9;
      });
    });
    return total;
  }, 0);

  const remaining = 2000 - caloriesToday;

  const data = {
    labels: ['Calories Consumed'],
    datasets: [
      {
        data: [caloriesToday, remaining > 0 ? remaining : 0],
        backgroundColor: ['aqua', '#00ffff65'],
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
            size: 8,
            weight: 'bold',
          },
          padding: 15,
          boxWidth: 5,
          boxHeight: 5,
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
