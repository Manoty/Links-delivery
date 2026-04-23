import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login      from './pages/customer/Login';
import Register   from './pages/customer/Register';
import TrackOrder from './pages/customer/TrackOrder';
import PlaceOrder from './pages/customer/PlaceOrder';
import OrderList from './pages/customer/OrderList';

// Placeholder pages — built fully in Phase 9
const RiderDashboard = () => <div style={{padding:40}}><h2>🏍️ Rider Dashboard — Phase 9</h2></div>;
const AdminDashboard = () => <div style={{padding:40}}><h2>⚙️ Admin Dashboard — Phase 9</h2></div>;
const OrderList      = () => <div style={{padding:40}}><h2>📋 My Orders — Phase 9</h2></div>;

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Customer routes */}
      <Route path="/orders" element={
        <ProtectedRoute allowedRoles={['customer']}>
          <OrderList />
        </ProtectedRoute>
      }/>
      <Route path="/orders/:orderId/track" element={
        <ProtectedRoute allowedRoles={['customer']}>
          <TrackOrder />
        </ProtectedRoute>
      }/>
      <Route path="/place-order" element={
        <ProtectedRoute allowedRoles={['customer']}>
          <PlaceOrder />
        </ProtectedRoute>
      }/>

      {/* Rider routes */}
      <Route path="/rider" element={
        <ProtectedRoute allowedRoles={['rider']}>
          <RiderDashboard />
        </ProtectedRoute>
      }/>

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      }/>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}