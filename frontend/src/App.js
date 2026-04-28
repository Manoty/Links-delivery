import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/shared/Toast';

import Login          from './pages/customer/Login';
import Register       from './pages/customer/Register';
import Home           from './pages/customer/Home';
import OrderList      from './pages/customer/OrderList';
import PlaceOrder     from './pages/customer/PlaceOrder';
import TrackOrder     from './pages/customer/TrackOrder';
import RiderDashboard from './pages/rider/RiderDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import Analytics      from './pages/admin/Analytics';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Customer */}
      <Route path="/home" element={
        <ProtectedRoute allowedRoles={['customer']}>
          <Home />
        </ProtectedRoute>
      }/>
      <Route path="/orders" element={
        <ProtectedRoute allowedRoles={['customer']}>
          <OrderList />
        </ProtectedRoute>
      }/>
      <Route path="/place-order" element={
        <ProtectedRoute allowedRoles={['customer']}>
          <PlaceOrder />
        </ProtectedRoute>
      }/>
      <Route path="/orders/:orderId/track" element={
        <ProtectedRoute allowedRoles={['customer']}>
          <TrackOrder />
        </ProtectedRoute>
      }/>

      {/* Rider */}
      <Route path="/rider" element={
        <ProtectedRoute allowedRoles={['rider']}>
          <RiderDashboard />
        </ProtectedRoute>
      }/>

      {/* Admin */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      }/>
      <Route path="/admin/analytics" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Analytics />
        </ProtectedRoute>
      }/>

      {/* Smart default redirect */}
      <Route path="/" element={
        user ? (
          user.role === 'admin'  ? <Navigate to="/admin"  replace /> :
          user.role === 'rider'  ? <Navigate to="/rider"  replace /> :
                                   <Navigate to="/home"   replace />
        ) : <Navigate to="/login" replace />
      }/>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}