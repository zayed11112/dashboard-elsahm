import React, { useState } from 'react';
import { Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import { initializeTestData } from '../firebase/scripts/initData';

interface InitDataButtonProps {
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  size?: 'small' | 'medium' | 'large';
}

const InitDataButton: React.FC<InitDataButtonProps> = ({
  variant = 'contained',
  color = 'primary',
  size = 'medium',
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInitData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await initializeTestData();
      
      if (result) {
        setSuccess(true);
      } else {
        setError('فشل في تهيئة البيانات');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تهيئة البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  return (
    <>
      <Button
        variant={variant}
        color={color}
        size={size}
        onClick={handleInitData}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : null}
      >
        {loading ? 'جاري تهيئة البيانات...' : 'تهيئة بيانات تجريبية'}
      </Button>
      
      <Snackbar open={success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          تم تهيئة البيانات بنجاح!
        </Alert>
      </Snackbar>
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default InitDataButton;
