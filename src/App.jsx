import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./utils/AuthContext";
import UserProfile from "./pages/UserProfile";

function ProtectedRoute() {
  const { token } = useAuth();
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

// Mencegah Authenticated User mengakses Login/Register lagi
function GuestRoute() {
  const { token } = useAuth();
  return !token ? <Outlet /> : <Navigate to="/" replace />;
}

function MainLayoutWrapper() {
  const { user, logout } = useAuth();

  return (
    <Layout user={user} onLogout={logout}>
      <Outlet />
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      {/* Provider Toast melayang global */}
      <Toaster position="top-right" reverseOrder={false} />

      <Routes>
        {/* tanpa login*/}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* harus login */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayoutWrapper />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<UserProfile />} />
          </Route>
        </Route>

        {/* Catch-all Fallback: Alihkan URL tidak dikenal ke halaman utama */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </AuthProvider>
  );
}