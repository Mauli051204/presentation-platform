import axiosInstance from '@/services/axiosInstance';

export const getMyPresenterProfile = () => axiosInstance.get('/presenters/profile/me');
export const saveMyPresenterProfile = (payload) =>
  axiosInstance.put('/presenters/profile/me', payload);
export const updateAvailability = (dates) =>
  axiosInstance.put('/presenters/profile/availability', { dates });

export const uploadProfileImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return axiosInstance.post('/presenters/profile/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const uploadResume = (file) => {
  const formData = new FormData();
  formData.append('resume', file);
  return axiosInstance.post('/presenters/profile/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const uploadCertificate = (file, title) => {
  const formData = new FormData();
  formData.append('certificate', file);
  formData.append('title', title);
  return axiosInstance.post('/presenters/profile/certificates', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const uploadVideo = (file, title) => {
  const formData = new FormData();
  formData.append('video', file);
  formData.append('title', title);
  return axiosInstance.post('/presenters/profile/videos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const uploadSlide = (file, title) => {
  const formData = new FormData();
  formData.append('slide', file);
  formData.append('title', title);
  return axiosInstance.post('/presenters/profile/slides', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteCertificate = (assetId) =>
  axiosInstance.delete(`/presenters/profile/certificates/${assetId}`);
export const deleteVideo = (assetId) =>
  axiosInstance.delete(`/presenters/profile/videos/${assetId}`);
export const deleteSlide = (assetId) =>
  axiosInstance.delete(`/presenters/profile/slides/${assetId}`);

export const getMyApplications = (status) =>
  axiosInstance.get('/applications/mine', { params: status ? { status } : {} });
