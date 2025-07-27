import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale);

function CaloriesBarChart({ meals, startOfWeek }) {
  const getWeekDates = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const getCaloriesForWeek = () => {
    const weekDates = getWeekDates();
    return weekDates.map(date => {
      let total = 0;
      meals
        .filter(meal => meal.date === date)
        .forEach(meal => {
          meal.foodItems.forEach(item => {
            item.nutrients.forEach(n => {
              const val = parseFloat(n.total) || 0;
              if (n.type === "Carbohydrate" || n.type === "Protein") total += val * 4;
              if (n.type === "Fat") total += val * 9;
            });
          });
        });
      return Math.round(total);
    });
  };

  const data = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Calories',
        data: getCaloriesForWeek(),
        backgroundColor: 'deepskyblue',
      },
    ],
  };

  const options = {
    plugins: {
      tooltip: { enabled: true },
      legend: { display: false },
    },
    scales: {
      y: {
        ticks: { color: 'white' },
        grid: { color: '#444' },
      },
      x: {
        ticks: { color: 'white' },
        grid: { color: '#444' },
      },
    },
  };

  return <Bar data={data} options={options} />;
}

export default CaloriesBarChart;
