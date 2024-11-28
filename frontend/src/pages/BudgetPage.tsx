// src/pages/BudgetPage.tsx

import React, { useCallback, useState, useEffect } from 'react';
import { viewBudget, updateBudget } from '../api';
import { useUser } from '../components/hooks/useUser';
import { Box, Typography, Button, TextField, Card, CardContent, CircularProgress } from '@mui/material';

const BudgetPage: React.FC = () => {
  const { user, loading: userLoading, error: userError } = useUser();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState<number | null>(null);
  const [newBudget, setNewBudget] = useState<number | ''>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchBudget = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const response = await viewBudget(user.id);
    if (response.success && response.data) {
      setBudget(response.data.budget);
    } else {
      setError(response.error || 'Failed to fetch budget.');
    }
    setLoading(false);
  }, [user?.id]);

  const handleUpdateBudget = async () => {
    if (!user?.id || newBudget === '') return;
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const response = await updateBudget(user.id, Number(newBudget));
    if (response.success && response.data) {
      setBudget(response.data.new_budget ?? response.data.budget);
      setSuccessMessage('Budget updated successfully!');
      setNewBudget('');
    } else {
      setError(response.error || 'Failed to update budget.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  return (
    <Box p={4} sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
      <Card sx={{ mb: 4, bgcolor: 'grey.900', color: 'text.primary', boxShadow: 4, p: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
            Budget Overview
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Manage your budget to control your investment activities.
          </Typography>
          
          {loading ? (
            <CircularProgress color="primary" />
          ) : error ? (
            <Typography color="error" variant="body1">{error}</Typography>
          ) : (
            <>
              <Typography variant="h5" sx={{ color: budget && budget >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                Current Budget: {typeof budget === 'number' ? `$${budget.toFixed(2)}` : "N/A"}
              </Typography>
              {successMessage && (
                <Typography color="success.main" variant="body1" mt={2}>
                  {successMessage}
                </Typography>
              )}
            </>
          )}
          
          <Box mt={4} display="flex" flexDirection="column" gap={2}>
            <TextField
              label="New Budget Amount"
              variant="outlined"
              type="number"
              value={newBudget}
              onChange={(e) => setNewBudget(Number(e.target.value))}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpdateBudget}
                disabled={loading || newBudget === ''}
                startIcon={loading ? <CircularProgress color="inherit" size={20} /> : null}
              >
                {loading ? 'Updating...' : 'Update Budget'}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setNewBudget('')}
                disabled={loading}
              >
                Clear
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BudgetPage;
