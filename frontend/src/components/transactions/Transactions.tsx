import React, { useEffect, useState } from 'react';
import { getTransactions } from '../../api';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress } from '@mui/material';
import * as Interfaces from '../../types/interfaces';

const Transactions: React.FC<{ userId: number | null }> = ({ userId }) => {
  const [transactions, setTransactions] = useState<Interfaces.Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId === null || userId === undefined) {
      setError('User ID is missing');
      return;
    }

    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const response = await getTransactions(userId);
        if (Array.isArray(response.data)) {
          setTransactions(response.data);
        } else {
          console.error("Expected an array of transactions, received:", response.data);
          setTransactions([]);
        }
        setError(null);
      } catch (err) {
        setError('Failed to load transactions.');
        console.error(err);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [userId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error) {
    return <Typography color="error" align="center">{error}</Typography>;
  }

  if (transactions.length === 0) {
    return <Typography color="textSecondary" align="center">No transactions found.</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom color="primary">
        Transaction History
      </Typography>
      <TableContainer component={Paper} sx={{ backgroundColor: 'grey.900' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ticker</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Quantity</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Price</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((txn) => (
              <TableRow key={txn.id} hover sx={{ '&:hover': { backgroundColor: 'grey.800' } }}>
                <TableCell sx={{ color: 'white' }}>
                  {txn.timestamp ? new Date(txn.timestamp).toLocaleString() : 'N/A'}
                </TableCell>
                <TableCell sx={{ color: 'white' }}>{txn.ticker}</TableCell>
                <TableCell sx={{ color: 'white', textTransform: 'capitalize' }}>{txn.transaction_type}</TableCell>
                <TableCell sx={{ color: 'white' }}>{txn.quantity}</TableCell>
                <TableCell sx={{ color: 'white' }}>${txn.price.toFixed(2)}</TableCell>
                <TableCell sx={{ color: 'white' }}>${txn.total_cost.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Transactions;
