// src/components/dashboard/PortfolioRow.tsx

import React from 'react';
import { TableRow, TableCell, Typography } from '@mui/material';

interface Stock {
  ticker: string;
  quantity: number;
  purchase_price: number;
  total_cost: number;
  current_price: number | null;
  current_value: number | null;
}

interface PortfolioRowProps {
  stock: Stock;
}

const PortfolioRow: React.FC<PortfolioRowProps> = ({ stock }) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <TableRow hover>
      <TableCell><Typography>{stock.ticker}</Typography></TableCell>
      <TableCell align="center"><Typography>{stock.quantity}</Typography></TableCell>
      <TableCell align="center"><Typography>{formatter.format(stock.purchase_price)}</Typography></TableCell>
      <TableCell align="center"><Typography>{stock.current_price !== null ? formatter.format(stock.current_price) : 'N/A'}</Typography></TableCell>
      <TableCell align="center"><Typography>{formatter.format(stock.total_cost)}</Typography></TableCell>
      <TableCell align="center"><Typography>{stock.current_value !== null ? formatter.format(stock.current_value) : 'N/A'}</Typography></TableCell>
    </TableRow>
  );
};

export default React.memo(PortfolioRow);
