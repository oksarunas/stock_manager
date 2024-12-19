// src/components/charts/LineChart.tsx
import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register chart.js components here if not globally registered
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Define a type for your props
interface CustomLineChartProps {
  labels: string[];
  dataPoints: number[];
  label: string;
  fillArea?: boolean;
}

// A function to generate a standard dataset config
function createDataset(label: string, dataPoints: number[], fill: boolean) {
  return {
    label,
    data: dataPoints,
    borderColor: "rgba(75, 192, 192, 1)",
    backgroundColor: fill ? "rgba(75, 192, 192, 0.2)" : "rgba(0,0,0,0)",
    tension: 0.4,
    fill: fill,
    pointRadius: 0, // possibly remove points for a cleaner line
    borderWidth: 2, // consistent line thickness
  };
}

const LineChart: React.FC<CustomLineChartProps> = ({
  labels,
  dataPoints,
  label,
  fillArea = false,
}) => {
  const chartData = {
    labels,
    datasets: [createDataset(label, dataPoints, fillArea)],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false as const,
    scales: {
      x: {
        ticks: {
          color: "#555", // consistent font color
          font: {
            family: "Roboto, sans-serif", // use a consistent font
            size: 12,
          },
        },
        grid: {
          display: false, // uniform decision if you want no vertical grid lines
        },
      },
      y: {
        ticks: {
          color: "#555",
          font: {
            family: "Roboto, sans-serif",
            size: 12,
          },
        },
        grid: {
          color: "rgba(200, 200, 200, 0.3)", // light grid lines
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: "#333",
          font: {
            family: "Roboto, sans-serif",
            size: 14,
          },
        },
      },
      tooltip: {
        enabled: true,
        titleFont: { family: "Roboto, sans-serif", size: 14},
        bodyFont: { family: "Roboto, sans-serif", size: 12 },
        backgroundColor: "rgba(0,0,0,0.7)",
      },
    },
  };

  return <Line data={chartData} options={chartOptions} />;
};

export default LineChart;
