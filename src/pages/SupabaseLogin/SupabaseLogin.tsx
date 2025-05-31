import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Container,
} from '@mui/material';
import { supabaseAuthService } from '../../services/supabaseAuthService';
import NavBar from '../../components/Navbar';

const SupabaseLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Iniciar sesión con Supabase
      await supabaseAuthService.signIn(email, password);
      
      setSuccess('تم تسجيل الدخول بنجاح');
      
      // Redirigir a la página de propiedades después de un breve retraso
      setTimeout(() => {
        navigate('/properties');
      }, 1500);
    } catch (err: any) {
      console.error('Error al iniciar sesión con Supabase:', err);
      setError(err.message || 'فشل تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Registrar nuevo usuario en Supabase
      await supabaseAuthService.signUp(email, password);
      
      setSuccess('تم إنشاء الحساب بنجاح. يرجى تأكيد بريدك الإلكتروني.');
    } catch (err: any) {
      console.error('Error al registrar usuario en Supabase:', err);
      setError(err.message || 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavBar title="تسجيل دخول Supabase" />
      <Container maxWidth="sm">
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 70px)',
          py: 4,
          mt: 9
        }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              width: '100%', 
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Typography 
              variant="h5" 
              component="h1" 
              align="center" 
              gutterBottom
              fontWeight="bold"
              color="primary"
            >
              تسجيل الدخول إلى Supabase
            </Typography>
            
            <Typography 
              variant="body2" 
              color="text.secondary" 
              align="center" 
              sx={{ mb: 3 }}
            >
              قم بتسجيل الدخول للوصول إلى لوحة التحكم
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 1 }}>
                {success}
              </Alert>
            )}

            <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="البريد الإلكتروني"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="كلمة المرور"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ 
                  py: 1.5, 
                  mb: 2, 
                  borderRadius: 2,
                  fontWeight: 'bold'
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'تسجيل الدخول'}
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                disabled={loading}
                onClick={handleSignUp}
                sx={{ 
                  py: 1.5, 
                  borderRadius: 2
                }}
              >
                إنشاء حساب جديد
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    </>
  );
};

export default SupabaseLogin;
