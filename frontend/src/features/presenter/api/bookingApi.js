import axiosInstance from '@/services/axiosInstance';

export const getMyBookings = (params) => axiosInstance.get('/bookings/mine', { params });
export const getBookingById = (id) => axiosInstance.get(`/bookings/${id}`);
export const getPaymentByBooking = (bookingId) =>
  axiosInstance.get(`/payments/booking/${bookingId}`);
