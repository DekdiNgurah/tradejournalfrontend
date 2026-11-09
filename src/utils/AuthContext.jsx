import { createContext, useContext, useState } from "react";
import apiClient from "./apiClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error("Error parsing user from localStorage", e);
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const login = async (email, password) => {
    const response = await apiClient.post("/login", { email, password });
    const responseData = response.data;
    const nextToken = responseData.token || responseData.access_token;
    const userData = responseData.user || responseData.data || null;

    if (!nextToken) {
      throw new Error("Login response did not include an authentication token.");
    }

    localStorage.setItem("token", nextToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(nextToken);
    setUser(userData);
    return responseData;
  };

  const updateUser = (updatedData) => {
    const newUserData = { ...(user || {}), ...updatedData };
    localStorage.setItem("user", JSON.stringify(newUserData));
    setUser(newUserData);
    return newUserData;
  };

  // Register: Mengembalikan response backend { message, ... }
  const register = async (name, email, password, password_confirmation) => {
    const response = await apiClient.post("/register", {
      name,
      email,
      password,
      password_confirmation,
    });
    return response.data;
  };

  const logout = async () => {
    try {
      const response = await apiClient.post("/logout");
      return response.data;
    } catch (error) {
      console.error("Logout API error:", error);
      throw error;
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);