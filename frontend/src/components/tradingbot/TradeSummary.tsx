import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  useTheme,
  Card,
  CardContent,
  CardHeader,
} from "@mui/material";
import { fetchTradeSummary, fetchProfitLoss } from "../../api";
import * as Interfaces from "../../types/interfaces";
import LineChart from "../charts/LineChart";

const TradeSummary: React.FC = () => {
  const [summary, setSummary] = useState<Interfaces.TradeSummary | null>(null);
  const [profitLossData, setProfitLossData] = useState<
    { timestamp: string; profit_loss: number }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);

  const theme = useTheme();

  useEffect(() => {
    // Fetch Trade Summary
    const fetchSummary = async () => {
      const response = await fetchTradeSummary();
      if (response.success && response.data) {
        setSummary(response.data);
      } else {
        setError("Error fetching trade summary");
        console.error(response.error);
      }
    };

    // Fetch Profit/Loss Data
    const fetchChartData = async () => {
      const response = await fetchProfitLoss();
      if (response.success) {
        setProfitLossData(response.data);
      } else {
        setChartError("Error fetching profit/loss chart data");
      }
    };

    fetchSummary();
    fetchChartData();
  }, []);

  if (error) {
    return (
      <Box
        sx={{
          p: 2,
          bgcolor: theme.palette.error.main,
          borderRadius: theme.shape.borderRadius,
          color: theme.palette.error.contrastText,
        }}
      >
        <Typography variant="body1">{error}</Typography>
      </Box>
    );
  }

  if (!summary) {
    return (
      <Box
        sx={{
          p: 2,
          bgcolor: theme.palette.background.paper,
          borderRadius: theme.shape.borderRadius,
          color: theme.palette.text.primary,
          textAlign: "center",
        }}
      >
        <Typography variant="body1">Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Trade Summary Card */}
      <Card
        sx={{
          boxShadow: 3,
          borderRadius: 2,
          bgcolor: "grey.900",
          mb: 4,
        }}
      >
        <CardHeader title="Trade Summary" sx={{ color: "text.primary" }} />
        <CardContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              <strong>Total Trades:</strong> {summary.total_trades}
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              <strong>Total Realized Profit:</strong> $
              {summary.total_realized_profit.toFixed(2)}
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              <strong>Max Budget Used:</strong> ${summary.budget_used.toFixed(2)}
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              <strong>Last 24h Profit:</strong> $
              {summary.last_24h_profit.toFixed(2)}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Profit/Loss Chart */}
      <Card
        sx={{
          boxShadow: 3,
          borderRadius: 2,
          bgcolor: "grey.900",
          p: 2,
        }}
      >
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
          Profit/Loss Over Time
        </Typography>
        {chartError ? (
          <Typography color="error">{chartError}</Typography>
        ) : profitLossData.length > 0 ? (
          <Box sx={{ height: "300px" }}>
            <LineChart
              labels={profitLossData.map((d) => d.timestamp)}
              dataPoints={profitLossData.map((d) => d.profit_loss)}
              label="Profit/Loss"
              fillArea={true}
            />
          </Box>
        ) : (
          <Typography>No chart data available.</Typography>
        )}
      </Card>
    </Box>
  );
};

export default TradeSummary;
