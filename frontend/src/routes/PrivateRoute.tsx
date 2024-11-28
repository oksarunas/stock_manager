// src/routes/PrivateRoute.tsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

interface PrivateRouteProps {
  isAuthenticated: boolean;
  children: JSX.Element;
  loading?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ isAuthenticated, children, loading = false }) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
