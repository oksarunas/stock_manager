// src/pages/Portfolio.tsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useUser } from '../components/hooks/useUser';
import apiClient from '../api';
import { Stock } from '../types/interfaces';
import { Link } from 'react-router-dom';

const Portfolio: React.FC = () => {
  const { user } = useUser();
  const [portfolio, setPortfolio] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await apiClient.get(`/portfolio/${user.id}`);
      setPortfolio(response.data.portfolio);
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const totalValue = portfolio.reduce((acc, stock) => acc + (stock.current_value || 0), 0);
  const totalGainLoss = portfolio.reduce((acc, stock) => {
    const profitLoss = stock.current_price
      ? (stock.current_price - stock.purchase_price) * stock.quantity
      : 0;
    return acc + profitLoss;
  }, 0);

  return (
    <Box sx={{ p: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="text.primary">
          Portfolio
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button component={Link} to="/trade" variant="contained" color="primary">
          Trade Stocks
        </Button>
      </Box>

      {/* Portfolio Overview */}
      <Card sx={{ mb: 4, bgcolor: 'grey.900', boxShadow: 4, borderRadius: 2 }}>
        <CardHeader
          title="Portfolio Overview"
          avatar={<AttachMoneyIcon sx={{ color: 'primary.main', fontSize: 40 }} />}
          sx={{ color: 'text.primary' }}
        />
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h3" sx={{ color: 'primary.light', fontWeight: 'bold' }}>
              {`$${totalValue.toFixed(2)}`}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {totalGainLoss >= 0 ? (
                <ArrowUpwardIcon sx={{ color: 'green', fontSize: 30 }} />
              ) : (
                <ArrowDownwardIcon sx={{ color: 'red', fontSize: 30 }} />
              )}
              <Typography
                variant="h5"
                sx={{
                  color: totalGainLoss >= 0 ? 'green' : 'red',
                  fontWeight: 'bold',
                }}
              >
                {totalGainLoss >= 0
                  ? `+$${totalGainLoss.toFixed(2)}`
                  : `-$${Math.abs(totalGainLoss).toFixed(2)}`}
                {' Total Gain/Loss'}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3, borderColor: 'grey.700' }} />

      {/* Holdings Table */}
      <Card sx={{ boxShadow: 3, borderRadius: 2, bgcolor: 'grey.900' }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom color="text.primary">
            Current Holdings
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'text.secondary' }}>Ticker</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>Quantity</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>Purchase Price</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>Current Price</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>Total Value</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>Profit/Loss</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {portfolio.map((stock) => {
                  const profitLoss = stock.current_price
                    ? (stock.current_price - stock.purchase_price) * stock.quantity
                    : 0;

                  return (
                    <TableRow key={stock.ticker} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                        {stock.ticker}
                      </TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>{stock.quantity}</TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>
                        ${stock.purchase_price.toFixed(2)}
                      </TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>
                        {stock.current_price ? `$${stock.current_price.toFixed(2)}` : 'N/A'}
                      </TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>
                        {stock.current_value ? `$${stock.current_value.toFixed(2)}` : 'N/A'}
                      </TableCell>
                      <TableCell
                        sx={{ color: profitLoss >= 0 ? 'green' : 'red', fontWeight: 'bold' }}
                      >
                        {profitLoss >= 0
                          ? `+$${profitLoss.toFixed(2)}`
                          : `-$${Math.abs(profitLoss).toFixed(2)}`}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2, textAlign: 'right' }}>
            {`Total Holdings: ${portfolio.length}`}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Portfolio;
