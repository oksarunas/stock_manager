import React from "react";
import { Box, Typography, useTheme, Button } from "@mui/material";
import TradesTable from "../components/tradingbot/TradeTable";
import TradeSummary from "../components/tradingbot/TradeSummary";
import { Link } from "react-router-dom";

const TradeBot: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 4,
        bgcolor: theme.palette.background.default,
        minHeight: "100vh",
        color: theme.palette.text.primary,
      }}
    >
      {/* Navigation */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="text.primary">
          Trading Bot
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button component={Link} to="/trade" variant="contained" color="primary">
          Trade Stocks
        </Button>
      </Box>

      {/* Trade Summary */}
      <TradeSummary />

      {/* Trades Table */}
      <TradesTable />
    </Box>
  );
};

export default TradeBot;
