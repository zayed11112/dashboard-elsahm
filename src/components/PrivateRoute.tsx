import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const PrivateRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  
  // BYPASS TEMPORAL: Permite el acceso sin autenticación
  const bypassAuth = true; // Establecer como false para volver a habilitar la autenticación

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

  // Si bypassAuth está activado, permite el acceso independientemente de la autenticación
  return bypassAuth || isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute; 