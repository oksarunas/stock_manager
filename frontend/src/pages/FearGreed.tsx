import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { fetchFearGreedIndex } from "../api";

interface FearGreedData {
  date: string;
  value: number;
}

const FearGreed: React.FC = () => {
  const [fearGreedData, setFearGreedData] = useState<FearGreedData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchFearGreedIndex();
        console.log("FearGreedData:", data); // Log the data fetched
        setFearGreedData(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching Fear & Greed Index:", err);
        setError((err as Error).message || "Failed to fetch data.");
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        <h3>Loading...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-red-500">
        <h3>Error: {error}</h3>
      </div>
    );
  }

  if (!fearGreedData.length) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-red-500">
        <h3>No data available.</h3>
      </div>
    );
  }

  // Prepare chart data
  const chartData = {
    labels: fearGreedData.map((entry) => entry.date), // Dates for the X-axis
    datasets: [
      {
        label: "Fear & Greed Index",
        data: fearGreedData.map((entry) => entry.value), // Values for the Y-axis
        borderColor: "rgba(75,192,192,1)",
        backgroundColor: "rgba(75,192,192,0.2)",
        pointBackgroundColor: "rgba(255,255,255,1)",
        pointBorderColor: "rgba(75,192,192,1)",
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        display: true,
        labels: {
          color: "#FFFFFF",
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#FFFFFF" },
      },
      y: {
        ticks: { color: "#FFFFFF" },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="bg-gray-900 text-white">
      <h2 className="text-center text-2xl font-bold py-4">Fear & Greed Index</h2>
      <div className="max-w-3xl mx-auto">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default FearGreed;
