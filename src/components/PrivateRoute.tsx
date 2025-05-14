import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const PrivateRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  
  // We'll use the real authentication now
  const bypassAuth = false;

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return bypassAuth || isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute; 