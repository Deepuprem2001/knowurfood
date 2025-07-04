import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale);

function CaloriesBarChart({ meals }) {
  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const [startOfWeek, setStartOfWeek] = useState(getMonday(new Date()));

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
        backgroundColor: '#4CAF50',
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

  // Format date as dd/mm/yyyy
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB');
  };

  const handleWeekShift = (days) => {
    const newStart = new Date(startOfWeek);
    newStart.setDate(startOfWeek.getDate() + days);
    setStartOfWeek(newStart);
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-center text-warning fw-bold mb-3">
        <span
          style={{ cursor: 'pointer', marginRight: '10px' }}
          onClick={() => handleWeekShift(-7)}
        >
          ◀️
        </span>
        {formatDate(startOfWeek)} – {formatDate(new Date(startOfWeek.getTime() + 6 * 86400000))}
        <span
          style={{ cursor: 'pointer', marginLeft: '10px' }}
          onClick={() => handleWeekShift(7)}
        >
          ▶️
        </span>
      </div>
      <Bar data={data} options={options} />
    </div>
  );
}

export default CaloriesBarChart;
