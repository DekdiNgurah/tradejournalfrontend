import axios from "axios";

const rawApiUrl = (
  import.meta.env.VITE_API_URL || "https://tradejournalbackend.dockhosting.cloud"
)
  .trim()
  .replace(/\/+$/, "");

const apiClient = axios.create({
  baseURL: `${rawApiUrl}/api`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000,
});

// Interceptor Request
apiClient.interceptors.request.use(
  (config) => {
    
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
