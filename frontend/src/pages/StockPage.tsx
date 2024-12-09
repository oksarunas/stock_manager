// src/pages/StockPage.tsx

import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  ButtonGroup,
} from "@mui/material";
import { Line } from "react-chartjs-2";
import { useParams } from "react-router-dom";
import { useUser } from "../components/hooks/useUser";
import {
  fetchHistoricalPrices,
  fetchCompanyInfo,
  getTransactions,
} from "../api";
import {
  StockPriceData,
  Transaction,
  CompanyInfo,
} from "../types/interfaces";

// Import and register the Chart.js Filler plugin to fix the fill warning
import { Chart, Filler } from 'chart.js';
Chart.register(Filler);

const StockPage: React.FC = () => {
  const { ticker } = useParams<Record<string, string>>();
  const { user } = useUser();

  const [priceData, setPriceData] = useState<StockPriceData[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [financialData, setFinancialData] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<string>("1mo");

  console.log("StockPage render:", { ticker, user });

  const fetchStockData = useCallback(async () => {
    // If ticker or user are not available yet, do not fetch
    if (!ticker) {
      console.error("No ticker provided in URL");
      setError("Ticker is missing in the URL.");
      return;
    }

    if (!user || !user.id) {
      // Instead of showing error, let's just log and return until user is available
      console.warn("User is not available yet, waiting before fetching data.");
      return;
    }

    console.log("Fetching stock data for ticker:", ticker, "and range:", range);
    setLoading(true);
    try {
      // Fetch historical price data
      const priceResponse = await fetchHistoricalPrices(ticker, range);
      console.log("priceResponse:", priceResponse);
      if (priceResponse.success && priceResponse.data) {
        setPriceData(priceResponse.data);
      } else {
        throw new Error(
          priceResponse.error || "Failed to fetch historical prices."
        );
      }

      // Fetch financial data
      const financialResponse = await fetchCompanyInfo(ticker);
      console.log("financialResponse:", financialResponse);
      if (financialResponse.success && financialResponse.data) {
        setFinancialData(financialResponse.data);
      } else {
        throw new Error(
          financialResponse.error || "Failed to fetch financial data."
        );
      }

      // Fetch recent transactions now that user is defined
      console.log("Fetching transactions for user ID:", user.id);
      const transactionsResponse = await getTransactions(user.id);
      console.log("transactionsResponse:", transactionsResponse);
      if (transactionsResponse.success && transactionsResponse.data) {
        const filteredTransactions = transactionsResponse.data.filter(
          (tx) => tx.ticker.toUpperCase() === ticker.toUpperCase()
        );
        setTransactions(filteredTransactions);
      } else {
        throw new Error(
          transactionsResponse.error || "Failed to fetch transactions."
        );
      }

    } catch (error: any) {
      console.error("Failed to fetch stock data:", error);
      setError(error.message || "Failed to fetch stock data.");
    } finally {
      setLoading(false);
    }
  }, [ticker, range, user]);

  useEffect(() => {
    // Only call fetchStockData if we have a ticker and a user
    if (ticker && user && user.id) {
      fetchStockData();
    }
  }, [fetchStockData, ticker, user]);

  // If user is null, we are waiting for user data to load. Show a loading spinner.
  if (user === null) {
    console.log("User is null, waiting for user data to load.");
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

  // Handle loading state while fetching data
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

  // Handle errors
  if (error) {
    return (
      <Typography color="error" variant="h6" align="center" mt={4}>
        {error}
      </Typography>
    );
  }

  // Prepare chart data
  const chartData = {
    labels: priceData.map((data) => data.date),
    datasets: [
      {
        label: `${ticker} Price`,
        data: priceData.map((data) => data.close),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Define available ranges
  const ranges = [
    { label: "1D", value: "1d" },
    { label: "5D", value: "5d" },
    { label: "1W", value: "1wk" },
    { label: "1M", value: "1mo" },
    { label: "3M", value: "3mo" },
    { label: "6M", value: "6mo" },
    { label: "1Y", value: "1y" },
    { label: "5Y", value: "5y" },
    { label: "Max", value: "max" },
  ];

  return (
    <Box sx={{ p: 4, bgcolor: "background.default", minHeight: "100vh" }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {ticker} Stock Details
      </Typography>

      {/* Price Chart */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Price Chart
        </Typography>
        {/* Range Selection Buttons */}
        <ButtonGroup variant="outlined" sx={{ mb: 2 }}>
          {ranges.map((r) => (
            <Button
              key={r.value}
              variant={range === r.value ? "contained" : "outlined"}
              onClick={() => {
                console.log("Changing range to:", r.value);
                setRange(r.value);
              }}
            >
              {r.label}
            </Button>
          ))}
        </ButtonGroup>
        <Line data={chartData} />
      </Box>

      {/* Financial Data */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Financial Data
        </Typography>
        {financialData ? (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography>P/E Ratio: {financialData.peRatio}</Typography>
              <Typography>EPS: {financialData.eps}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography>Market Cap: {financialData.marketCap}</Typography>
              <Typography>
                Dividend Yield: {financialData.dividendYield}%
              </Typography>
            </Grid>
          </Grid>
        ) : (
          <Typography>No financial data available</Typography>
        )}
      </Box>

      {/* Last Transactions */}
      <Box>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Recent Transactions
        </Typography>
        {transactions.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Price</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.timestamp}</TableCell>
                  <TableCell>
                    {transaction.transaction_type.charAt(0).toUpperCase() +
                      transaction.transaction_type.slice(1)}
                  </TableCell>
                  <TableCell>{transaction.quantity}</TableCell>
                  <TableCell>${transaction.price.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography>No transactions available</Typography>
        )}
      </Box>
    </Box>
  );
};

export default StockPage;
