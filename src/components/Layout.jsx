import React from "react";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

export default function Layout({ user, onLogout, onOpenAddModal }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">

      {/* Top Header Navbar */}
      <Navbar user={user} onLogout={onLogout} onOpenAddModal={onOpenAddModal} />

      {/* Main Container Viewport */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet/>
      </main>


    </div>
  );
}