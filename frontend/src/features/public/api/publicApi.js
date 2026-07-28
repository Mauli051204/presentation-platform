import axiosInstance from "@/services/axiosInstance";

export const searchPresentersPublic = (params) => axiosInstance.get("/presenters", { params });
export const searchCollegesPublic = (params) => axiosInstance.get("/colleges", { params });
export const searchRequirementsPublic = (params) => axiosInstance.get("/requirements", { params });

export const getPresenterPublic = (id) => axiosInstance.get(`/presenters/${id}`);
export const getCollegePublic = (id) => axiosInstance.get(`/colleges/${id}`);
export const getRequirementPublic = (id) => axiosInstance.get(`/requirements/${id}`);

export const getReviewsForPresenterPublic = (id) => axiosInstance.get(`/reviews/presenter/${id}`);
export const getReviewsForCollegePublic = (id) => axiosInstance.get(`/reviews/college/${id}`);