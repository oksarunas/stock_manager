import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Divider,
} from "@mui/material";
import { fetchCompanyInfo } from "../api";
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
  TimeScale,
  ChartOptions
} from "chart.js";
import "chartjs-adapter-date-fns" ;

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale);

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      type: 'time', // Use time scale for the x-axis
      time: {
        unit: 'day',
        tooltipFormat: 'MMM d, yyyy',
      },
    },
    y: {
      beginAtZero: false,
      ticks: {
        callback: function (value) {
          if (typeof value === 'number') {
            return `$${value.toFixed(2)}`;
          }
          return value;
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
        label: function (context) {
          const raw = context.raw;
          if (typeof raw === 'number') {
            return `Price: $${raw.toFixed(2)}`;
          }
          return `Price: ${raw}`;
        },
      },
    },
  },
};

const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
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
      setCompanyInfo(response.data);
    } else {
      setError(response.error || "Failed to fetch company data.");
    }
    setLoading(false);
  };

  const chartData = {
    labels: companyInfo?.historicalPrices?.dates || [],
    datasets: [
      {
        label: "Price ($)",
        data: companyInfo?.historicalPrices?.prices || [],
        borderColor: "rgb(75, 192, 192)",
        borderWidth: 2,
        pointBackgroundColor: "rgb(75, 192, 192)",
        pointBorderColor: "rgb(255, 255, 255)",
        pointRadius: 3,
        fill: false,
      },
    ],
  };

  return (
    <Box p={4} sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>
      <Card sx={{ mb: 4, bgcolor: "grey.900", color: "text.primary", boxShadow: 4, p: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
            Company Search
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Search for company information and view historical stock prices.
          </Typography>

          <Box display="flex" gap={2} mt={3} mb={4}>
            <TextField
              label="Enter Ticker"
              variant="outlined"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": {
                    borderColor: "primary.main",
                  },
                },
              }}
            />
            <Button variant="contained" color="primary" onClick={handleSearch} disabled={loading}>
              {loading ? <CircularProgress size={24} color="inherit" /> : "Search"}
            </Button>
          </Box>

          {error && (
            <Typography color="error" variant="body1">
              {error}
            </Typography>
          )}

          {companyInfo ? (
            <>
              <Typography variant="h5" color="primary.light" fontWeight="bold">
                {companyInfo.name || "Company Name"}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                {companyInfo.ticker || "Ticker Symbol"}
              </Typography>
              <Typography variant="body1" mt={2}>
                Industry: {companyInfo.industry || "N/A"}
              </Typography>
              <Typography variant="body1" mt={1}>
                Description: {companyInfo.description || "N/A"}
              </Typography>
              <Typography variant="body1" mt={1}>
                Current Stock Price: ${companyInfo.currentPrice || "N/A"}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2">
                Market Cap: {companyInfo.marketCap ? `$${(companyInfo.marketCap / 1e9).toFixed(2)}B` : "N/A"}
              </Typography>
              <Typography variant="body2">
                P/E Ratio: {companyInfo.peRatio || "N/A"}
              </Typography>

              <Box mt={4}>
                <Typography variant="h6" gutterBottom>
                  Historical Price (last 5 days)
                </Typography>
                <Box sx={{ height: 400 }}>
                  <Line data={chartData} options={chartOptions} />
                </Box>
              </Box>
            </>
          ) : (
            <Typography variant="body1" color="text.secondary">
              Enter company ticker to search for data.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Search;
