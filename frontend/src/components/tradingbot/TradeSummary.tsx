import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  useTheme,
  Card,
  CardContent,
  CardHeader,
} from "@mui/material";
import { fetchTradeSummary } from "../../api";
import * as Interfaces from "../../types/interfaces";

const TradeSummary: React.FC = () => {
  const [summary, setSummary] = useState<Interfaces.TradeSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const theme = useTheme();

  useEffect(() => {
    const fetchSummary = async () => {
      const response = await fetchTradeSummary();
      if (response.success && response.data) {
        setSummary(response.data);
      } else {
        setError("Error fetching trade summary");
        console.error(response.error);
      }
    };

    fetchSummary();
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
    <Card
      sx={{
        boxShadow: 3,
        borderRadius: 2,
        bgcolor: "grey.900",
        mb: 4,
      }}
    >
      <CardHeader
        title="Trade Summary"
        sx={{ color: "text.primary" }}
      />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            <strong>Total Trades:</strong> {summary.total_trades}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            <strong>Total Realized Profit:</strong> ${summary.total_realized_profit.toFixed(2)}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            <strong>Max Budget Used:</strong> ${summary.budget_used.toFixed(2)}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            <strong>Last 24h Profit:</strong> ${summary.last_24h_profit.toFixed(2)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TradeSummary;
