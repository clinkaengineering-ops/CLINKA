import api from "@/lib/axios";

export const userApi = {
  getEngineers: () => api.get("/users/engineers"),
  getEngineerById: (id: number) => api.get(`/users/engineers/${id}`),
  getMe: () => api.get("/users/me"),
  updateMe: (data: { name?: string; bio?: string }) => api.put("/users/me", data),
  addPortfolioItem: (data: { imageUrl: string; description: string }) =>
    api.post("/users/portfolio", data),
  deletePortfolioItem: (id: number) => api.delete(`/users/portfolio/${id}`),
};
