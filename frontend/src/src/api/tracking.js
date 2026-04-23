import api from './axios';

export const getOrderTracking  = (orderId) => api.get(`/tracking/order/${orderId}/location/`);
export const getRouteHistory   = (orderId) => api.get(`/tracking/order/${orderId}/history/`);
export const updateLocation    = (data)    => api.post('/riders/location/update/', data);
export const getLiveRiders     = ()        => api.get('/tracking/riders/live/');