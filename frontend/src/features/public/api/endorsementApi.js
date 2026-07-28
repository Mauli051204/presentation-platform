import axiosInstance from '@/services/axiosInstance';

export const getEndorsements = (presenterId) =>
  axiosInstance.get(`/presenters/${presenterId}/endorsements`);
export const toggleEndorsement = (presenterId, skill) =>
  axiosInstance.post(`/presenters/${presenterId}/endorsements`, { skill });
