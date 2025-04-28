import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { initAllCollections } from './firebase/initCollections';
import PrivateRoute from './components/PrivateRoute';

// Import pages
import Login from './pages/Login/Login';
import SupabaseLogin from './pages/SupabaseLogin';
import Dashboard from './pages/Dashboard/Dashboard';
import Properties from './pages/Properties/Properties';
import PropertyForm from './pages/Properties/PropertyForm';
import Users from './pages/Users/Users';
import UserForm from './pages/Users/UserForm';
import Reservations from './pages/Reservations/Reservations';
import ReservationDetails from './pages/Reservations/ReservationDetails';
import Owners from './pages/Owners/Owners';
import OwnerDetails from './pages/Owners/OwnerDetails';

function App() {
  // Inicializar colecciones al cargar la aplicación
  useEffect(() => {
    initAllCollections().catch(error => {
      console.error('Error al inicializar colecciones:', error);
    });
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationsProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/supabase-login" element={<SupabaseLogin />} />

              {/* Protected routes */}
              <Route path="/" element={<PrivateRoute />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Properties routes */}
                <Route path="/properties" element={<Properties />} />
                <Route path="/properties/new" element={<PropertyForm />} />
                <Route path="/properties/:id" element={<PropertyForm />} />

                {/* Users routes */}
                <Route path="/users" element={<Users />} />
                <Route path="/users/new" element={<UserForm />} />
                <Route path="/users/:id" element={<UserForm />} />

                {/* Reservations routes */}
                <Route path="/reservations" element={<Reservations />} />
                <Route path="/reservations/:id" element={<ReservationDetails />} />

                {/* Owners routes */}
                <Route path="/owners" element={<Owners />} />
                <Route path="/owners/:id" element={<OwnerDetails />} />
              </Route>

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Router>
        </NotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
