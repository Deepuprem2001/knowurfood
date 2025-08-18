// components/WeightLineChart.jsx
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { getWeightLogs } from '../services/dbService';

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend);

function WeightLineChart({ user, logs = [] }) {

    if (!user.goalDate || !user.goalWeight) return null;

  const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));

  const data = {
    labels: sorted.map((log) => log.date),
    datasets: [
      {
        label: 'Weight (kg)',
        data: sorted.map((log) => log.weight),
        borderColor: 'deepskyblue',
        backgroundColor: 'rgba(0, 191, 255, 0.2)',
        tension: 0.2,
      },
      {
        label: `Goal (${user.goalWeight}kg by ${user.goalDate})`,
        data: sorted.map(() => user.goalWeight),
        borderDash: [5, 5],
        borderColor: 'lime',
        pointRadius: 0,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'PP',
        },
        ticks: {
          color: 'white',
        },
        grid: {
          color: '#444',
        },
      },
      y: {
        ticks: {
          color: 'white',
        },
        grid: {
          color: '#444',
        },
        beginAtZero: false,
      },
    },
    plugins: {
      legend: {
        labels: {
          color: 'white',
        },
      },
    },
  };

  return (
    <div className="card bg-dark text-white p-3 mb-2 shadow-sm">
      <h6 className="fw-bold mb-2 SubTitleName">Weight Progress</h6>
      <Line data={data} options={options} />
    </div>
  );
}

export default WeightLineChart;
