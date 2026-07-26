import axiosInstance from '@/services/axiosInstance';

export const getMyCollegeProfile = () => axiosInstance.get('/colleges/profile/me');
export const saveMyCollegeProfile = (payload) => axiosInstance.put('/colleges/profile/me', payload);
export const updateDepartments = (departments) =>
  axiosInstance.put('/colleges/profile/departments', { departments });

export const uploadLogo = (file) => {
  const formData = new FormData();
  formData.append('logo', file);
  return axiosInstance.post('/colleges/profile/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const uploadGalleryImage = (file, caption) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('caption', caption || '');
  return axiosInstance.post('/colleges/profile/gallery', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const removeGalleryImage = (assetId) =>
  axiosInstance.delete(`/colleges/profile/gallery/${assetId}`);
