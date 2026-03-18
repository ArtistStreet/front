import axios from "axios";

import type { Product } from "../types";
const API_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
});

export const productApi = {
  getAll: (params: Record<string, string>) =>
    api.get<Product[]>("/products", { params }),
  getById: (id: string) => api.get<Product>(`/products/${id}`),
  create: (
    data: Omit<Product, "id" | "_id" | "rating" | "sold">,
    token: string
  ) => {
    return axios.post(`${API_URL}/products`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  update: (id: string, data: Partial<Product>, token: string) => {
    return axios.put(`${API_URL}/products/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  deleteProduct: (id: string, token: string) => {
    return axios.delete(`${API_URL}/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  chatbot: (message: string) => api.post("/chatbot", { message }),
  getDashboardStats: (token: string) => {
    return axios.get(`${API_URL}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  createOrder: (
    orderData: {
      orderItems: {
        name: string;
        quantity: number;
        image: string;
        price: number;
        product: string;
      }[];
      totalPrice?: number;
      voucherCode?: string;
      shippingAddress: {
        fullName: string;
        phoneNumber: string;
        addressLine: string;
        isDefault?: boolean;
      };
    },
    token: string
  ) => {
    return axios.post(`${API_URL}/orders`, orderData, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  getMyOrders: (token: string) => {
    return axios.get(`${API_URL}/orders/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  cancelOrder: (id: string, token: string) => {
    return axios.put(
      `${API_URL}/orders/${id}/cancel`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
  },
  getNotifications: (token: string) => {
    return axios.get(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  markNotificationAsRead: (id: string, token: string) => {
    return axios.put(
      `${API_URL}/notifications/${id}/read`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },
  createReview: (
    reviewData: { rating: number; comment: string; productId: string },
    token: string
  ) => {
    return axios.post(`${API_URL}/reviews`, reviewData, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  getProductReviews: (productId: string) => {
    return axios.get(`${API_URL}/products/${productId}/reviews`);
  },
  getAllReviews: (token: string) => {
    return axios.get(`${API_URL}/reviews`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  deleteReview: (id: string, token: string) => {
    return axios.delete(`${API_URL}/reviews/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  getCart: (token: string) => {
    return axios.get(`${API_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  addToCart: (data: { productId: string; quantity: number }, token: string) => {
    return axios.post(`${API_URL}/cart/add`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  updateCartItem: (
    productId: string,
    data: { quantity: number },
    token: string
  ) => {
    return axios.put(`${API_URL}/cart/item/${productId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  removeCartItem: (productId: string, token: string) => {
    return axios.delete(`${API_URL}/cart/item/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  clearCart: (token: string) => {
    return axios.delete(`${API_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  getProfile: (token: string) => {
    return axios.get(`${API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  updateProfile: (
    data: {
      name?: string;
      email?: string;
      username?: string;
      phone?: string;
      gender?: string;
      birthDate?: string;
      avatar?: string;
    },
    token: string
  ) => {
    return axios.put(`${API_URL}/auth/profile`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  changePassword: (
    data: { currentPassword: string; newPassword: string },
    token: string
  ) => {
    return axios.put(`${API_URL}/auth/password`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  getAddresses: (token: string) => {
    return axios.get(`${API_URL}/auth/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  addAddress: (
    data: {
      fullName: string;
      phone: string;
      province: string;
      district: string;
      ward: string;
      street: string;
      isDefault?: boolean;
    },
    token: string
  ) => {
    return axios.post(`${API_URL}/auth/addresses`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  updateAddress: (
    id: string,
    data: Partial<{
      fullName: string;
      phone: string;
      province: string;
      district: string;
      ward: string;
      street: string;
      isDefault: boolean;
    }>,
    token: string
  ) => {
    return axios.put(`${API_URL}/auth/addresses/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  deleteAddress: (id: string, token: string) => {
    return axios.delete(`${API_URL}/auth/addresses/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  setDefaultAddress: (id: string, token: string) => {
    return axios.put(
      `${API_URL}/auth/addresses/${id}/default`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
  },
  uploadAvatar: (formData: FormData, token: string) => {
    return axios.post(`${API_URL}/auth/avatar`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
  },
  getMyVouchers: (token: string) => {
    return axios.get(`${API_URL}/vouchers/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  getShopVouchers: (token: string) => {
    return axios.get(`${API_URL}/vouchers/discover`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  getVoucherHistory: (token: string) => {
    return axios.get(`${API_URL}/vouchers/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  addVoucher: (code: string, token: string) => {
    return axios.post(
      `${API_URL}/vouchers/add`,
      { code },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },
  healthDb: () => {
    return axios.get(`${API_URL}/health/db`);
  },
};

export default api;
