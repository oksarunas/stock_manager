// src/components/dashboard/BudgetDashboard.tsx

import React, { useCallback } from 'react';
import { viewBudget } from '../../api';
import { useFetchData } from '../hooks/useFetchData';
import { useUser } from '../hooks/useUser';
import { Card, CardContent, Typography, CircularProgress, Box } from '@mui/material';

const BudgetDashboard: React.FC = () => {
  const { user, loading: userLoading, error: userError } = useUser();

  const fetchBudget = useCallback(() => {
    if (user?.id) {
      console.log('Fetching budget for user ID:', user.id);
      return viewBudget(user.id);
    } else {
      console.warn('User ID is undefined, skipping budget fetch');
      return Promise.resolve({
        success: false,
        data: null,
        error: 'User ID is undefined',
      });
    }
  }, [user?.id]);

  const { data, loading, error } = useFetchData(fetchBudget, [user?.id]);

  const budgetDisplay = data && data.success && data.data?.budget ? (
    <Typography variant="h5" color="primary" fontWeight="bold">
      Available Budget:{" "}
      {data.data.budget.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      })}
    </Typography>
  ) : (
    <Typography color="text.secondary" variant="body2">
      No budget data available.
    </Typography>
  );

  return (
    <Card sx={{ bgcolor: 'grey.900', color: 'text.primary', boxShadow: 4, borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>
          Your Budget
        </Typography>
        {loading ? (
          <Box display="flex" alignItems="center" justifyContent="center" mt={2}>
            <CircularProgress size={30} color="primary" sx={{ mr: 2 }} />
            <Typography color="text.secondary" variant="body2">
              Loading budget...
            </Typography>
          </Box>
        ) : error ? (
          <Typography color="error" variant="body2" fontWeight="bold" mt={2}>
            {error}
          </Typography>
        ) : (
          <Box mt={2}>{budgetDisplay}</Box>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetDashboard;
