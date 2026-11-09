import React, { createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "./apiClient";

// 1. Buat Context
const TradeContext = createContext();

export const TradeProvider = ({ children }) => {
  const queryClient = useQueryClient();

  // GET ALL TRADES (Mengambil daftar transaksi)
  const { data: trades, isLoading, isError } = useQuery({
    queryKey: ["trades"],
    queryFn: async () => {
      const res = await apiClient.get("/trades");
      return res.data.data;
    },
  });

  // SHOW TRADE DETAIL (Mengambil detail 1 transaksi berdasarkan ID)
  const getTradeById = async (id) => {
    const res = await apiClient.get(`/trades/${id}`);
    return res.data.data;
  };

  // ADD TRADE (Menambah transaksi baru)
  const addTrade = async (formData) => {
    try {
      const response = await apiClient.post("/trades", formData);
      // Invalidate cache agar UI otomatis memperbarui daftar trade dan statistik
      queryClient.invalidateQueries(["trades"]);
      queryClient.invalidateQueries(["dashboard-summary"]);
      queryClient.invalidateQueries(["calendar-pnl"]);
      return response;
    } catch (error) {
      throw error;
    }
  };

  // UPDATE TRADE (Memperbarui transaksi)
  const updateTrade = async (id, formData) => {
    try {
      const response = await apiClient.put(`/trades/${id}`, formData);
      queryClient.invalidateQueries(["trades"]);
      queryClient.invalidateQueries(["dashboard-summary"]);
      queryClient.invalidateQueries(["calendar-pnl"]);
      return response;
    } catch (error) {
      throw error;
    }
  };

  // DELETE TRADE (Menghapus transaksi)
  const deleteTrade = useMutation({
    mutationFn: async (id) => await apiClient.delete(`/trades/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["trades"]);
      queryClient.invalidateQueries(["dashboard-summary"]);
      queryClient.invalidateQueries(["calendar-pnl"]);
    },
  });

  return (
    <TradeContext.Provider
      value={{
        trades,
        isLoading,
        isError,
        getTradeById,
        addTrade,
        updateTrade,
        deleteTrade,
      }}
    >
      {children}
    </TradeContext.Provider>
  );
};

// Custom Hook untuk memudahkan penggunaan di komponen UI
export const useTrades = () => useContext(TradeContext);