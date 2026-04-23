import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login          from './pages/customer/Login';
import Register       from './pages/customer/Register';
import OrderList      from './pages/customer/OrderList';
import PlaceOrder     from './pages/customer/PlaceOrder';
import TrackOrder     from './pages/customer/TrackOrder';
import RiderDashboard from './pages/rider/RiderDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

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
      <Route path="/rider" element={
        <ProtectedRoute allowedRoles={['rider']}>
          <RiderDashboard />
        </ProtectedRoute>
      }/>
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