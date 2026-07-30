import axiosInstance from '@/services/axiosInstance';

export const listBlogPostsAdmin = (params) => axiosInstance.get('/admin/blog', { params });
export const getBlogPostAdmin = (id) => axiosInstance.get(`/admin/blog/${id}`);
export const createBlogPost = (payload) => axiosInstance.post('/admin/blog', payload);
export const updateBlogPost = (id, payload) => axiosInstance.put(`/admin/blog/${id}`, payload);
export const updateBlogPostStatus = (id, status) =>
  axiosInstance.patch(`/admin/blog/${id}/status`, { status });
export const deleteBlogPost = (id) => axiosInstance.delete(`/admin/blog/${id}`);

export const uploadBlogCoverImage = (id, file) => {
  const formData = new FormData();
  formData.append('image', file);
  return axiosInstance.post(`/admin/blog/${id}/cover`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
