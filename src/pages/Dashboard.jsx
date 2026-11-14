import React, { useState, useEffect, useRef } from "react";
import { Plus, Search, ChevronLeft, ChevronRight, Eye, Edit2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "../utils/apiClient";

// modal
import DayDetailModal from "../components/modals/DayDetailModal";
import AddTradeModal from "../components/modals/AddTradeModal";
import ViewTradeModal from "../components/modals/ViewTradeModal";
import DeleteConfirmModal from "../components/modals/DeleteConfirmModal";

const getCalenderDays = (year, monthIndex, tradesData = []) => {
    const firstDayOfMonth = new Date(year, monthIndex, 1);
    const lastDayOfMonth = new Date(year, monthIndex + 1, 0);

    let startingDayOfWeek = firstDayOfMonth.getDay();
    startingDayOfWeek = (startingDayOfWeek + 6) % 7;

    const daysInMonth = lastDayOfMonth.getDate();
    const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();

    const days = [];
    const today = new Date();

    // Hari bulan sebelumnya
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const prevDay = prevMonthLastDay - i;
        const prevMonth = monthIndex === 0 ? 11 : monthIndex - 1;
        const prevYear = monthIndex === 0 ? year - 1 : year;
        days.push({
            day: prevDay,
            month: prevMonth,
            year: prevYear,
            isCurrentMonth: false,
        });
    }

    // Hari bulan berjalan
    for (let d = 1; d <= daysInMonth; d++) {
        const isToday =
            d === today.getDate() && monthIndex === today.getMonth() && year === today.getFullYear();

        const formattedDate = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

        const dayTrades = Array.isArray(tradesData)
            ? tradesData.filter((t) => (t.rawDate || (t.date ? t.date.split("T")[0] : "")) === formattedDate)
            : [];

        const hasTrades = dayTrades.length > 0;
        const dayPnLTotal = dayTrades.reduce((sum, t) => sum + Number(t.pnl || 0), 0);

        const pnlText = hasTrades
            ? (dayPnLTotal >= 0 ? `+$${dayPnLTotal.toFixed(2)}` : `-$${Math.abs(dayPnLTotal).toFixed(2)}`)
            : null;

        const countText = hasTrades
            ? `${dayTrades.length} trade${dayTrades.length > 1 ? "s" : ""}`
            : null;

        days.push({
            day: d,
            month: monthIndex,
            year: year,
            isCurrentMonth: true,
            isToday: isToday,
            rawDate: formattedDate,
            hasTrades: hasTrades,
            pnl: pnlText,
            pnlAmount: dayPnLTotal,
            tradesCount: countText,
            dayTrades: dayTrades,
        });
    }

    // Hari bulan berikutnya
    const totalSlots = days.length > 35 ? 42 : 35;
    const slotsToAdd = totalSlots - days.length;

    for (let i = 1; i <= slotsToAdd; i++) {
        const nextMonth = monthIndex === 11 ? 0 : monthIndex + 1;
        const nextYear = monthIndex === 11 ? year + 1 : year;
        days.push({
            day: i,
            month: nextMonth,
            year: nextYear,
            isCurrentMonth: false,
        });
    }

    return days;
};

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const formatDisplayDate = (dateString) => {
    if (!dateString) return "";
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
    const dateObj = dateMatch
        ? new Date(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3]))
        : new Date(dateString);
    if (isNaN(dateObj.getTime())) return dateString;
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = monthNames[dateObj.getMonth()].substring(0, 3);
    const year = dateObj.getFullYear();
    return `${day} ${month} ${year}`;
};

const normalizeTrade = (item) => {
    const rawDateStr = item.trade_date || item.date || item.created_at || "";
    const cleanRawDate = typeof rawDateStr === "string" && rawDateStr.includes("T")
        ? rawDateStr.split("T")[0]
        : rawDateStr;
    const images = item.images?.data || item.images || [];
    const followPlanValue = item.follow_plan;
    const followPlan = followPlanValue === true
        || followPlanValue === 1
        || (typeof followPlanValue === "string" && ["1", "true", "yes"].includes(followPlanValue.trim().toLowerCase()));

    return {
        id: item.id,
        rawDate: cleanRawDate,
        date: cleanRawDate ? formatDisplayDate(cleanRawDate) : "",
        pair: item.pair || "XAUUSD",
        direction: (item.direction || item.type || "BUY").toUpperCase(),
        entry: item.entry_price || item.entry || "0.00",
        exit: item.exit_price || item.exit || "0.00",
        lot: item.lot_size || item.lot || "0.00",
        pnl: Number(item.pnl || 0),
        followPlan,
        notes: item.notes || "",
        screenshot: images[0]?.image_url || item.image_url || item.screenshot || item.image || null,
    };
};

export default function Dashboard({ user = { email: "dekdipratiwi7@gmail.com" }, onLogout, onOpenAddModal }) {

    // state
    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedPair, setSelectedPair] = useState("");
    const [selectedResult, setSelectedResult] = useState("");

    // state modal
    const [selectedDateInfo, setSelectedDateInfo] = useState(null);
    const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);
    const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
    const [addTradeInitialDate, setAddTradeInitialDate] = useState("");
    const [selectedTrade, setSelectedTrade] = useState(null);
    const [isViewTradeOpen, setIsViewTradeOpen] = useState(false);
    const [tradeToEdit, setTradeToEdit] = useState(null);
    const [tradeToDelete, setTradeToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        const isAnyModalOpen = isDayDetailOpen || isAddTradeOpen || isViewTradeOpen || isDeleteModalOpen;

        if (isAnyModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isDayDetailOpen, isAddTradeOpen, isViewTradeOpen, isDeleteModalOpen]);

    // Handler untuk Membuka Modal View
    const handleViewTrade = (trade) => {
        setSelectedTrade(trade);
        setIsViewTradeOpen(true);
    };

    // handle open edit trade
    const handleOpenEditTrade = (trade) => {
        setTradeToEdit(trade);
        setIsAddTradeOpen(true);
    };

    const handleOpenAddTrade = (rawDate = "") => {
        setTradeToEdit(null);
        setAddTradeInitialDate(rawDate);
        setIsAddTradeOpen(true);
    };

    // kalender
    const [currentDate, setCurrentDate] = useState(new Date(2026, 10, 1)); // Note: Month 10 = November

    const [trades, setTrades] = useState([]);
    const [pageTrades, setPageTrades] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [tableRefreshKey, setTableRefreshKey] = useState(0);
    const [pagination, setPagination] = useState({ from: 0, to: 0, total: 0, lastPage: 1 });
    const [, setPageCache] = useState(() => new Map());
    const pageCacheRef = useRef(new Map());
    const inFlightRequests = useRef(new Map());
    const isTableBusy = isLoading || isPageLoading;

    const requestTradesPage = (params) => {
        const requestKey = JSON.stringify(params);
        const existingRequest = inFlightRequests.current.get(requestKey);
        if (existingRequest) return existingRequest;

        const request = apiClient.get("/trades", { params }).finally(() => {
            inFlightRequests.current.delete(requestKey);
        });
        inFlightRequests.current.set(requestKey, request);
        return request;
    };

    // 1. Fetch Data Master dari Backend
    const fetchTrades = async () => {
        setIsLoading(true);
        try {
            const allTrades = [];
            let page = 1;
            let lastPage = 1;

            do {
                const response = await requestTradesPage({ page });
                const rawData = response.data?.data;
                if (!Array.isArray(rawData) || !response.data?.meta) {
                    throw new Error("The trades response is missing its paginated data.");
                }
                allTrades.push(...rawData.map(normalizeTrade));
                lastPage = response.data.meta.last_page;
                page += 1;
            } while (page <= lastPage);

            setTrades(allTrades);
        } catch (error) {
            console.error("Fetch Trades Detailed Error:", error);

            const errorMsg = error.response?.data?.message || error.message || "Failed to load trades";
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let isCurrentRequest = true;
        const loadPage = async () => {
            const params = { page: currentPage };
            const search = searchTerm.trim();
            if (search) params.search = search;
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;
            if (selectedPair && selectedPair !== "All pairs") params.pair = selectedPair;
            if (selectedResult) params.result = selectedResult.toLowerCase();
            const cacheKey = JSON.stringify(params);
            const cachedPage = pageCacheRef.current.get(cacheKey);

            if (cachedPage) {
                setPageTrades(cachedPage.trades);
                setPagination(cachedPage.pagination);
                setIsPageLoading(false);
                return;
            }

            setIsPageLoading(true);

            try {
                const response = await requestTradesPage(params);
                if (!isCurrentRequest) return;
                const meta = response.data?.meta;
                const rawData = response.data?.data;
                if (!meta || !Array.isArray(rawData)) {
                    throw new Error("The trades response is missing its paginated data.");
                }
                if (currentPage > meta.last_page) {
                    setCurrentPage(Math.max(meta.last_page, 1));
                    return;
                }
                const normalizedTrades = rawData.map(normalizeTrade);
                const nextPagination = {
                    from: meta.from || 0,
                    to: meta.to || 0,
                    total: meta.total,
                    lastPage: meta.last_page,
                };
                setPageTrades(normalizedTrades);
                setPagination(nextPagination);
                const nextCache = new Map(pageCacheRef.current);
                nextCache.set(cacheKey, { trades: normalizedTrades, pagination: nextPagination });
                pageCacheRef.current = nextCache;
                setPageCache(nextCache);
            } catch (error) {
                if (isCurrentRequest) {
                    console.error("Fetch paginated trades error:", error);
                    toast.error(error.response?.data?.message || error.message || "Failed to load trades");
                }
            } finally {
                if (isCurrentRequest) setIsPageLoading(false);
            }
        };

        loadPage();
        return () => {
            isCurrentRequest = false;
        };
    }, [currentPage, searchTerm, startDate, endDate, selectedPair, selectedResult, tableRefreshKey]);

    useEffect(() => {
        fetchTrades();
    }, []);

    const refreshTrades = async (savedTrade) => {
        pageCacheRef.current = new Map();
        setPageCache(pageCacheRef.current);

        if (savedTrade) {
            const normalizedTrade = normalizeTrade(savedTrade);
            if (tradeToEdit) {
                setTrades((currentTrades) =>
                    currentTrades.map((trade) => trade.id === normalizedTrade.id ? normalizedTrade : trade)
                );
                setPageTrades((currentTrades) =>
                    currentTrades.map((trade) => trade.id === normalizedTrade.id ? normalizedTrade : trade)
                );
            } else {
                setTrades((currentTrades) => [
                    normalizedTrade,
                    ...currentTrades.filter((trade) => trade.id !== normalizedTrade.id),
                ]);
                setPagination((currentPagination) => {
                    const total = currentPagination.total + 1;
                    return {
                        ...currentPagination,
                        from: total ? (currentPage - 1) * 10 + 1 : 0,
                        to: Math.min(total, currentPage * 10),
                        total,
                        lastPage: Math.max(currentPagination.lastPage, Math.ceil(total / 10)),
                    };
                });
                if (currentPage === 1) {
                    setPageTrades((currentTrades) => [
                        normalizedTrade,
                        ...currentTrades.filter((trade) => trade.id !== normalizedTrade.id),
                    ].slice(0, 10));
                }
            }
            return;
        }

        setCurrentPage(1);
        setTableRefreshKey((key) => key + 1);
        await fetchTrades();
    };

    // 2. Handler Hapus Trade (Tetap di Dashboard)
    const handleConfirmDelete = async (trade) => {
        try {
            const response = await apiClient.delete(`/trades/${trade.id}`);

            setIsDeleteModalOpen(false);
            setTradeToDelete(null);
            setIsViewTradeOpen(false);
            setIsDayDetailOpen(false);

            toast.success(
                <div className="text-left">
                    <p className="font-bold text-sm text-slate-800">Trade Deleted!</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {response.data?.message || "PnL totals were recalculated."}
                    </p>
                </div>
            );

            await refreshTrades();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete trade");
        }
    };

    const stats = React.useMemo(() => {
        const totalTrades = trades.length;
        const netPnL = trades.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
        const winningCount = trades.filter((t) => Number(t.pnl || 0) > 0).length;
        const followPlanCount = trades.filter((t) => t.followPlan).length;
        const winRate = totalTrades ? (winningCount / totalTrades) * 100 : 0;
        const followPlanRate = totalTrades ? (followPlanCount / totalTrades) * 100 : 0;

        return { netPnL, totalTrades, winRate, winningCount, followPlanRate, followPlanCount };
    }, [trades]);

    const currentYear = currentDate.getFullYear();
    const currentMonthIndex = currentDate.getMonth();

    const monthlyStats = React.useMemo(() => {
        const monthPrefix = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, "0")}`;
        const monthTrades = trades.filter((trade) => trade.rawDate?.startsWith(`${monthPrefix}-`));
        return {
            pnl: monthTrades.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0),
            totalTrades: monthTrades.length,
        };
    }, [trades, currentYear, currentMonthIndex]);

    const weeklySummary = React.useMemo(() => {
        const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1);
        const firstWeekStart = new Date(firstDayOfMonth);
        firstWeekStart.setDate(firstDayOfMonth.getDate() - ((firstDayOfMonth.getDay() + 6) % 7));
        const toRawDate = (date) =>
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const formatRangeDate = (date) => `${monthNames[date.getMonth()].slice(0, 3)} ${date.getDate()}`;

        return Array.from({ length: 6 }, (_, index) => {
            const start = new Date(firstWeekStart);
            start.setDate(firstWeekStart.getDate() + index * 7);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            const startRawDate = toRawDate(start);
            const endRawDate = toRawDate(end);
            const pnl = trades
                .filter((trade) => trade.rawDate >= startRawDate && trade.rawDate <= endRawDate)
                .reduce((sum, trade) => sum + Number(trade.pnl || 0), 0);

            return {
                week: `Week ${index + 1}`,
                range: `${formatRangeDate(start)} - ${formatRangeDate(end)}`,
                pnl,
                isProfit: pnl > 0,
            };
        });
    }, [trades, currentYear, currentMonthIndex]);

    const filteredTrades = pageTrades;
    const visiblePages = Array.from(
        { length: Math.max(0, Math.min(pagination.lastPage, currentPage + 2) - Math.max(1, currentPage - 2) + 1) },
        (_, index) => Math.max(1, currentPage - 2) + index
    );




    // Handler Navigasi Bulan
    const handlePrevMonth = () => {
        setCurrentDate((prev) => {
            const prevDate = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
            if (prevDate.getFullYear() < 2026) return prev;
            return prevDate;
        });
    };

    const handleNextMonth = () => {
        setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const handleMonthChange = (e) => {
        const newMonth = parseInt(e.target.value, 10);
        setCurrentDate(new Date(currentYear, newMonth, 1));
    };

    const handleYearChange = (e) => {
        const newYear = parseInt(e.target.value, 10);
        setCurrentDate(new Date(newYear, currentMonthIndex, 1));
    };

    // Daftar nama bulan
    // const monthNames = [
    //     "January", "February", "March", "April", "May", "June",
    //     "July", "August", "September", "October", "November", "December"
    // ];

    // handler klik tanggal pada grid kalender
    const handleDayClick = (item) => {

        const monthName = monthNames[item.month];

        const formattedDateString = `${item.day} ${monthName} ${item.year}`;
        const rawDateString = `${item.year}-${String(item.month + 1).padStart(2, "0")}-${String(item.day).padStart(2, "0")}`

        const dayTrades = trades.filter((trade) => trade.rawDate === rawDateString);

        setSelectedDateInfo({
            fullDateString: formattedDateString,
            rawDate: rawDateString,
            pnlDisplay: item.pnl || "$0.00",
            pnlAmount: typeof item.pnl === "number" ? item.pnl : (item.pnl ? parseFloat(item.pnl.replace(/[^0-9.-]+/g, "")) : 0),
            tradesCount: dayTrades.length,
            trades: dayTrades,
        });

        setIsDayDetailOpen(true);
    };

    const calendarDays = getCalenderDays(currentYear, currentMonthIndex, trades);


    // 1. Handler Buka Modal Konfirmasi Hapus
    const handleOpenDeleteModal = (trade) => {
        setTradeToDelete(trade);
        setIsDeleteModalOpen(true);
    };

    return (
        <div className="space-y-8">

            {/* 1. PAGE HEADER */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Dashboard
                </h1>
                <p className="text-sm text-slate-500">Your performance at a glance.</p>
            </div>

            {/* 2. TOP 4 STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Total Net PnL */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">Total Net PnL</p>
                    <h3 className={`text-2xl font-bold mt-1 ${stats.netPnL > 0 ? "text-[#047857]" : stats.netPnL < 0 ? "text-rose-600" : "text-slate-900"}`}>
                        {stats.netPnL >= 0 ? "+" : "-"}${Math.abs(stats.netPnL).toFixed(2)}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">All time</p>
                </div>

                {/* Card 2: Total Trades */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">Total Trades</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalTrades}</h3>
                    <p className="text-[11px] text-slate-400 mt-1">Logged entries</p>
                </div>

                {/* Card 3: Win Rate */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-400">Win Rate</p>
                        <h3 className={`text-2xl font-bold mt-1 text-slate-900`}>
                            {stats.winRate.toFixed(1)}%
                        </h3>
                    </div>
                    <div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                            <div className="bg-slate-700 h-1 rounded-full" style={{ width: `${stats.winRate}%` }}></div>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{stats.winningCount} of {stats.totalTrades} profitable</p>
                    </div>
                </div>

                {/* Card 4: Follow Plan */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-400">Follow Plan</p>
                        <h3 className={`text-2xl font-bold mt-1 text-slate-900`}>
                            {stats.followPlanRate.toFixed(1)}%
                        </h3>
                    </div>
                    <div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                            <div className="bg-slate-700 h-1 rounded-full text-slate-800" style={{ width: `${stats.followPlanRate}%` }}></div>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{stats.followPlanCount} of {stats.totalTrades} on plan</p>
                    </div>
                </div>
            </div>

            {/* 3. MIDDLE SECTION: PnL CALENDAR & WEEKLY SUMMARY */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* KALENDER PnL (KOLOM KIRI) */}
                <div className="lg:col-span-9 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                    {/* Header Kalender & Navigasi Fleksibel */}
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">PnL Calendar</h2>
                            <p className="text-xs text-slate-400">Click a day to see its trades</p>
                        </div>

                        {/* Control Navigasi Bulan & Tahun */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                disabled={currentYear === 2026 && currentMonthIndex === 0} // Disabled jika sudah di Jan 2026
                                className="p-1.5 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent border border-slate-200 rounded-lg text-slate-600 transition-colors"
                                title="Previous Month"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            {/* Dropdown Select Bulan & Tahun Langsung */}
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                                <select
                                    value={currentMonthIndex}
                                    onChange={handleMonthChange}
                                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                                >
                                    {monthNames.map((name, idx) => (
                                        <option key={name} value={idx}>
                                            {name}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={currentYear}
                                    onChange={handleYearChange}
                                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                                >
                                    {[2026, 2027, 2028, 2029, 2030].map((yr) => (
                                        <option key={yr} value={yr}>
                                            {yr}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="button"
                                onClick={handleNextMonth}
                                className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-colors"
                                title="Next Month"
                            >
                                <ChevronRight size={16} />
                            </button>

                            <button
                                type="button"
                                onClick={handleToday}
                                className="ml-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                Today
                            </button>
                        </div>
                    </div>

                    {/* Header Nama Hari */}
                    <div className="grid grid-cols-7 text-center mb-2 select-none">
                        {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
                            <span key={day} className="text-[11px] font-semibold text-slate-400 tracking-wider">
                                {day}
                            </span>
                        ))}
                    </div>

                    {/* Grid Tanggal Kalender Dinamis */}
                    <div className="grid grid-cols-7 gap-1.5 select-none">
                        {calendarDays.map((item, idx) => {

                            const today = new Date();
                            const isRealToday =
                                item.isCurrentMonth &&
                                item.day === today.getDate() &&
                                item.month === today.getMonth() &&
                                item.year === today.getFullYear();

                            const isProfit = (item.pnlAmount !== undefined ? item.pnlAmount : Number(item.pnl || 0)) >= 0;

                            return (
                                <button
                                    type="button"
                                    key={idx}
                                    onClick={() => handleDayClick(item)}
                                    className={`aspect-square sm:aspect-auto sm:min-h-[72px] p-1 md:p-3 rounded-lg border flex flex-col justify-between text-left transition-all cursor-pointer select-none outline-none hover:border-slate-300 ${item.hasTrades
                                        ? isProfit
                                            ? "bg-emerald-100 border-emerald-300/70 text-slate-700"  // Profit (+)
                                            : "bg-rose-100 border-rose-300/70 text-slate-700"         // Loss (-)
                                        : item.isCurrentMonth
                                            ? "bg-white border-slate-300/70 text-slate-700"             // Bulan Berjalan Tanpa Trade
                                            : "bg-slate-50/50 border-transparent text-slate-300"     // Outside Month
                                        }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span
                                            className={`text-xs font-semibold ${isRealToday
                                                ? "w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px]"
                                                : item.isCurrentMonth
                                                    ? "text-slate-700"
                                                    : "text-slate-300"
                                                }`}
                                        >
                                            {item.day}
                                        </span>
                                    </div>

                                    {/* Indikator Profit di Kalender */}
                                    {item.hasTrades && (
                                        <div className="mt-auto w-full min-w-0 overflow-hidden">
                                            <p
                                                className={`text-xs sm:text-sm font-bold leading-tight truncate w-full ${isProfit ? "text-[#047857]" : "text-rose-600"
                                                    }`}
                                                title={typeof item.pnl === "function" ? item.pnl() : String(item.pnl || "")}
                                            >
                                                {typeof item.pnl === "function" ? item.pnl : item.pnl}
                                            </p>
                                            <p className="hidden sm:block text-[10px] text-slate-500 font-medium truncate w-full">
                                                {item.tradesCount}
                                            </p>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* WEEKLY SUMMARY (KOLOM KANAN - 4 SPAN) */}
                <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-400">Monthly PnL - {monthNames[currentMonthIndex]} {currentYear}</p>
                        <h3 className={`text-2xl font-bold mt-1 ${monthlyStats.pnl > 0 ? "text-[#047857]" : monthlyStats.pnl < 0 ? "text-rose-600" : "text-slate-900"}`}>
                            {monthlyStats.pnl >= 0 ? "+" : "-"}${Math.abs(monthlyStats.pnl).toFixed(2)}
                        </h3>
                        <p className="text-xs text-slate-400 mb-6 mt-0.5">{monthlyStats.totalTrades} trades this month</p>

                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                            Weekly summary
                        </h4>

                        {/* List Mingguan */}
                        <div className="space-y-4">
                            {weeklySummary.map((wk, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs">
                                    <div>
                                        <p className="font-semibold text-slate-800">{wk.week}</p>
                                        <p className="text-[11px] text-slate-400">{wk.range}</p>
                                    </div>
                                    <span
                                        className={`font-bold text-sm ${wk.pnl > 0 ? "text-[#047857]" : wk.pnl < 0 ? "text-rose-600" : "text-slate-400"}`}
                                    >
                                        {wk.pnl >= 0 ? "+" : "-"}${Math.abs(wk.pnl).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. TRADING JOURNAL TABLE SECTION */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                {/* Table Title & Count */}
                <div className="flex flex-row gap-3 justify-between items-center">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Trading Journal</h2>
                        <p className="text-xs text-slate-400">
                            Showing {pagination.from}–{pagination.to} of {pagination.total} trades
                        </p>
                    </div>

                    <button
                        onClick={handleOpenAddTrade}
                        className="flex items-center gap-2 bg-[#071B2B] hover:bg-[#202734] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
                    >
                        <Plus size={16} />
                        <span>Add Trade</span>
                    </button>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Input Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            placeholder="Search pair or notes..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                        />
                    </div>

                    {/* Date Range Inputs */}
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none"
                        />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none"
                        />
                    </div>

                    {/* Select Pair Filter */}
                    <select
                        value={selectedPair}
                        onChange={(e) => {
                            setSelectedPair(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none"
                    >
                        <option value="">All pairs</option>
                        <option value="XAUUSD">XAUUSD</option>
                        <option value="EURUSD">EURUSD</option>
                        <option value="GBPUSD">GBPUSD</option>
                    </select>

                    {/* Select Result Filter */}
                    <select
                        value={selectedResult}
                        onChange={(e) => {
                            setSelectedResult(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none"
                    >
                        <option value="">All results</option>
                        <option value="Profit">Profit</option>
                        <option value="Loss">Loss</option>
                        <option value="Breakeven">Breakeven</option>
                    </select>
                </div>

                {/* Tabel Visual */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4">Pair / Asset</th>
                                <th className="py-3 px-4">Direction</th>
                                <th className="py-3 px-4">Entry</th>
                                <th className="py-3 px-4">Exit</th>
                                <th className="py-3 px-4">PnL</th>
                                <th className="py-3 px-4">Follow Plan</th>
                                <th className="py-3 px-4">Notes</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {isTableBusy ? (
                                <tr>
                                    <td colSpan="9" className="py-8 text-center text-slate-400">Loading trades...</td>
                                </tr>
                            ) : filteredTrades.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="py-8 text-center text-slate-400">No trades match these filters.</td>
                                </tr>
                            ) : filteredTrades.map((trade) => (
                                <tr key={trade.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="py-3.5 px-4 text-slate-500 font-medium whitespace-nowrap">
                                        {trade.date}
                                    </td>
                                    <td className="py-3.5 px-4 font-bold text-slate-800">
                                        {trade.pair}
                                    </td>
                                    <td className="py-3.5 px-4">
                                        <span
                                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${trade.direction === "BUY"
                                                ? "border-slate-300 text-slate-700 bg-slate-50"
                                                : "border-rose-300 text-rose-600 bg-rose-50/40"
                                                }`}
                                        >
                                            {trade.direction}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-slate-600">{trade.entry}</td>
                                    <td className="py-3.5 px-4 text-slate-600">{trade.exit}</td>
                                    <td
                                        className={`py-3.5 px-4 font-bold whitespace-nowrap ${trade.pnl >= 0 ? "text-[#047857]" : "text-rose-600"
                                            }`}
                                    >
                                        {trade.pnl >= 0
                                            ? `+$${trade.pnl.toFixed(2)}`
                                            : `-$${Math.abs(trade.pnl).toFixed(2)}`}
                                    </td>
                                    <td className="py-3.5 px-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${trade.followPlan
                                            ? "bg-emerald-50 text-[#047857] border border-emerald-200/60"
                                            : "bg-rose-50 text-rose-600 border border-rose-200/60"
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${trade.followPlan ? "bg-[#047857]" : "bg-rose-600"}`}></span>
                                            {trade.followPlan ? "Yes" : "No"}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                                        {trade.notes}
                                    </td>
                                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                        <div className="inline-flex items-center gap-2 text-slate-400">
                                            <button onClick={() => handleViewTrade(trade)} className="hover:text-slate-700 transition-colors p-1">
                                                <Eye size={15} />
                                            </button>
                                            <button onClick={() => handleOpenEditTrade(trade)} className="hover:text-slate-700 transition-colors p-1">
                                                <Edit2 size={15} />
                                            </button>
                                            <button onClick={() => handleOpenDeleteModal(trade)} className="hover:text-rose-600 transition-colors p-1">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <p className="text-xs text-slate-400">
                        {pagination.total === 0
                            ? "Showing 0 trades"
                            : `Showing ${pagination.from}–${pagination.to} of ${pagination.total}`}
                    </p>
                    <nav className="flex items-center gap-1" aria-label="Trade table pagination">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                            disabled={currentPage === 1 || isTableBusy}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                        >
                            Previous
                        </button>
                        {visiblePages.map((page) => (
                            <button
                                key={page}
                                type="button"
                                onClick={() => setCurrentPage(page)}
                                disabled={isTableBusy}
                                aria-current={page === currentPage ? "page" : undefined}
                                className={`min-w-8 px-2.5 py-1.5 border rounded-lg text-xs ${page === currentPage
                                    ? "border-[#071B2B] bg-[#071B2B] text-white"
                                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setCurrentPage((page) => Math.min(pagination.lastPage, page + 1))}
                            disabled={currentPage >= pagination.lastPage || isTableBusy}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                        >
                            Next
                        </button>
                    </nav>
                </div>
            </div>

            {/* render modal kalender*/}
            <DayDetailModal
                isOpen={isDayDetailOpen}
                onClose={() => setIsDayDetailOpen(false)}
                dateInfo={selectedDateInfo}
                onOpenAddTrade={handleOpenAddTrade}
                onViewTrade={handleViewTrade}
                onEditTrade={handleOpenEditTrade}
                onDeleteTrade={handleOpenDeleteModal}
            />

            {/* add trade modal */}
            <AddTradeModal
                isOpen={isAddTradeOpen}
                onClose={() => {
                    setIsAddTradeOpen(false)
                    setTradeToEdit(null);
                }}
                initialDate={addTradeInitialDate}
                tradeToEdit={tradeToEdit}
                onSave={refreshTrades}
            />

            {/* Render Modal View Trade */}
            <ViewTradeModal
                isOpen={isViewTradeOpen}
                onClose={() => setIsViewTradeOpen(false)}
                trade={selectedTrade}
                onEditTrade={handleOpenEditTrade}
                onDeleteTrade={handleOpenDeleteModal}
            />

            {/* Render Modal Hapus */}
            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setTradeToDelete(null);
                }}
                trade={tradeToDelete}
                onConfirmDelete={handleConfirmDelete}
            />

        </div>
    );
}