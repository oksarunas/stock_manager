import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Grid,
} from "@mui/material";
import { Line } from "react-chartjs-2";
import { Link } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { fetchPortfolioPerformance } from "../api";
import { useUser } from "../components/hooks/useUser";
import MarketUpdates from "../components/MarketUpdates";
import { PerformanceResponse, Stock } from "../types/interfaces";
import apiClient from "../api";

const Dashboard = () => {
  const theme = useTheme();
  const { user } = useUser();
  const [performance, setPerformance] = useState<PerformanceResponse | null>(
    null
  );
  const [portfolio, setPortfolio] = useState<Stock[]>([]);
  const [topStock, setTopStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await apiClient.get(`/portfolio/${user.id}`);
      const portfolio: Stock[] = response.data.portfolio;

      const updatedPortfolio = portfolio.map((stock) => {
        const currentPrice = stock.current_price ?? 0;
        const performance =
          ((currentPrice - stock.purchase_price) / stock.purchase_price) * 100;
        return { ...stock, performance };
      });

      setPortfolio(updatedPortfolio);

      const bestStock = updatedPortfolio.reduce<Stock | null>(
        (best, stock) =>
          !best || (stock.performance ?? 0) > (best.performance ?? 0)
            ? stock
            : best,
        null
      );
      setTopStock(bestStock);
    } catch (error) {
      console.error("Failed to fetch portfolio data:", error);
      setError("Failed to fetch portfolio data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchPerformance = useCallback(async () => {
    if (!portfolio.length) return;
    const transformedPortfolio = portfolio.map((stock) => ({
      ticker: stock.ticker,
      quantity: stock.quantity,
      purchase_price: stock.purchase_price,
    }));
    try {
      const response = await fetchPortfolioPerformance(transformedPortfolio);
      if (response.success) setPerformance(response.data);
      else setError(response.error || "Failed to fetch portfolio performance");
    } catch (error) {
      console.error("Error fetching performance data:", error);
      setError("Error fetching performance data");
    }
  }, [portfolio]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  useEffect(() => {
    if (portfolio.length) fetchPerformance();
  }, [portfolio, fetchPerformance]);

  if (loading)
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress color="primary" size={60} />
      </Box>
    );

  if (error)
    return (
      <Typography color="error" variant="h6" align="center" mt={4}>
        {error}
      </Typography>
    );

  const chartData = performance
    ? {
        labels: ["Investment", "Current Value"],
        datasets: [
          {
            label: "Portfolio Value",
            data: [
              performance.total_investment,
              performance.total_current_value,
            ],
            borderColor: "rgba(75, 192, 192, 1)",
            tension: 0.4,
          },
        ],
      }
    : null;

  return (
    <Box sx={{ p: 4, bgcolor: "background.default", minHeight: "100vh" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">
          Welcome Back, {user?.username || "User"}!
        </Typography>
        <Button component={Link} to="/trade" variant="contained">
          Trade Now
        </Button>
      </Box>

      <MarketUpdates />

      <Box sx={{ ...theme.customComponents.BoxStyles, mb: 4 }}>
        <Typography variant="h6" fontWeight="bold">
          Top Performing Stock
        </Typography>
        <Typography>
          {topStock
            ? `${topStock.ticker}: +${topStock.performance?.toFixed(2)}%`
            : "No data available"}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} sm={6}>
          <Box sx={{ ...theme.customComponents.BoxStyles }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Portfolio Performance Summary
            </Typography>
            {performance && (
              <>
                <Typography>
                  Total Investment: ${performance.total_investment.toFixed(2)}
                </Typography>
                <Typography>
                  Total Current Value: $
                  {performance.total_current_value.toFixed(2)}
                </Typography>
                <Typography>
                  ROI:{" "}
                  <span style={{ color: performance.roi >= 0 ? "green" : "red" }}>
                    {performance.roi.toFixed(2)}%
                  </span>
                </Typography>
              </>
            )}
          </Box>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Box sx={{ ...theme.customComponents.BoxStyles }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Portfolio Value Trend
            </Typography>
            <Box sx={{ height: 200 }}>
              {chartData ? <Line data={chartData} /> : <Typography>No data</Typography>}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
