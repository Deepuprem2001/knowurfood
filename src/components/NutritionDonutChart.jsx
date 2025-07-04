import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function NutritionDonutChart({ meals }) {
  const today = new Date().toISOString().split('T')[0];
  const mealsToday = meals.filter(meal => meal.date === today);

  const totals = {};
  mealsToday.forEach(meal => {
    meal.foodItems.forEach(item => {
      item.nutrients.forEach(n => {
        const value = parseFloat(n.total) || 0;
        totals[n.type] = (totals[n.type] || 0) + value;
      });
    });
  });

  const protein = totals.Protein || 0;
  const fat = totals.Fat || 0;
  const carbs = totals.Carbohydrate || 0;
  const sugar = totals["Carbs as Sugar"] || 0;

  const others = Object.entries(totals)
    .filter(([key]) => !["Protein", "Fat", "Carbohydrate", "Carbs as Sugar"].includes(key))
    .reduce((sum, [, val]) => sum + val, 0);

  const data = {
    labels: ['Protein', 'Fat', 'Carbohydrate', 'Carbs as Sugar', 'Others'],
    datasets: [
      {
        data: [protein, fat, carbs, sugar, others],
        backgroundColor: ['#4CAF50', '#FF9800', '#03A9F4', 'teal', 'gray'],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    cutout: '85%',
    plugins: {
      tooltip: {
        enabled: true,
      },
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: 'white',
          font: {
            size: 8,
            weight: 'bold',
          },
          padding: 5,
          boxWidth: 5,
          boxHeight: 5,
        },
      },
    },
  };

  const totalGrams = protein + fat + carbs + sugar + others;

  return (
    <div className="donut-chart" style={{ position: 'relative' }}>
      <Doughnut data={data} options={options} />
      <div className='DonutWordings'>
        {totalGrams}g
      </div>
    </div>
  );
}

export default NutritionDonutChart;
