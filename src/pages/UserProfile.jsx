import { useState, useEffect } from "react";
import { useAuth } from "../utils/AuthContext";
import { User, ArrowLeft, Mail, Lock, Key, Save, Edit3, Shield, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "../utils/apiClient";
import { Link } from "react-router-dom";



// bikin inisial profile
const getInitials = (nameStr) => {
    if (!nameStr) return "U";
    const words = nameStr.trim().split(" ").filter(Boolean);
    if (words.length === 0) return "U";
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

export default function UserProfile() {
    const { updateUser } = useAuth();

    const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'security'
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // 1. Dynamic User State (Fetched from API)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
    });

    // Temporary state for editing form
    const [tempFormData, setTempFormData] = useState({
        name: "",
        email: "",
    });

    // 2. Security Form State
    const [securityData, setSecurityData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const fetchUserProfile = async () => {
        setIsLoading(true);
        try {
            // Endpoint bawaan Laravel Sanctum untuk mengambil data user login
            const response = await apiClient.get("/user");
            const userData = response.data?.data || response.data;

            const profile = {
                name: userData.name || "",
                email: userData.email || "",
            };

            setFormData(profile);
            setTempFormData(profile);
            updateUser(profile);
        } catch (error) {
            console.error("Failed to fetch profile:", error);
            toast.error(error.response?.data?.message || "Failed to load user profile");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    // Handlers Input
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setTempFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSecurityChange = (e) => {
        const { name, value } = e.target;
        setSecurityData((prev) => ({ ...prev, [name]: value }));
    };

    const handleToggleEdit = () => {
        if (isEditing) {
            setTempFormData(formData);
            setIsEditing(false);
        } else {
            setTempFormData(formData);
            setIsEditing(true);
        }
    };

    // update profile
    const handleSaveProfile = async (e) => {
        e.preventDefault();

        if (!tempFormData.name.trim() || !tempFormData.email.trim()) {
            toast.error("Name and Email are required.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await apiClient.put("/user", {
                name: tempFormData.name,
                email: tempFormData.email,
            });

            const updatedUserData = response.data?.data || response.data;

            const newProfile = {
                name: updatedUserData.name || tempFormData.name,
                email: updatedUserData.email || tempFormData.email,
            };

            setFormData(newProfile);
            setTempFormData(newProfile);
            setIsEditing(false);

            updateUser(newProfile);

            toast.success(response.data?.message || "Profile information updated successfully!", {
                style: { borderRadius: "12px", background: "#ffffff", color: "#0f172a", border: "1px solid #e2e8f0" },
                iconTheme: { primary: "#10B981", secondary: "#ffffff" },
            });

        } catch (error) {
            console.error("Update profile error:", error);
            let errorMessage = "Failed to update profile.";
            if (error.response?.data?.errors) {
                const firstKey = Object.keys(error.response.data.errors)[0];
                errorMessage = error.response.data.errors[firstKey][0];
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ganti password
    const handleSavePassword = async (e) => {
        e.preventDefault();

        if (!securityData.currentPassword) {
            toast.error("Please enter your current password.");
            return;
        }

        if (securityData.newPassword.length < 8) {
            toast.error("New password must be at least 8 characters long.");
            return;
        }

        if (securityData.newPassword !== securityData.confirmPassword) {
            toast.error("New passwords do not match.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await apiClient.put("/user/password", {
                current_password: securityData.currentPassword,
                password: securityData.newPassword,
                password_confirmation: securityData.confirmPassword,
            });

            setSecurityData({ currentPassword: "", newPassword: "", confirmPassword: "" });

            toast.success(response.data?.message || "Password updated successfully! Please log in again", {
                style: { borderRadius: "12px", background: "#ffffff", color: "#0f172a", border: "1px solid #e2e8f0" },
                iconTheme: { primary: "#10B981", secondary: "#ffffff" },
            });

        } catch (error) {
            console.error("Update password error:", error);
            let errorMessage = "Failed to update password.";
            if (error.response?.data?.errors) {
                const firstKey = Object.keys(error.response.data.errors)[0];
                errorMessage = error.response.data.errors[firstKey][0];
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const userInitials = getInitials(formData.name);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-400 text-xs">
                <Loader2 size={20} className="animate-spin text-slate-600 mr-2" />
                <span>Loading profile data...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 font-sans">
            <Link to="/" className="flex item gap-2 mb-6">
                <ArrowLeft className="w-4 h-auto" />
                <p className="text-sm">Back to Dashboard</p>
            </Link>
            <div className=" mx-auto space-y-6">

                {/* 1. HEADER PROFILE CARD */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    {/* Cover Banner */}
                    <div className="h-28 sm:h-36 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 relative">
                        <div className="absolute inset-0 bg-black/10"></div>
                    </div>

                    {/* User Header Detail */}
                    <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-12 sm:-mt-14">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">

                            {/* Dynamic Initials Avatar */}
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#071B2B] text-emerald-400 font-bold text-2xl sm:text-3xl border-4 border-white shadow-md flex items-center justify-center tracking-wider select-none">
                                {userInitials}
                            </div>

                            {/* Dynamic User Identity */}
                            <div className="mb-1 space-y-0.5">
                                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                                    {formData.name || "User"}
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                                    {formData.email || "-"}
                                </p>
                            </div>
                        </div>

                        {/* Action Toggle Button */}
                        {activeTab === "profile" && (
                            <div className="mb-1">
                                <button
                                    type="button"
                                    onClick={handleToggleEdit}
                                    disabled={isSubmitting}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border shadow-sm ${isEditing
                                        ? "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                                        : "bg-[#071B2B] text-white border-transparent hover:bg-[#202734]"
                                        }`}
                                >
                                    {isEditing ? (
                                        <>
                                            <X size={15} />
                                            <span>Cancel</span>
                                        </>
                                    ) : (
                                        <>
                                            <Edit3 size={15} />
                                            <span>Edit Profile</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* TAB NAVIGATION */}
                    <div className="flex border-t border-slate-100 px-6 gap-6">
                        <button
                            onClick={() => {
                                setActiveTab("profile");
                                setIsEditing(false);
                            }}
                            className={`py-3.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${activeTab === "profile"
                                ? "border-emerald-600 text-emerald-700"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                                }`}
                        >
                            <User size={16} />
                            <span>Personal Information</span>
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab("security");
                                setIsEditing(false);
                            }}
                            className={`py-3.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${activeTab === "security"
                                ? "border-emerald-600 text-emerald-700"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                                }`}
                        >
                            <Shield size={16} />
                            <span>Security & Password</span>
                        </button>
                    </div>
                </div>

                {/* 2. PERSONAL INFORMATION TAB */}
                {activeTab === "profile" && (
                    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
                            <p className="text-xs text-slate-500">
                                {isEditing
                                    ? "Update your personal account details below."
                                    : "View your personal account information."}
                            </p>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-5 max-w-lg">
                            {/* Full Name Field */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        name="name"
                                        disabled={!isEditing || isSubmitting}
                                        value={isEditing ? tempFormData.name : formData.name}
                                        onChange={handleProfileChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 disabled:opacity-75 disabled:bg-slate-50/40"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email Address Field */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        disabled={!isEditing || isSubmitting}
                                        value={isEditing ? tempFormData.email : formData.email}
                                        onChange={handleProfileChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 disabled:opacity-75 disabled:bg-slate-50/40"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Save Buttons */}
                            {isEditing && (
                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={handleToggleEdit}
                                        disabled={isSubmitting}
                                        className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-5 py-2 bg-[#071B2B] hover:bg-[#202734] text-white rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 size={15} className="animate-spin" />
                                        ) : (
                                            <Save size={15} />
                                        )}
                                        <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                )}

                {/* 3. SECURITY & PASSWORD TAB */}
                {activeTab === "security" && (
                    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-base font-bold text-slate-900">Change Password</h2>
                            <p className="text-xs text-slate-500">
                                Ensure your account is using a long, random password to stay secure.
                            </p>
                        </div>

                        <form onSubmit={handleSavePassword} className="space-y-4 max-w-md">
                            {/* Current Password */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        disabled={isSubmitting}
                                        value={securityData.currentPassword}
                                        onChange={handleSecurityChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                                        placeholder="Enter current password"
                                        required
                                    />
                                </div>
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="password"
                                        name="newPassword"
                                        disabled={isSubmitting}
                                        value={securityData.newPassword}
                                        onChange={handleSecurityChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                                        placeholder="At least 8 characters"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Confirm New Password */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        disabled={isSubmitting}
                                        value={securityData.confirmPassword}
                                        onChange={handleSecurityChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                                        placeholder="Re-enter new password"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Save Password Button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-[#071B2B] hover:bg-[#202734] text-white rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <Loader2 size={15} className="animate-spin" />
                                    ) : (
                                        <Save size={15} />
                                    )}
                                    <span>{isSubmitting ? "Updating..." : "Update Password"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                )}

            </div>
        </div>
    );
}