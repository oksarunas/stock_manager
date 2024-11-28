import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { fetchFearGreedIndex } from "../api";

interface FearGreedData {
  score: string;
  rating: string;
  previous_close: string;
  previous_1_week: string;
  previous_1_month: string;
  previous_1_year: string;
}

const FearGreed: React.FC = () => {
  const [fearGreedData, setFearGreedData] = useState<FearGreedData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return "An unknown error occurred";
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data: FearGreedData = await fetchFearGreedIndex();
        setFearGreedData(data);
        setLoading(false);
      } catch (error) {
        setError((error as Error).message);
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

  if (!fearGreedData) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-red-500">
        <h3>Failed to load data. Please try again later.</h3>
      </div>
    );
  }

  const chartData = {
    labels: ["Current", "1 Week Ago", "1 Month Ago", "1 Year Ago"],
    datasets: [
      {
        label: "Fear & Greed Index",
        data: [
          Number(fearGreedData.score),
          Number(fearGreedData.previous_1_week),
          Number(fearGreedData.previous_1_month),
          Number(fearGreedData.previous_1_year),
        ],
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
