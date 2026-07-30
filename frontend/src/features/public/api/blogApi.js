import axiosInstance from '@/services/axiosInstance';

export const listBlogPostsPublic = (params) => axiosInstance.get('/blog', { params });
export const getBlogPostBySlug = (slug) => axiosInstance.get(`/blog/${slug}`);
