import React, { useState } from "react";
import { Loader2 } from "lucide-react";

export default function DeleteConfirmModal({
    isOpen,
    onClose,
    trade,
    onConfirmDelete,
}) {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen || !trade) return null;

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onConfirmDelete(trade);
        } finally {
            setIsDeleting(false);
        }
    };

    // Format PnL (+ $550.00 / - $51.20)
    const pnlAmount = Number(trade.pnl || 0);
    const formattedPnL =
        pnlAmount >= 0
            ? `+$${pnlAmount.toFixed(2)}`
            : `-$${Math.abs(pnlAmount).toFixed(2)}`;

    const tradeDateStr = trade.date || trade.rawDate || "2 Nov 2026";

    return (
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" style={{ marginTop: 0 }}>
            <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-auto">
                {/* JUDUL MODAL */}
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                    Delete this trade?
                </h3>

                {/* PESAN RINGKASAN DINAMIS */}
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
                    <span className="font-medium text-slate-700">
                        {trade.pair} · {tradeDateStr} · {formattedPnL}
                    </span>
                    . This removes it from the journal, the calendar and all summaries.
                    This can't be undone.
                </p>

                {/* TOMBOL AKSI */}
                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer inline-flex items-center justify-center gap-2"
                    >
                        {isDeleting && <Loader2 size={14} className="animate-spin" />}
                        {isDeleting ? "Deleting..." : "Delete trade"}
                    </button>
                </div>
            </div>
        </div>
    );
}