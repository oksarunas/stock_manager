import React, { useState, useEffect } from 'react';
import { ChartOptions } from 'chart.js';
import { Box, TextField, Button, Card, CardContent, Typography, CircularProgress, Divider } from '@mui/material';
import { fetchCompanyInfo } from '../api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale);

// Single Chart options configuration with explicit typing
const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time', // Specify the type as "time" for date-based axis
        time: {
          unit: 'day',
          tooltipFormat: 'MMM D, YYYY',
        },
      },
      y: {
        beginAtZero: false,
        ticks: {
          callback: function (tickValue: string | number) {
            // Ensure tickValue is a number before formatting
            const value = typeof tickValue === 'number' ? tickValue : parseFloat(tickValue);
            return `$${value.toFixed(2)}`;
          },
        },
      },
    },
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `Price: $${context.raw.toFixed(2)}`;
          },
        },
      },
    },
  };
  

const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [companyInfo, setCompanyInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery) return;
    setLoading(true);
    setError(null);
    setCompanyInfo(null);

    const response = await fetchCompanyInfo(searchQuery);
    if (response.success && response.data) {
      console.log("Received data from API:", response.data);
      setCompanyInfo(response.data);
    } else {
      setError(response.error);
    }
    setLoading(false);
  };

  // Prepare data for react-chartjs-2
  const chartData = {
    labels: companyInfo?.historicalPrices?.dates || [],
    datasets: [
      {
        label: 'Price ($)',
        data: companyInfo?.historicalPrices?.prices || [],
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(75, 192, 192)',
        pointBorderColor: 'rgb(255, 255, 255)',
        pointRadius: 3,
        fill: false,
      },
    ],
  };

  return (
    <Box p={4} sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
      <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
        Company Search
      </Typography>
      <Box display="flex" gap={2} mb={4}>
        <TextField
          label="Enter Ticker"
          variant="outlined"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button variant="contained" color="primary" onClick={handleSearch} disabled={loading}>
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Search'}
        </Button>
      </Box>

      {error && (
        <Typography color="error" variant="body1">
          {error}
        </Typography>
      )}

      {companyInfo ? (
        <Card sx={{ bgcolor: 'grey.800', color: 'text.primary', boxShadow: 3, p: 3 }}>
          <CardContent>
            <Typography variant="h5" color="primary.light" fontWeight="bold">
              {companyInfo.name || 'Company Name'}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              {companyInfo.ticker || 'Ticker Symbol'}
            </Typography>
            <Typography variant="body1" mt={2}>
              Industry: {companyInfo.industry || 'N/A'}
            </Typography>
            <Typography variant="body1" mt={1}>
              Description: {companyInfo.description || 'N/A'}
            </Typography>
            <Typography variant="body1" mt={1}>
              Current Stock Price: ${companyInfo.currentPrice || 'N/A'}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2">
              Market Cap: {companyInfo.marketCap ? `$${(companyInfo.marketCap / 1e9).toFixed(2)}B` : 'N/A'}
            </Typography>
            <Typography variant="body2">
              P/E Ratio: {companyInfo.peRatio || 'N/A'}
            </Typography>

            <Box mt={3} sx={{ width: '100%', maxWidth: 600, height: 400, mx: 'auto' }}>
            <Typography variant="h6" gutterBottom>
                Historical Price (last 5 days)
            </Typography>
            <Line data={chartData} options={chartOptions} />
            </Box>

          </CardContent>
        </Card>
      ) : (
        <Typography variant="body1" color="text.secondary">
          Enter company ticker to search for data.
        </Typography>
      )}
    </Box>
  );
};

export default Search;
