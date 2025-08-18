import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function NutritionDonutChart({ meals, selectedDate }) {
  const today = selectedDate || new Date().toISOString().split('T')[0];
  const mealsToday = meals.filter(meal => meal.date === today);

  // Step 1: Define allowed nutrient types (from MealCard)
  const ALLOWED = ['Protein', 'Fat', 'Carbohydrate', 'Sugar', 'Fibre', 'Salt', 'Caffeine'];

  // Step 2: Normalize and aggregate nutrient totals
  const totals = {};
  mealsToday.forEach(meal => {
    meal.foodItems.forEach(item => {
      item.nutrients.forEach(n => {
        const type = n.type?.toLowerCase();
        if (!type || type.includes('kcal') || type.includes('calorie')) return; // ❌ Exclude kcal
        const normalized = type.charAt(0).toUpperCase() + type.slice(1); // Capitalize
        if (ALLOWED.includes(normalized)) {
          const value = parseFloat(n.total) || 0;
          totals[normalized] = (totals[normalized] || 0) + value;
        }
      });
    });
  });

  // Step 3: Sort by highest values and keep top 4
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const top4 = sorted.slice(0, 4);
  const others = sorted.slice(4);

  // Step 4: Build chart entries
  const entries = top4.map(([label, value], i) => ({
    label,
    value,
    color: ['#4CAF50', '#FF9800', '#03A9F4', 'teal'][i % 4]
  }));

  if (others.length > 0) {
    const sum = others.reduce((acc, [, val]) => acc + val, 0);
    entries.push({ label: 'Others', value: sum, color: 'gray' });
  }


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

  if (mealsToday.length === 0) {
    return (
      <div className="text-white small text-center p-3" style={{marginTop:'30%'}}>
        No nutrition data for today.
      </div>
    );
  }

  return (
    <div className="donut-chart" style={{ position: 'relative' }}>
      <Doughnut data={data} options={options} />

    </div>
  );
}

export default NutritionDonutChart;
