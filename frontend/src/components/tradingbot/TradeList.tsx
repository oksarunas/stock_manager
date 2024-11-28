import React, { useEffect, useState } from 'react';
import { fetchTrades } from '../../api';
import * as Interfaces from '../../types/interfaces';

const TradeList: React.FC = () => {
  const [trades, setTrades] = useState<Interfaces.Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrades = async () => {
      const result = await fetchTrades(10, 0); // Fetch 10 trades starting from 0
      if (result.success) {
        setTrades(result.data?.trades || []);
      } else {
        console.error("Error fetching trades:", result.error);
      }
      setLoading(false);
    };

    loadTrades();
  }, []);

  return (
    <div>
      <h2 className="text-lg font-bold">Trade List</h2>
      {loading ? (
        <p>Loading trades...</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Profit/Loss</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade, index) => (
              <tr key={index}>
                <td>{trade.timestamp}</td>
                <td>{trade.action}</td>
                <td>${trade.price.toFixed(2)}</td>
                <td>{trade.quantity}</td>
                <td>${trade.profit_loss?.toFixed(2) || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TradeList;
