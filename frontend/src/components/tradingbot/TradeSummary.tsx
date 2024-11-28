import React, { useEffect, useState } from "react";
import { fetchTradeSummary } from "../../api";
import * as Interfaces from "../../types/interfaces";

const TradeSummary: React.FC = () => {
  const [summary, setSummary] = useState<Interfaces.TradeSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      const response = await fetchTradeSummary();
      if (response.success && response.data) {
        setSummary(response.data);
      } else {
        setError("Error fetching trade summary");
        console.error(response.error);
      }
    };

    fetchSummary();
  }, []);

  if (error) {
    return <div>{error}</div>;
  }

  if (!summary) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Trade Summary</h2>
      <p>Total Trades: {summary.total_trades}</p>
      <p>Total Realized Profit: ${summary.total_realized_profit.toFixed(2)}</p>
      <p>Max Budget Used: ${summary.budget_used.toFixed(2)}</p>
      <p>Last 24h Profit: ${summary.last_24h_profit.toFixed(2)}</p>
    </div>
  );
};

export default TradeSummary;
