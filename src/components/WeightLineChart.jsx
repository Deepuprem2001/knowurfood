// components/WeightLineChart.jsx
import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend);

function WeightLineChart({ user, logs = [] }) {
  if (!user.goalDate || !user.goalWeight) return null;

  const [showAll, setShowAll] = useState(false);
  const [dateRange, setDateRange] = useState([null, null]); // [start, end]

  const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));

  // filter logs
  let filtered = sorted;
  if (!showAll && !dateRange[0] && !dateRange[1]) {
    filtered = sorted.slice(-5); // default = last 5
  }
  if (dateRange[0] && dateRange[1]) {
    filtered = sorted.filter((log) => {
      const d = new Date(log.date);
      return d >= dateRange[0] && d <= dateRange[1];
    });
  }

  const data = {
    labels: filtered.map((log) => log.date),
    datasets: [
      {
        label: 'Weight (kg)',
        data: filtered.map((log) => log.weight),
        borderColor: 'deepskyblue',
        backgroundColor: 'rgba(0, 191, 255, 0.2)',
        tension: 0.2,
      },
      {
        label: `Goal (${user.goalWeight}kg by ${user.goalDate})`,
        data: filtered.map(() => user.goalWeight),
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
    <div className="card bg-dark text-white mb-2 shadow-sm" style={{padding:'15px'}}>
      <h6 className="fw-bold mb-2 SubTitleName">Weight Progress</h6>

      {/* Single Date Range Picker + Buttons */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <DatePicker
          selectsRange
          startDate={dateRange[0]}
          endDate={dateRange[1]}
          onChange={(update) => setDateRange(update)}
          isClearable={true}
          dateFormat="yyyy-MM-dd"
          className="form-control"
          placeholderText="Select date range"
        />

        <button
          className="btn btn-sm btn-outline-info"
          onClick={() => setShowAll(true)}
        >
          Show All
        </button>
        <button
          className="btn btn-sm btn-info"
          onClick={() => {
            setDateRange([null, null]);
            setShowAll(false);
          }}
        >
          Last 5
        </button>
      </div>

      <Line data={data} options={options} />
    </div>
  );
}

export default WeightLineChart;
