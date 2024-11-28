// frontend/src/pages/TradeBot.tsx
import React from "react";
import TradesTable from "../components/tradingbot/TradeTable";
import TradeSummary from "../components/tradingbot/TradeSummary";

const TradeBot: React.FC = () => {
  return (
    <div>
      <h1>Trading Bot</h1>
      <TradeSummary />
      <TradesTable />
    </div>
  );
};

export default TradeBot;
