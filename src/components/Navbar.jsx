import { useState, useRef, useEffect } from "react";
import { LogOut, User, ChevronDown, ChartCandlestick } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../utils/AuthContext";

export default function Navbar() {

    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);


    const userName = user?.name || "";
    const userEmail = user?.email || "";
    const initial = (userName || userEmail || "U").charAt(0).toUpperCase();

    // 🔒 Tutup dropdown otomatis jika mengeklik di luar area Navbar Dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    //  Handler Eksekusi Logout
    const handleLogout = async () => {
        setIsDropdownOpen(false);

        try {
            const res = await logout();
            const logoutMsg = res?.message || "Logged out successfully";

            toast.success(logoutMsg, {
                duration: 3000,
                style: {
                    borderRadius: "12px",
                    background: "#ffffff",
                    color: "#0f172a",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                },
                iconTheme: { primary: "#10B981", secondary: "#ffffff" },
            });
        } catch {
            toast.success("Logged out successfully", {
                style: {
                    borderRadius: "12px",
                    background: "#ffffff",
                    color: "#0f172a",
                    border: "1px solid #e2e8f0",
                },
            });
        } finally {
            navigate("/login");
        }
    };

    return (
        <header className="bg-white border-b border-slate-200 py-3.5 sticky top-0 z-30 shadow-sm">
            <div className="max-w-7xl mx-auto flex items-center px-6 justify-between">
                {/* LOGO BRAND */}
                <div className="flex items-center gap-2">
                    <Link to="/" className="font-bold text-slate-900 text-lg tracking-tight flex gap-2 items-center">
                        <ChartCandlestick className="w-6 h-auto" strokeWidth={1.8} />
                        <p>TradeJournal</p>
                    </Link>
                </div>

                {/* CONTAINER DROPDOWN PROFILE */}
                <div className="flex items-center gap-4 relative" ref={dropdownRef}>
                    {/* BUTTON AVATAR PROFILE */}
                    <button
                        type="button"
                        onClick={() => setIsDropdownOpen((prev) => !prev)}
                        className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100/80 transition-colors cursor-pointer outline-none group"
                    >

                        {/* Icon Panah Dropdown */}
                        <ChevronDown
                            size={15}
                            className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180 text-slate-700" : ""
                                }`}
                        />

                        <div className="hidden sm:flex flex-col text-left max-w-[160px]">
                            <span className="text-xs font-bold text-slate-800 truncate leading-tight">
                                {userName}
                            </span>
                            <span className="text-[11px] text-slate-500 truncate leading-tight">
                                {userEmail}
                            </span>
                        </div>

                        {/* Circle Avatar (Inisial Nama / Foto) */}
                        <div className="w-8 h-8 rounded-full bg-[#222d35] text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-slate-100 group-hover:ring-slate-200 transition-all">
                            {initial}
                        </div>

                    </button>

                    {/* DROPDOWN MENU */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-slate-200/90 shadow-xl py-2 z-50 animate-in fade-in duration-150">
                            {/* Sub-header info akun */}
                            <div className="px-4 py-2 border-b border-slate-100 mb-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Signed in as
                                </p>
                                <p className="text-xs font-bold text-slate-800 truncate mt-0.5">
                                    {userEmail}
                                </p>
                            </div>

                            {/* Menu 1: Profile */}
                            <Link to="/profile"
                                type="button"
                                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                            >
                                <User size={16} className="text-slate-400" />
                                <span>Profile</span>
                            </Link>

                            {/* Menu 2: Logout */}
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                                <LogOut size={16} className="text-rose-500" />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}