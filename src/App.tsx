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
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties/Properties';
import PropertyForm from './pages/Properties/PropertyForm';
import Users from './pages/Users/Users';
import UserForm from './pages/Users/UserForm';
import Categories from './pages/Categories/Categories';
import Places from './pages/Places/Places';
import Owners from './pages/Owners/Owners';
import OwnerDetails from './pages/Owners/OwnerDetails';
import CheckoutRequests from './pages/CheckoutRequests/CheckoutRequests';
import AddBalance from './pages/AddBalance/AddBalance';
import PaymentMethods from './pages/PaymentMethods/PaymentMethods';
import PaymentRequests from './pages/PaymentRequests/PaymentRequests';
import Banners from './pages/Banners';
import ComplaintsPage from './pages/Complaints';
import ComplaintDetailPage from './pages/Complaints/ComplaintDetail';
import NotificationsPage from './pages/Notifications';
import Profile from './pages/Profile/Profile';
import Settings from './pages/Settings/Settings';

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

                {/* Categories routes */}
                <Route path="/categories" element={<Categories />} />

                {/* Places routes */}
                <Route path="/places" element={<Places />} />

                {/* Owners routes */}
                <Route path="/owners" element={<Owners />} />
                <Route path="/owners/:id" element={<OwnerDetails />} />

                {/* Checkout Requests routes */}
                <Route path="/checkout-requests" element={<CheckoutRequests />} />

                {/* Add Balance route */}
                <Route path="/add-balance" element={<AddBalance />} />

                {/* Payment Methods route */}
                <Route path="/payment-methods" element={<PaymentMethods />} />

                {/* Payment Requests route */}
                <Route path="/payment-requests" element={<PaymentRequests />} />

                {/* Banners route */}
                <Route path="/banners" element={<Banners />} />

                {/* Complaints routes */}
                <Route path="/complaints" element={<ComplaintsPage />} />
                <Route path="/complaints/:id" element={<ComplaintDetailPage />} />

                {/* Notifications route */}
                <Route path="/notifications" element={<NotificationsPage />} />

                {/* Profile and Settings routes */}
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
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
