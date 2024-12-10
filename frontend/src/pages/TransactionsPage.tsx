// src/pages/TransactionsPage.tsx

import React from 'react';
import { Typography, Container, Box, Card, CardContent, CircularProgress } from '@mui/material';
import Transactions from '../components/transactions/Transactions';
import { useUser } from '../components/hooks/useUser';

const TransactionsPage: React.FC = () => {
  const { user, loading: userLoading, error: userError } = useUser();
  const userId = user?.id ?? null;  // Provide a fallback to null

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'text.primary' }}>
        Transaction History
      </Typography>
      
      <Card variant="outlined" sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" component="h2" sx={{ mb: 2, color: 'text.secondary' }}>
            Your Transactions
          </Typography>
          <Transactions userId={userId} />
        </CardContent>
      </Card>
    </Container>
  );
};

export default TransactionsPage;
