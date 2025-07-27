import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function NutritionDonutChart({ meals, selectedDate }) {
  const today = selectedDate || new Date().toISOString().split('T')[0];
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

  // Only include nutrients with non-zero values
  const entries = [];
  if (protein > 0) entries.push({ label: 'Protein', value: protein, color: '#4CAF50' });
  if (fat > 0)     entries.push({ label: 'Fat', value: fat, color: '#FF9800' });
  if (carbs > 0)   entries.push({ label: 'Carbohydrate', value: carbs, color: '#03A9F4' });
  if (sugar > 0)   entries.push({ label: 'Carbs as Sugar', value: sugar, color: 'teal' });
  if (others > 0)  entries.push({ label: 'Others', value: others, color: 'gray' });

  const data = {
    labels: entries.map(e => e.label),
    datasets: [
      {
        data: entries.map(e => e.value),
        backgroundColor: entries.map(e => e.color),
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


  return (
    <div className="donut-chart" style={{ position: 'relative' }}>
      <Doughnut data={data} options={options} />

    </div>
  );
}

export default NutritionDonutChart;
