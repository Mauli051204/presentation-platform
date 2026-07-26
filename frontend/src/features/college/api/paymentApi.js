import axiosInstance from '@/services/axiosInstance';

export const createOrder = (bookingId) =>
  axiosInstance.post('/payments/create-order', { bookingId });
export const verifyPayment = (payload) => axiosInstance.post('/payments/verify', payload);
export const getPaymentByBooking = (bookingId) =>
  axiosInstance.get(`/payments/booking/${bookingId}`);
