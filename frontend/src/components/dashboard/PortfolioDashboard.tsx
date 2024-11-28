// src/components/dashboard/PortfolioDashboard.tsx

import React, { useContext, useCallback, useEffect, useState } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { viewPortfolio } from '../../api';
import PortfolioRow from './PortfolioRow';
import { RefreshContext } from '../../contexts/RefreshContext';
import { useUser } from '../hooks/useUser';
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  Grid,
} from '@mui/material';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

interface Stock {
  ticker: string;
  quantity: number;
  purchase_price: number;
  total_cost: number;
  current_price: number | null;
  current_value: number | null;
}

interface PortfolioData {
  portfolio: Stock[];
  total_portfolio_value: number;
  historical_values?: { date: string; value: number }[]; // Optional for line chart
}

const PortfolioDashboard: React.FC = () => {
  const { refreshData } = useContext(RefreshContext);
  const { user, loading: userLoading, error: userError } = useUser();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    if (!user?.id) {
      setError("User ID is undefined. Please log in again.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await viewPortfolio(user.id);

    if (result.success) {
      setData(result.data as PortfolioData | null);
    } else {
      setError(result.error || "Failed to fetch portfolio data.");
    }

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio, refreshData]);

  // Prepare data for the line chart (historical portfolio value over time)
  const lineChartData = data?.historical_values
    ? {
        labels: data.historical_values.map(item => item.date),
        datasets: [
          {
            label: 'Portfolio Value',
            data: data.historical_values.map(item => item.value),
            fill: false,
            borderColor: '#4a90e2',
            tension: 0.1,
          },
        ],
      }
    : null;

  // Prepare data for the pie chart (stock composition)
  const pieChartData = data?.portfolio
    ? {
        labels: data.portfolio.map(stock => stock.ticker),
        datasets: [
          {
            data: data.portfolio.map(stock => stock.current_value || 0),
            backgroundColor: ['#4a90e2', '#3c8dbc', '#00c0ef', '#f39c12', '#00a65a'],
          },
        ],
      }
    : null;

  return (
    <Card sx={{ bgcolor: 'grey.900', color: 'text.primary', boxShadow: 4, borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>
          Your Portfolio
        </Typography>
        
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress color="primary" size={30} />
            <Typography color="text.secondary" ml={2}>Loading portfolio...</Typography>
          </Box>
        ) : error ? (
          <Typography color="error" variant="body1" align="center">
            {error}
          </Typography>
        ) : data && data.portfolio.length > 0 ? (
          <>
            <Grid container spacing={4} mb={4}>
              <Grid item xs={12} md={6}>
                {lineChartData && (
                  <Box>
                    <Typography variant="h6" fontWeight="bold" color="text.primary" gutterBottom>
                      Portfolio Value Over Time
                    </Typography>
                    <Line data={lineChartData} />
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                {pieChartData && (
                  <Box>
                    <Typography variant="h6" fontWeight="bold" color="text.primary" gutterBottom>
                      Stock Composition
                    </Typography>
                    <Pie data={pieChartData} />
                  </Box>
                )}
              </Grid>
            </Grid>

            {/* Portfolio Table */}
            <TableContainer component={Paper} sx={{ bgcolor: 'grey.900', borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><Typography variant="subtitle1" fontWeight="bold">Ticker</Typography></TableCell>
                    <TableCell align="center"><Typography variant="subtitle1" fontWeight="bold">Quantity</Typography></TableCell>
                    <TableCell align="center"><Typography variant="subtitle1" fontWeight="bold">Purchase Price</Typography></TableCell>
                    <TableCell align="center"><Typography variant="subtitle1" fontWeight="bold">Current Price</Typography></TableCell>
                    <TableCell align="center"><Typography variant="subtitle1" fontWeight="bold">Total Cost</Typography></TableCell>
                    <TableCell align="center"><Typography variant="subtitle1" fontWeight="bold">Current Value</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.portfolio.map((stock) => (
                    <PortfolioRow key={stock.ticker} stock={stock} />
                  ))}
                </TableBody>
              </Table>
              <Box p={2} display="flex" justifyContent="flex-end" bgcolor="grey.900">
                <Typography variant="h6" fontWeight="bold" color="primary">
                  Total Portfolio Value: {data.total_portfolio_value.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  })}
                </Typography>
              </Box>
            </TableContainer>
          </>
        ) : (
          <Typography variant="body1" color="text.secondary" align="center">
            Your portfolio is empty.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioDashboard;
