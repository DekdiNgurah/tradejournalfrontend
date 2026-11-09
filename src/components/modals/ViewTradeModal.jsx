import React, { useEffect } from "react";
import { X, Trash2, Edit2, ExternalLink } from "lucide-react";

export default function ViewTradeModal({
    isOpen,
    onClose,
    trade,
    onEditTrade,
    onDeleteTrade,
}) {
    // Lock background body scroll saat modal terbuka
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

    if (!isOpen || !trade) return null;

    // Format PnL & Indikator Warna
    const isProfit = trade.pnl >= 0;
    const pnlFormatted = isProfit
        ? `+$${Number(trade.pnl).toFixed(2)}`
        : `-$${Math.abs(Number(trade.pnl)).toFixed(2)}`;

    // Gambar Chart Fallback (Memeriksa string path atau File object)
    const chartImageSrc =
        typeof trade.screenshot === "string" && trade.screenshot.trim() !== ""
            ? trade.screenshot
            : trade.screenshot instanceof File
                ? URL.createObjectURL(trade.screenshot)
                : null;

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200" style={{ marginTop : 0 }}>
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-auto max-h-[90vh] overflow-y-auto">
                {/* HEADER MODAL */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                                {trade.pair}
                            </h2>
                            <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${trade.direction === "BUY"
                                        ? "bg-emerald-50 text-[#047857] border-emerald-200"
                                        : "bg-rose-50 text-rose-600 border-rose-200"
                                    }`}
                            >
                                {trade.direction}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {trade.fullDate || trade.date || "Monday, 2 November 2026"}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        type="button"
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-5">
                    {/* PROFIT / LOSS CARD */}
                    <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-5">
                        <span className="text-xs font-semibold text-slate-400 block mb-1">
                            Profit / Loss
                        </span>
                        <span
                            className={`text-3xl font-extrabold tracking-tight ${isProfit ? "text-[#047857]" : "text-rose-600"
                                }`}
                        >
                            {pnlFormatted}
                        </span>
                    </div>

                    {/* METRICS GRID (Pair, Entry, Exit, Lot Size, Follow Plan) */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-white border border-slate-200/80 rounded-2xl p-4">
                        {/* Kolom 1: Pair */}
                        <div>
                            <span className="text-xs font-medium text-slate-400 block mb-1">
                                Pair / Asset
                            </span>
                            <span className="text-base font-bold text-slate-900">
                                {trade.pair}
                            </span>
                        </div>

                        {/* Kolom 2: Entry Price */}
                        <div>
                            <span className="text-xs font-medium text-slate-400 block mb-1">
                                Entry price
                            </span>
                            <span className="text-base font-bold text-slate-900">
                                {trade.entry || trade.entryPrice || "0.00"}
                            </span>
                        </div>

                        {/* Kolom 3: Exit Price */}
                        <div>
                            <span className="text-xs font-medium text-slate-400 block mb-1">
                                Exit price
                            </span>
                            <span className="text-base font-bold text-slate-900">
                                {trade.exit || trade.exitPrice || "0.00"}
                            </span>
                        </div>

                        {/* Kolom 4: Lot Size */}
                        <div>
                            <span className="text-xs font-medium text-slate-400 block mb-1">
                                Lot size
                            </span>
                            <span className="text-base font-bold text-slate-900">
                                {trade.lotSize || trade.lot || "0.10"}
                            </span>
                        </div>

                        {/* Kolom 5: Follow Plan */}
                        <div>
                            <span className="text-xs font-medium text-slate-400 block mb-1">
                                Follow plan
                            </span>
                            {trade.followPlan ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#047857] border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#047857]"></span>
                                    Yes
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                                    No
                                </span>
                            )}
                        </div>
                    </div>

                    {/* NOTES SECTION */}
                    {trade.notes && (
                        <div>
                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                NOTES
                            </h4>
                            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                                {trade.notes}
                            </p>
                        </div>
                    )}

                    {/* CHART SCREENSHOT SECTION */}
                    <div>
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            CHART SCREENSHOT
                        </h4>

                        {chartImageSrc ? (
                            <a
                                href={chartImageSrc}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block relative rounded-2xl overflow-hidden border border-slate-200 group cursor-pointer shadow-sm hover:shadow-md transition-all"
                                title="Click to open full image in new tab"
                            >
                                <img
                                    src={chartImageSrc}
                                    alt={`Chart ${trade.pair}`}
                                    className="w-full max-h-96 object-cover bg-slate-900 group-hover:scale-[1.01] transition-transform duration-200"
                                />

                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold gap-2 transition-opacity">
                                    <ExternalLink size={16} />
                                    <span>Open image in new tab</span>
                                </div>
                            </a>
                        ) : (
                            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                                <p className="text-xs text-slate-400 font-medium">
                                    no screenshoot uploaded
                                </p>
                            </div>
                        )}
                    </div>

                    {/* FOOTER ACTIONS */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                if (onDeleteTrade) onDeleteTrade(trade);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer"
                        >
                            <Trash2 size={15} />
                            <span>Delete</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                onClose(); // Tutup modal view terlebih dahulu
                                if (onEditTrade) onEditTrade(trade); // Buka modal edit trade
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#071B2B] hover:bg-[#1a2b3c] text-white rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
                        >
                            <Edit2 size={15} />
                            <span>Edit trade</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}