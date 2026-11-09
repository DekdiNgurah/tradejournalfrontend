import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../utils/AuthContext";

export default function Register() {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error("Password confirmation does not match", {
                style: { borderRadius: "12px", background: "#ffffff", color: "#0f172a", border: "1px solid #e2e8f0" },
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await register(
                formData.name,
                formData.email,
                formData.password,
                formData.confirmPassword
            );

            const successMessage = res?.message || "Account created successfully!";
            toast.success(successMessage, {
                duration: 3000,
                style: { borderRadius: "12px", background: "#ffffff", color: "#0f172a", border: "1px solid #e2e8f0" },
                iconTheme: { primary: "#10B981", secondary: "#ffffff" },
            });

            navigate("/login");
        } catch (error) {
            console.error("Axios Error Object:", error);
            console.error("Error Message:", error.message);

            let errorMessage = "Registration failed. Please try again.";

            if (error.response) {

                const data = error.response.data;

                if (data.errors) {
                    const firstKey = Object.keys(data.errors)[0];
                    errorMessage = data.errors[firstKey][0];
                } else if (data.message) {
                    errorMessage = data.message;
                }
            } else if (error.request) {
                errorMessage = "Network Error: Cannot connect to http://127.0.0.1:8000";
            }

            toast.error(errorMessage, {
                style: { borderRadius: "12px", background: "#ffffff", color: "#0f172a", border: "1px solid #e2e8f0" },
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-slate-100">
                {/* BRAND HEADER */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Create an account
                    </h1>
                    <p className="text-xs text-slate-500 mt-1.5">
                        Start tracking your trading performance today
                    </p>
                </div>

                {/* FORM REGISTER */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Username FIELD */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Username
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <User size={16} />
                            </div>
                            <input
                                type="text"
                                name="name"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* EMAIL FIELD */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Email address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Mail size={16} />
                            </div>
                            <input
                                type="email"
                                name="email"
                                placeholder="name@company.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* PASSWORD FIELD */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Lock size={16} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-10 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 placeholder:text-slate-400"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* CONFIRM PASSWORD FIELD */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Lock size={16} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* SUBMIT BUTTON */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-2 py-2.5 bg-[#071B2B] hover:bg-[#1a2b3c] text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <span>{isSubmitting ? "Creating account..." : "Create account"}</span>
                        <ArrowRight size={15} />
                    </button>
                </form>

                {/* FOOTER LINK */}
                <div className="text-center mt-6 pt-6 border-t border-slate-100">
                    <p className="text-xs text-slate-500">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="font-bold text-slate-900 hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}