import { X, Plus, Eye, Edit2, Trash2 } from "lucide-react";

export default function DayDetailModal({
  isOpen,
  onClose,
  dateInfo,
  onOpenAddTrade,
  onViewTrade,
  onEditTrade,
  onDeleteTrade,
}) {

  // useEffect(() => {
  //   if (isOpen) {
  //     document.body.style.overflow = "hidden";
  //   } else {
  //     document.body.style.overflow = "unset";
  //   }
  //   return () => {
  //     document.body.style.overflow = "unset";
  //   };
  // }, [isOpen]);

  if (!isOpen || !dateInfo) return null;

  const dayTrades = dateInfo.trades || [];
  const hasTrades = dayTrades.length > 0;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" style={{ marginTop: 0 }}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] flex flex-col">
        {/* Header Modal */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {dateInfo.fullDateString || "Detail Tanggal"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {hasTrades
                ? `${dayTrades.length} trades on this day`
                : "0 trades on this day"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Box (Scrollable jika trade banyak) */}
        <div className="space-y-4 overflow-y-auto pr-0.5">
          {/* Daily PnL Box */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Daily PnL</span>
            <span
              className={`text-xl font-bold ${!hasTrades || dateInfo.pnlAmount === 0 || dateInfo.pnlDisplay === "$0.00"
                ? "text-slate-400"
                : (dateInfo.pnlAmount ?? 0) > 0 || dateInfo.pnlDisplay?.includes("+")
                  ? "text-[#047857]"
                  : "text-rose-600"
                }`}
            >
              {dateInfo.pnlDisplay || "$0.00"}
            </span>
          </div>

          {/* List Kartu Transaksi (Jika Ada Transaksi) */}
          {hasTrades ? (
            <div className="space-y-3">
              {dayTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col gap-1.5 hover:border-slate-300 transition-all"
                >
                  {/* Baris Atas: Pair, Badge Direction, Badge Follow Plan, PnL & Aksi */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {trade.pair}
                      </span>

                      {/* Badge Direction (BUY / SELL) */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${trade.direction === "BUY"
                          ? "bg-emerald-50 text-[#047857] border-emerald-200/70"
                          : "bg-rose-50 text-rose-600 border-rose-200/70"
                          }`}
                      >
                        {trade.direction}
                      </span>

                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${trade.followPlan
                        ? "bg-emerald-50 text-[#047857] border border-emerald-200/60"
                        : "bg-rose-50 text-rose-600 border border-rose-200/60"
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${trade.followPlan ? "bg-[#047857]" : "bg-rose-600"}`}></span>
                        {trade.followPlan ? "Yes" : "No"}
                      </span>
                    </div>

                    {/* PnL & Tombol Aksi */}
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-bold ${trade.pnl >= 0 ? "text-[#047857]" : "text-rose-600"
                          }`}
                      >
                        {trade.pnl >= 0
                          ? `+$${trade.pnl.toFixed(2)}`
                          : `-$${Math.abs(trade.pnl).toFixed(2)}`}
                      </span>

                      <div className="flex items-center gap-1.5 text-slate-400">
                        <button
                          onClick={() => onViewTrade && onViewTrade(trade)}
                          className="hover:text-slate-700 transition-colors p-0.5"
                          title="View detail"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => onEditTrade && onEditTrade(trade)}
                          className="hover:text-slate-700 transition-colors p-0.5"
                          title="Edit trade"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => onDeleteTrade && onDeleteTrade(trade)}
                          className="hover:text-rose-600 transition-colors p-0.5"
                          title="Delete trade"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Baris Bawah: Detail Harga Entry -> Exit & Lot Size */}
                  <div className="text-xs text-slate-400 font-medium">
                    {trade.entry} → {trade.exit} · {trade.lotSize || trade.lot || "0.15"} lot
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-xs text-slate-400">
                No trades recorded on this day.
              </p>
            </div>
          )}

          {/* Tombol Add Trade On This Day */}
          <button
            onClick={() => {
              onClose();
              onOpenAddTrade(dateInfo.rawDate);
            }}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Plus size={15} />
            <span>Add trade on this day</span>
          </button>
        </div>
      </div>
    </div>
  );
}