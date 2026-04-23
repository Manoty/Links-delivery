import api from './axios';

export const placeOrder       = (data)     => api.post('/orders/', data);
export const getMyOrders      = ()         => api.get('/orders/');
export const getOrderDetail   = (id)       => api.get(`/orders/${id}/`);
export const getAvailableOrders = ()       => api.get('/riders/orders/available/');
export const acceptOrder      = (id)       => api.post(`/riders/orders/${id}/accept/`);
export const rejectOrder      = (id)       => api.post(`/riders/orders/${id}/reject/`);
export const updateOrderStatus = (id, s)   => api.put(`/orders/rider/${id}/status/`, { status: s });

// Admin
export const getAllOrders     = (params)   => api.get('/orders/admin/', { params });
export const assignRider      = (id, rid)  => api.post(`/orders/admin/${id}/assign/`, { rider_id: rid });