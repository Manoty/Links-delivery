import api from './axios';

export const register = (data)  => api.post('/users/register/', data);
export const login    = (data)  => api.post('/users/login/', data);
export const logout   = (data)  => api.post('/users/logout/', data);
export const getMe    = ()      => api.get('/users/me/');

export const getNotifications    = ()      => api.get('/users/notifications/');
export const markNotificationsRead = (ids) => api.post('/users/notifications/read/', { ids });
export const submitRating          = (data) => api.post('/orders/rate/', data);
export const getMyRatings          = ()     => api.get('/orders/my-ratings/');