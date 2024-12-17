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
import { fetchPortfolioPerformance, fetchPortfolioTrend } from "../api";
import { useUser } from "../components/hooks/useUser";
import MarketUpdates from "../components/MarketUpdates";
import { PerformanceResponse, Stock, PortfolioTrendEntry } from "../types/interfaces";
import apiClient from "../api";

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const { user } = useUser();
  const [performance, setPerformance] = useState<PerformanceResponse | null>(null);
  const [portfolio, setPortfolio] = useState<Stock[]>([]);
  const [topStock, setTopStock] = useState<Stock | null>(null);
  const [trendData, setTrendData] = useState<PortfolioTrendEntry[]>([]);
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

  const fetchPortfolioTrendData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await fetchPortfolioTrend(user.id);
      setTrendData(response.trend);
    } catch (error) {
      console.error("Failed to fetch portfolio trend data:", error);
      setError("Failed to fetch portfolio trend data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchPerformance = useCallback(async () => {
    if (!portfolio.length) return;
    try {
      const transformedPortfolio = portfolio.map((stock) => ({
        ticker: stock.ticker,
        quantity: stock.quantity,
        purchase_price: stock.purchase_price,
      }));
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
    fetchPortfolioTrendData();
  }, [fetchPortfolio, fetchPortfolioTrendData]);

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

  const today = new Date().toISOString().split("T")[0];
  const filteredTrendData = trendData.filter((entry) => entry.date !== today);

  const chartData = {
    labels: filteredTrendData.map((entry) => entry.date),
    datasets: [
      {
        label: "Portfolio Value",
        data: filteredTrendData.map((entry) => entry.portfolio_value),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.4,
        fill: false,
      },
    ],
  };

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
            <Box sx={{ position: 'relative',  minHeight: '200px', width: '100%'}}>
              {filteredTrendData.length > 0 ? (
                <Line data={chartData} />
              ) : (
                <Typography>No data available</Typography>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
