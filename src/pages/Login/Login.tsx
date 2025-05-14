import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
} from '@mui/icons-material';

// Constant for the static password
const STATIC_PASSWORD = "Okaeslam2020###";
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 3 * 60 * 1000; // 3 minutes in milliseconds

const Login: React.FC = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for tracking login attempts
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | undefined>(undefined);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Check localStorage for previous login attempts info
  useEffect(() => {
    const storedAttempts = localStorage.getItem('loginAttempts');
    const storedLockedUntil = localStorage.getItem('lockedUntil');
    
    if (storedAttempts) {
      setAttempts(parseInt(storedAttempts, 10));
    }
    
    if (storedLockedUntil) {
      const lockedTime = parseInt(storedLockedUntil, 10);
      if (lockedTime > Date.now()) {
        setLockedUntil(lockedTime);
      } else {
        // Clear lockout if it's expired
        localStorage.removeItem('lockedUntil');
      }
    }
  }, []);

  // Update timer if account is locked
  useEffect(() => {
    if (!lockedUntil) return;
    
    const interval = setInterval(() => {
      const remaining = Math.max(0, lockedUntil - Date.now());
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        setLockedUntil(undefined);
        localStorage.removeItem('lockedUntil');
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lockedUntil]);

  // If already authenticated, redirect to dashboard
  if (isAuthenticated && !loading) {
    return <Navigate to="/dashboard" />;
  }

  const isLocked = Boolean(lockedUntil && lockedUntil > Date.now());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if account is locked
    if (isLocked) {
      setError(`تم تأمين الحساب. يرجى المحاولة مرة أخرى بعد ${Math.ceil(timeRemaining / 1000 / 60)} دقائق`);
      return;
    }

    if (!password) {
      setError('يرجى إدخال كلمة المرور');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Check the static password
      if (password === STATIC_PASSWORD) {
        // Reset attempts on successful login
        setAttempts(0);
        localStorage.setItem('loginAttempts', '0');
        localStorage.removeItem('lockedUntil');
        
        // Use the existing authentication system - use admin@elsahm.com as a default email
        await login('admin@elsahm.com', STATIC_PASSWORD);
        navigate('/dashboard');
      } else {
        // Wrong password
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem('loginAttempts', newAttempts.toString());
        
        // Check if we need to lock the account
        if (newAttempts >= MAX_ATTEMPTS) {
          const lockTime = Date.now() + LOCKOUT_TIME;
          setLockedUntil(lockTime);
          localStorage.setItem('lockedUntil', lockTime.toString());
          setError(`تم تأمين الحساب بسبب عدد محاولات كبير. يرجى المحاولة مرة أخرى بعد 3 دقائق`);
        } else {
          setError(`كلمة المرور خاطئة. محاولات متبقية: ${MAX_ATTEMPTS - newAttempts}`);
        }
      }
    } catch (err) {
      setError('فشل تسجيل الدخول. يرجى المحاولة مرة أخرى');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: (theme) => theme.palette.background.default,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            لوحة تحكم السهم
          </Typography>

          <Divider sx={{ width: '100%', my: 2 }} />

          <Typography variant="h5" component="h2" gutterBottom>
            تسجيل الدخول
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {isLocked && (
            <Alert severity="warning" sx={{ width: '100%', mb: 2 }}>
              تم تأمين الحساب. يرجى الانتظار {Math.ceil(timeRemaining / 1000 / 60)} دقائق و {Math.ceil((timeRemaining / 1000) % 60)} ثواني
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="كلمة المرور"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={Boolean(isLoading || isLocked)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={Boolean(isLoading || isLocked)}
              startIcon={isLoading ? <CircularProgress size={20} /> : <LoginIcon />}
            >
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;