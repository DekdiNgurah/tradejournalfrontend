import { useState, useEffect } from "react";
import { X, ImagePlus, Loader2 } from "lucide-react";
import apiClient from "../../utils/apiClient";
import toast from "react-hot-toast";

const STANDARD_PAIRS = ["XAUUSD", "EURUSD", "GBPUSD", "BTCUSD", "US30"];

const getLocalDateString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};

// Helper konversi tanggal ke format ISO YYYY-MM-DD untuk <input type="date" />
const formatDateToISO = (dateStr) => {
    if (!dateStr) return getLocalDateString();
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
        const yyyy = parsed.getFullYear();
        const mm = String(parsed.getMonth() + 1).padStart(2, "0");
        const dd = String(parsed.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }
    return getLocalDateString();
};

export default function AddTradeModal({
    isOpen,
    onClose,
    initialDate,
    tradeToEdit = null, // Prop data trade jika dalam mode Edit
    onSave,
}) {

    // buat ngecek apakah mau edit atau mau nambah 
    const isEditMode = Boolean(tradeToEdit);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        date: "",
        pair: "XAUUSD",
        customPair: "",
        direction: "BUY",
        entryPrice: "",
        exitPrice: "",
        lotSize: "0.10",
        pnl: "",
        followPlan: "YES",
        notes: "",
        screenshot: null,
    });

    const [isCustomPair, setIsCustomPair] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    // Auto-fill form jika dalam mode Edit / reset jika mode Add
    useEffect(() => {
        if (!isOpen) return;

        if (isEditMode && tradeToEdit) {
            const isCustom = !STANDARD_PAIRS.includes(tradeToEdit.pair);

            let imageSrc = null;
            if (typeof tradeToEdit.screenshot === "string" && tradeToEdit.screenshot.trim() !== "") {
                imageSrc = tradeToEdit.screenshot;
            } else if (tradeToEdit.screenshot instanceof File) {
                imageSrc = URL.createObjectURL(tradeToEdit.screenshot);
            }

            setFormData({
                id: tradeToEdit.id,
                // 💡 Gunakan helper formatDateToISO untuk memastikan format YYYY-MM-DD
                date: formatDateToISO(tradeToEdit.rawDate || tradeToEdit.date),
                pair: isCustom ? "CUSTOM" : tradeToEdit.pair,
                customPair: isCustom ? tradeToEdit.pair : "",
                direction: tradeToEdit.direction || "BUY",
                entryPrice: tradeToEdit.entry || tradeToEdit.entryPrice || "",
                exitPrice: tradeToEdit.exit || tradeToEdit.exitPrice || "",
                lotSize: tradeToEdit.lotSize || tradeToEdit.lot || "0.10",
                pnl: tradeToEdit.pnl !== undefined ? tradeToEdit.pnl : "",
                followPlan: tradeToEdit.followPlan ? "YES" : "NO",
                notes: tradeToEdit.notes || "",
                screenshot: tradeToEdit.screenshot || null,
            });

            setIsCustomPair(isCustom);
            setPreviewImage(imageSrc);
        } else {
            // Mode Add Trade Baru
            const defaultDate = formatDateToISO(initialDate);
            setFormData({
                date: defaultDate,
                pair: "XAUUSD",
                customPair: "",
                direction: "BUY",
                entryPrice: "",
                exitPrice: "",
                lotSize: "0.10",
                pnl: "",
                followPlan: "YES",
                notes: "",
                screenshot: null,
            });
            setIsCustomPair(false);
            setPreviewImage(null);
        }
    }, [isOpen, tradeToEdit, initialDate, isEditMode]);

    // Lock body scroll saat modal terbuka
    // useEffect(() => {
    //     if (isOpen) {
    //         document.body.style.overflow = "hidden";
    //     } else {
    //         document.body.style.overflow = "unset";
    //     }
    //     return () => {
    //         document.body.style.overflow = "unset";
    //     };
    // }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePairChange = (e) => {
        const val = e.target.value;
        if (val === "CUSTOM") {
            setIsCustomPair(true);
            setFormData((prev) => ({ ...prev, pair: "CUSTOM" }));
        } else {
            setIsCustomPair(false);
            setFormData((prev) => ({ ...prev, pair: val, customPair: "" }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prev) => ({ ...prev, screenshot: file }));
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const finalPairName = isCustomPair
            ? formData.customPair.toUpperCase().trim()
            : formData.pair;

        if (!finalPairName) {
            toast.error("Silakan isi nama Pair / Asset terlebih dahulu.");
            return;
        }

        setIsSubmitting(true);

        try {
            // -----------------------------------------------------------
            // STEP 1: Simpan Data Trade ke TradeController (Tanpa Gambar)
            // -----------------------------------------------------------
            const tradeData = {
                trade_date: formData.date || "",
                pair: finalPairName,
                direction: formData.direction === "BUY" ? "buy" : "sell",
                entry_price: formData.entryPrice || 0,
                exit_price: formData.exitPrice || 0,
                lot_size: formData.lotSize || 0,
                pnl: formData.pnl || 0,
                follow_plan: formData.followPlan === "YES" ? 1 : 0,
                notes: formData.notes || "",
            };

            let response;
            if (isEditMode && tradeToEdit?.id) {
                response = await apiClient.put(`/trades/${tradeToEdit.id}`, tradeData);
            } else {
                response = await apiClient.post("/trades", tradeData);
            }

            // Ambil ID Trade yang baru saja disimpan
            const savedTradeId = response.data?.data?.id || response.data?.id || tradeToEdit?.id;

            // -----------------------------------------------------------
            // STEP 2: Upload Gambar ke TradeImageController (Jika Ada File)
            // -----------------------------------------------------------
            let imageUploadError = null;
            if (formData.screenshot instanceof File && savedTradeId) {
                try {
                    const imageFormData = new FormData();
                    imageFormData.append("image", formData.screenshot);

                    await apiClient.post(`/trades/${savedTradeId}/images`, imageFormData, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });
                } catch (imageError) {
                    console.error("Failed to upload image:", imageError.response?.data);
                    imageUploadError =
                        imageError.response?.data?.errors?.image?.[0] ||
                        imageError.response?.data?.message ||
                        "Image upload failed.";
                }
            }

            if (imageUploadError) {
                toast.error(`Trade saved, but image upload failed: ${imageUploadError}`);
            } else {
                toast.success(
                    response.data?.message || (isEditMode ? "Trade updated successfully!" : "Trade saved successfully!"),
                    {
                        duration: 3000,
                        style: {
                            borderRadius: "12px",
                            background: "#ffffff",
                            color: "#0f172a",
                            border: "1px solid #e2e8f0",
                        },
                        iconTheme: { primary: "#10B981", secondary: "#ffffff" },
                    }
                );
            }

            if (onSave) await onSave(response.data?.data || response.data); // Refresh data Dashboard
            onClose(); // Tutup modal

        } catch (error) {
            console.error("Save trade error response:", error.response?.data);

            let errorMessage = "Failed to save trade. Please check your inputs.";
            if (error.response?.data?.errors) {
                const firstErrorKey = Object.keys(error.response.data.errors)[0];
                errorMessage = error.response.data.errors[firstErrorKey][0];
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            toast.error(errorMessage, {
                style: {
                    borderRadius: "12px",
                    background: "#ffffff",
                    color: "#0f172a",
                    border: "1px solid #e2e8f0",
                },
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200" style={{ marginTop: 0 }}>
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto my-auto">
                {/* HEADER MODAL */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            {isEditMode ? "Edit trade" : "Add trade"}
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                            {isEditMode
                                ? "Update your journal entry and PnL summaries."
                                : "One entry updates your journal, PnL calendar and all summaries."}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        type="button"
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* SECTION 1: TRADE INFORMATION */}
                    <div className="space-y-4">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            TRADE INFORMATION
                        </h4>

                        {/* Row 1: Date & Pair */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Pair / Asset
                                </label>
                                <select
                                    name="pair"
                                    value={isCustomPair ? "CUSTOM" : formData.pair}
                                    onChange={handlePairChange}
                                    className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                                >
                                    {STANDARD_PAIRS.map((p) => (
                                        <option key={p} value={p}>
                                            {p}
                                        </option>
                                    ))}
                                    <option value="CUSTOM">+ Custom / Lainnya...</option>
                                </select>

                                {isCustomPair && (
                                    <input
                                        type="text"
                                        name="customPair"
                                        placeholder="e.g. AUDJPY, NVDA, NQ1!"
                                        value={formData.customPair}
                                        onChange={handleChange}
                                        className="w-full mt-2 px-3.5 py-2.5 bg-slate-50 border border-emerald-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 animate-in fade-in duration-150"
                                        required={isCustomPair}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Row 2: Direction */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Direction
                            </label>
                            <div className="bg-slate-100/80 p-1 rounded-xl flex items-center">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData((prev) => ({ ...prev, direction: "BUY" }))
                                    }
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.direction === "BUY"
                                        ? "bg-white text-emerald-700 shadow-sm"
                                        : "text-slate-500 hover:text-slate-800"
                                        }`}
                                >
                                    Buy
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData((prev) => ({ ...prev, direction: "SELL" }))
                                    }
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.direction === "SELL"
                                        ? "bg-white text-rose-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-800"
                                        }`}
                                >
                                    Sell
                                </button>
                            </div>
                        </div>

                        {/* Row 3: Entry, Exit, Lot Size */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Entry price
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    name="entryPrice"
                                    placeholder="0.00"
                                    value={formData.entryPrice}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Exit price
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    name="exitPrice"
                                    placeholder="0.00"
                                    value={formData.exitPrice}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Lot size
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    name="lotSize"
                                    placeholder="0.10"
                                    value={formData.lotSize}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                                />
                            </div>
                        </div>

                        {/* Row 4: PnL ($) */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                PnL ($)
                            </label>
                            <input
                                type="number"
                                step="any"
                                name="pnl"
                                placeholder="e.g. 120 or -45"
                                value={formData.pnl}
                                onChange={handleChange}
                                className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                            />
                            <p className="text-[11px] text-slate-400 mt-1">
                                Use a minus sign for a loss, e.g. -45
                            </p>
                        </div>
                    </div>

                    {/* SECTION 2: TRADING EVALUATION */}
                    <div className="space-y-4">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            TRADING EVALUATION
                        </h4>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Did you follow your plan?
                            </label>
                            <div className="bg-slate-100/80 p-1 rounded-xl flex items-center">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData((prev) => ({ ...prev, followPlan: "YES" }))
                                    }
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.followPlan === "YES"
                                        ? "bg-white text-emerald-700 shadow-sm"
                                        : "text-slate-500 hover:text-slate-800"
                                        }`}
                                >
                                    Yes
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData((prev) => ({ ...prev, followPlan: "NO" }))
                                    }
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.followPlan === "NO"
                                        ? "bg-white text-rose-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-800"
                                        }`}
                                >
                                    No
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Notes
                            </label>
                            <textarea
                                name="notes"
                                rows={3}
                                placeholder="Entry reason, market conditions, analysis..."
                                value={formData.notes}
                                onChange={handleChange}
                                className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 resize-y"
                            />
                        </div>
                    </div>

                    {/* SECTION 3: CHART SCREENSHOT DROPZONE */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Chart screenshot
                        </label>
                        <label className="border-2 border-dashed border-slate-200 hover:border-slate-300 bg-slate-50/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden group">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            {previewImage ? (
                                <div className="w-full h-36 relative rounded-lg overflow-hidden">
                                    <img
                                        src={previewImage}
                                        alt="Preview Chart"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity">
                                        Ganti Gambar
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <ImagePlus className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                    <p className="text-xs font-semibold text-slate-700">
                                        Click or drop an image
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        PNG, JPG up to 500 kb
                                    </p>
                                </div>
                            )}
                        </label>
                    </div>

                    {/* FOOTER ACTIONS */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold transition-colors shadow-sm inline-flex items-center justify-center gap-2"
                        >
                            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                            {isSubmitting
                                ? (isEditMode ? "Updating..." : "Saving...")
                                : (isEditMode ? "Update Trade" : "Save Trade")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}