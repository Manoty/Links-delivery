import api from './axios';

export const placeOrder       = (data)     => api.post('/orders/', data);
export const getMyOrders      = ()         => api.get('/orders/');
export const getOrderDetail   = (id)       => api.get(`/orders/${id}/`);
export const getAvailableOrders = ()       => api.get('/riders/orders/available/');
export const autoDispatch    = (orderId) => api.post(`/riders/dispatch/${orderId}/`);
export const nearestRiders   = (orderId) => api.get(`/riders/nearest/${orderId}/`);
export const getDispatchLogs = ()        => api.get('/riders/dispatch/logs/');
export const acceptOrder      = (id)       => api.post(`/riders/orders/${id}/accept/`);
export const rejectOrder      = (id)       => api.post(`/riders/orders/${id}/reject/`);
export const updateOrderStatus = (id, s)   => api.put(`/orders/rider/${id}/status/`, { status: s });

// Admin
export const getAllOrders     = (params)   => api.get('/orders/admin/', { params });
export const assignRider      = (id, rid)  => api.post(`/orders/admin/${id}/assign/`, { rider_id: rid });

export const getAnalyticsKpi         = ()       => api.get('/analytics/kpi/');
export const getRevenueTrend         = (range)  => api.get(`/analytics/revenue/?range=${range}`);
export const getPeakHours            = ()       => api.get('/analytics/peak-hours/');
export const getHeatmap              = ()       => api.get('/analytics/heatmap/');
export const getZonePerformance      = ()       => api.get('/analytics/zones/');
export const getRiderLeaderboard     = (metric) => api.get(`/analytics/leaderboard/?metric=${metric}`);