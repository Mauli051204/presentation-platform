import axiosInstance from "@/services/axiosInstance";

export const getDashboardStats = () => axiosInstance.get("/admin/dashboard");

export const listUsers = (params) => axiosInstance.get("/admin/users", { params });
export const toggleUserActive = (id) => axiosInstance.patch(`/admin/users/${id}/toggle-active`);

export const listCollegesForVerification = (params) => axiosInstance.get("/admin/colleges", { params });
export const verifyCollege = (id) => axiosInstance.patch(`/admin/colleges/${id}/verify`);

export const listAllRequirements = (params) => axiosInstance.get("/admin/requirements", { params });
export const forceUpdateRequirementStatus = (id, status) =>
  axiosInstance.patch(`/admin/requirements/${id}/status`, { status });

export const listAllPayments = (params) => axiosInstance.get("/admin/payments", { params });
export const getRevenueReport = (params) => axiosInstance.get("/admin/reports/revenue", { params });

export const getReviewsModeration = (params) => axiosInstance.get("/admin/reviews", { params });
export const deleteReview = (id) => axiosInstance.delete(`/admin/reviews/${id}`);

export const getCommissionSettings = () => axiosInstance.get("/admin/settings/commission");
export const updateCommissionSettings = (commissionPercent) =>  axiosInstance.put("/admin/settings/commission", { commissionPercent });