import React, { useEffect, useState, useCallback } from "react";
import { fetchPortfolioPerformance } from "../api";
import { useUser } from "../components/hooks/useUser";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import { PerformanceResponse, Stock } from "../types/interfaces";
import apiClient from "../api";
import { Link } from "react-router-dom";
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
} from "chart.js";

import MarketUpdates from "../components/MarketUpdates"; // Import the MarketUpdates component

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
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

      // Calculate performance for each stock and update the portfolio
      const updatedPortfolio = portfolio.map((stock) => {
        const currentPrice = stock.current_price ?? 0;
        const performance =
          ((currentPrice - stock.purchase_price) / stock.purchase_price) * 100;
        return { ...stock, performance }; // Add performance field
      });

      setPortfolio(updatedPortfolio);

      // Determine the top-performing stock
      const bestStock = updatedPortfolio.reduce<Stock | null>(
        (best, stock) => {
          if (!best) {
            return stock;
          }
          return (stock.performance ?? 0) > (best.performance ?? 0)
            ? stock
            : best;
        },
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
    if (portfolio.length === 0) return;

    const transformedPortfolio = portfolio.map((stock) => ({
      ticker: stock.ticker,
      quantity: stock.quantity,
      purchase_price: stock.purchase_price,
    }));

    try {
      const response = await fetchPortfolioPerformance(transformedPortfolio);
      if (response.success) {
        setPerformance(response.data);
      } else {
        setError(response.error || "Failed to fetch portfolio performance");
      }
    } catch (error) {
      console.error("Error fetching performance data:", error);
      setError("Error fetching performance data");
    }
  }, [portfolio]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  useEffect(() => {
    if (portfolio.length > 0) {
      fetchPerformance();
    }
  }, [portfolio, fetchPerformance]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchPortfolio();
    }, 600000);

    return () => clearInterval(interval);
  }, [fetchPortfolio]);

  if (loading) {
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
  }

  if (error) {
    return (
      <Typography color="error" variant="h6" align="center" mt={4}>
        {error}
      </Typography>
    );
  }

  if (!loading && portfolio.length === 0) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
        <Typography variant="h6" color="text.secondary">
          Your portfolio is currently empty.
        </Typography>
        <Button
          component={Link}
          to="/trade"
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
        >
          Start Trading
        </Button>
      </Box>
    );
  }

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
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 2,
            tension: 0.4, // Smooth curve
          },
        ],
      }
    : null;

  return (
    <Box sx={{ p: 4, bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Header Section */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography variant="h4" fontWeight="bold">
          Welcome Back, {user?.username || "User"}!
        </Typography>
        <Button
          component={Link}
          to="/trade"
          variant="contained"
          color="primary"
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: "8px",
            boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)",
            "&:hover": { backgroundColor: "#2563eb" },
          }}
        >
          Trade Now
        </Button>
      </Box>

      {/* Market Updates */}
      <MarketUpdates />

      {/* Performance Highlights */}
      <Box mb={4}>
        <Card
          sx={{
            bgcolor: "#1f2937",
            boxShadow: "0 0 15px 5px rgba(123, 255, 123, 0.5)",
            borderRadius: "8px",
            p: 2,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Top Performing Stock
          </Typography>
          {topStock ? (
            <Typography>
              {topStock.ticker}: +{topStock.performance?.toFixed(2)}%
            </Typography>
          ) : (
            <Typography>No data available</Typography>
          )}
        </Card>
      </Box>

      {/* Cards Section */}
      <Grid container spacing={4}>
        <Grid item xs={12} sm={6}>
          <Card sx={{ boxShadow: "0 0 15px 5px rgba(59, 130, 246, 0.5)" }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Portfolio Performance Summary
              </Typography>
              {performance && (
                <>
                  <Typography>
                    Total Investment: $
                    {performance.total_investment.toFixed(2)}
                  </Typography>
                  <Typography>
                    Total Current Value: $
                    {performance.total_current_value.toFixed(2)}
                  </Typography>
                  <Typography>
                    ROI:{" "}
                    <span
                      style={{
                        color: performance.roi >= 0 ? "green" : "red",
                      }}
                    >
                      {performance.roi.toFixed(2)}%{" "}
                      {performance.roi >= 0 ? "▲" : "▼"}
                    </span>
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card sx={{ boxShadow: "0 0 15px 5px rgba(59, 130, 246, 0.5)" }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Portfolio Value Trend
              </Typography>
              <Box sx={{ height: 200 }}>
                {chartData ? (
                  <Line data={chartData} />
                ) : (
                  <Typography>No data to display</Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
