import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Coffee,
  Plus,
  Search,
  Check,
  X,
  Upload,
  Loader2,
  Trash2,
  AlertCircle,
  Clock,
  PackageCheck,
  CheckCircle2,
  RefreshCw,
  ShoppingBag,
  DollarSign
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  ApiBeverage,
  ApiBeverageOrder,
  listBeverages,
  createBeverage,
  updateBeverage,
  deleteBeverage,
  uploadBeverageImage,
  listBeverageOrders,
  deliverBeverageOrder,
  confirmBeverageOrder,
  rejectBeverageOrder,
} from "../api/beverages";
import { formatCurrency } from "../lib/currency";

interface BeveragesViewProps {
  currency: string;
}

export default function BeveragesView({ currency }: BeveragesViewProps) {
  const { storeId } = useAuth();
  const [activeTab, setActiveTab] = useState<"menu" | "orders">("menu");

  // Catalog State
  const [beverages, setBeverages] = useState<ApiBeverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Orders State
  const [orders, setOrders] = useState<ApiBeverageOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersFilter, setOrdersFilter] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBeverage, setEditingBeverage] = useState<ApiBeverage | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stockQty: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick Restock State
  const [restockModalBev, setRestockModalBev] = useState<ApiBeverage | null>(null);
  const [addStockAmount, setAddStockAmount] = useState<number>(6);

  const loadBeverages = async () => {
    if (!storeId) return;
    try {
      setLoading(true);
      const data = await listBeverages(storeId);
      setBeverages(data);
    } catch (err: any) {
      console.error("Failed to load beverages:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    if (!storeId) return;
    try {
      setLoadingOrders(true);
      const data = await listBeverageOrders(storeId, ordersFilter === "all" ? undefined : ordersFilter);
      setOrders(data);
    } catch (err: any) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadBeverages();
  }, [storeId]);

  useEffect(() => {
    if (activeTab === "orders") {
      loadOrders();
      const interval = setInterval(loadOrders, 8000);
      return () => clearInterval(interval);
    }
  }, [storeId, activeTab, ordersFilter]);

  const handleOpenModal = (bev?: ApiBeverage) => {
    setErrorMsg(null);
    setImageFile(null);
    if (bev) {
      setEditingBeverage(bev);
      setFormData({
        name: bev.name,
        description: bev.description || "",
        price: bev.price,
        stockQty: bev.stockQty !== null ? String(bev.stockQty) : "",
      });
      setImagePreview(bev.imageUrl);
    } else {
      setEditingBeverage(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        stockQty: "",
      });
      setImagePreview(null);
    }
    setIsModalOpen(true);
  };

  const handleSaveBeverage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMsg("Price is required and must be greater than zero.");
      return;
    }
    if (!formData.name.trim()) {
      setErrorMsg("Beverage name is required.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      const stockNum = formData.stockQty.trim() !== "" ? parseInt(formData.stockQty) : null;
      let targetId = editingBeverage?.id;

      if (editingBeverage) {
        await updateBeverage(storeId, editingBeverage.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          price: priceNum,
          stockQty: stockNum,
        });
      } else {
        const created = await createBeverage(storeId, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          price: priceNum,
          stockQty: stockNum,
        });
        targetId = created.id;
      }

      if (imageFile && targetId) {
        await uploadBeverageImage(storeId, targetId, imageFile);
      }

      setIsModalOpen(false);
      await loadBeverages();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save beverage.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBeverage = async (id: string, name: string) => {
    if (!storeId) return;
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await deleteBeverage(storeId, id);
      setBeverages(prev => prev.filter(b => b.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete beverage.");
    }
  };

  const handleToggleActive = async (bev: ApiBeverage) => {
    if (!storeId) return;
    try {
      const nextActive = !bev.isActive;
      await updateBeverage(storeId, bev.id, { isActive: nextActive });
      setBeverages(prev => prev.map(b => b.id === bev.id ? { ...b, isActive: nextActive } : b));
    } catch (err: any) {
      alert(err.message || "Failed to update beverage status.");
    }
  };

  const handleRestockSubmit = async () => {
    if (!storeId || !restockModalBev) return;
    try {
      const current = restockModalBev.stockQty || 0;
      const nextStock = current + addStockAmount;
      await updateBeverage(storeId, restockModalBev.id, { stockQty: nextStock });
      setBeverages(prev => prev.map(b => b.id === restockModalBev.id ? { ...b, stockQty: nextStock } : b));
      setRestockModalBev(null);
    } catch (err: any) {
      alert(err.message || "Failed to update stock.");
    }
  };

  const handleDeliver = async (orderId: string) => {
    if (!storeId) return;
    try {
      await deliverBeverageOrder(storeId, orderId);
      await loadOrders();
    } catch (err: any) {
      alert(err.message || "Failed to mark order delivered.");
    }
  };

  const handleConfirmPayment = async (orderId: string, line: "cash" | "upi" | "all") => {
    if (!storeId) return;
    try {
      await confirmBeverageOrder(storeId, orderId, line);
      await loadOrders();
    } catch (err: any) {
      alert(err.message || "Failed to confirm payment.");
    }
  };

  const handleReject = async (orderId: string) => {
    if (!storeId) return;
    const reason = window.prompt("Reason for rejecting this beverage order:");
    if (!reason) return;
    try {
      await rejectBeverageOrder(storeId, orderId, reason);
      await loadOrders();
    } catch (err: any) {
      alert(err.message || "Failed to reject order.");
    }
  };

  const filteredBeverages = beverages.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.description && b.description.toLowerCase().includes(search.toLowerCase()))
  );

  const pendingDeliveryCount = orders.filter(o => o.status === "paid").length;

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-800">Beverages &amp; Cafe</h1>
            {pendingDeliveryCount > 0 && (
              <span className="px-2.5 py-0.5 bg-amber-500 text-white rounded-full text-xs font-bold animate-pulse">
                {pendingDeliveryCount} to deliver
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage refreshments, menu prices, stock inventories, and fulfill orders.
          </p>
        </div>

        {/* Tab Switcher & Action */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("menu")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "menu"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Menu &amp; Catalog
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all relative ${
                activeTab === "orders"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>Live Orders</span>
              {pendingDeliveryCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[10px]">
                  {pendingDeliveryCount}
                </span>
              )}
            </button>
          </div>

          {activeTab === "menu" && (
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm shadow-indigo-100 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Beverage</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: MENU & CATALOG */}
      {activeTab === "menu" && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search beverages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={loadBeverages}
              className="p-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs flex items-center gap-1.5"
              title="Refresh catalog"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading beverage menu...</p>
            </div>
          ) : filteredBeverages.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
              <Coffee className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700 text-sm">No beverages found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {search ? "No drinks match your search." : "Get started by adding refreshments to your cafe menu."}
              </p>
              {!search && (
                <button
                  onClick={() => handleOpenModal()}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Beverage</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredBeverages.map((bev) => {
                const isOutOfStock = bev.stockQty !== null && bev.stockQty <= 0;
                const isLowStock = bev.stockQty !== null && bev.stockQty > 0 && bev.stockQty <= 5;

                return (
                  <div
                    key={bev.id}
                    className={`bg-white rounded-2xl border overflow-hidden shadow-sm flex flex-col transition-all ${
                      bev.isActive ? "border-slate-100 hover:border-slate-300" : "border-slate-200 opacity-60 bg-slate-50/50"
                    }`}
                  >
                    {/* Beverage Image or Placeholder */}
                    <div className="relative h-36 bg-slate-100 flex items-center justify-center overflow-hidden">
                      {bev.imageUrl ? (
                        <img
                          src={bev.imageUrl}
                          alt={bev.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-lg uppercase">
                          {bev.name.charAt(0)}
                        </div>
                      )}

                      {/* Stock Badge */}
                      <div className="absolute top-2.5 right-2.5">
                        {bev.stockQty === null ? (
                          <span className="px-2 py-0.5 bg-slate-900/70 backdrop-blur-md text-white rounded-full text-[10px] font-medium">
                            Unlimited
                          </span>
                        ) : isOutOfStock ? (
                          <span className="px-2 py-0.5 bg-red-600 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
                            Out of stock
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                            {bev.stockQty} left
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-600/90 backdrop-blur-md text-white rounded-full text-[10px] font-medium">
                            {bev.stockQty} in stock
                          </span>
                        )}
                      </div>

                      {/* Active / Inactive Status pill */}
                      {!bev.isActive && (
                        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full text-[10px] font-bold">
                          Hidden
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-slate-800 text-sm leading-snug">{bev.name}</h3>
                          <span className="font-extrabold text-indigo-600 text-sm whitespace-nowrap">
                            {formatCurrency(parseFloat(bev.price), currency)}
                          </span>
                        </div>
                        {bev.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {bev.description}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleActive(bev)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-semibold border ${
                              bev.isActive
                                ? "border-slate-200 text-slate-600 hover:bg-slate-50"
                                : "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                            }`}
                          >
                            {bev.isActive ? "Hide" : "Show"}
                          </button>
                          <button
                            onClick={() => setRestockModalBev(bev)}
                            className="px-2 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-lg text-[10px] font-semibold"
                            title="Quick add stock"
                          >
                            + Stock
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenModal(bev)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            title="Edit beverage"
                          >
                            <span className="text-xs font-semibold">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteBeverage(bev.id, bev.name)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE ORDERS & FULFILLMENT */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {["all", "paid", "pending_payment", "delivered", "rejected"].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrdersFilter(st)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize border ${
                    ordersFilter === st
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
            <button
              onClick={loadOrders}
              className="p-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {loadingOrders ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading beverage orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700 text-sm">No orders found</h3>
              <p className="text-xs text-slate-400 mt-1">Orders placed by players from kiosk will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => {
                const isPaidWaitingDelivery = ord.status === "paid";
                const isPendingPayment = ord.status === "pending_payment";

                return (
                  <div
                    key={ord.id}
                    className={`bg-white rounded-2xl border p-5 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isPaidWaitingDelivery
                        ? "border-amber-300 ring-2 ring-amber-400/20"
                        : "border-slate-100"
                    }`}
                  >
                    {/* Left: Station & Player Info */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-mono font-bold">
                          {ord.system ? ord.system.name : "Station #?"}
                        </span>
                        <span className="font-bold text-slate-800 text-sm">
                          {ord.user?.name || "Player"}
                        </span>
                        {ord.user?.username && (
                          <span className="text-xs text-slate-400">@{ord.user.username}</span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            ord.status === "paid"
                              ? "bg-amber-100 text-amber-800"
                              : ord.status === "delivered"
                              ? "bg-emerald-100 text-emerald-800"
                              : ord.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-indigo-100 text-indigo-800"
                          }`}
                        >
                          {ord.status.replace("_", " ")}
                        </span>
                      </div>

                      {/* Items Ordered snapshot */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600 font-medium">
                        {ord.items && ord.items.map((it, idx) => (
                          <span key={idx} className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                            {it.quantity}x {it.name} ({formatCurrency(parseFloat(it.unitPrice), currency)})
                          </span>
                        ))}
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>Payment: <strong className="uppercase text-slate-600">{ord.paymentMethod}</strong></span>
                        {ord.paymentMethod === "split" && (
                          <span>(Cash: Rs {ord.cashAmount} / UPI: Rs {ord.upiAmount})</span>
                        )}
                      </div>
                    </div>

                    {/* Right: Total & Fulfillment Buttons */}
                    <div className="flex items-center gap-4 self-end md:self-center">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                        <span className="font-extrabold text-lg text-slate-900">
                          {formatCurrency(parseFloat(ord.totalAmount), currency)}
                        </span>
                      </div>

                      {isPendingPayment && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleConfirmPayment(ord.id, "all")}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
                          >
                            Confirm Paid
                          </button>
                          <button
                            onClick={() => handleReject(ord.id)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl text-xs font-semibold"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {isPaidWaitingDelivery && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDeliver(ord.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-200"
                          >
                            <PackageCheck className="w-4 h-4" />
                            <span>Mark Delivered</span>
                          </button>
                          <button
                            onClick={() => handleReject(ord.id)}
                            className="px-2.5 py-2 text-slate-400 hover:text-red-600 rounded-xl text-xs"
                            title="Reject order"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {ord.status === "delivered" && (
                        <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold px-3 py-1.5 bg-emerald-50 rounded-xl">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Delivered</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT BEVERAGE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {editingBeverage ? "Edit Beverage" : "Add New Beverage"}
                  </h3>
                  <p className="text-xs text-slate-500">Set drink details, price, and stock</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBeverage} className="p-5 overflow-y-auto space-y-4 flex-1">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Photo Upload & Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Beverage Photo</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Coffee className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      id="bev-photo-input"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImageFile(file);
                          setImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                    <label
                      htmlFor="bev-photo-input"
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center space-x-1.5 cursor-pointer shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{imagePreview ? "Change Photo" : "Upload Photo"}</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-1">PNG, JPEG or WebP up to 5 MB</p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Red Bull (250ml), Monster Energy"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Price & Stock in grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Price ({currency}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    placeholder="e.g. 120"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stock Quantity <span className="text-slate-400 font-normal">(blank = unlimited)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 24"
                    value={formData.stockQty}
                    onChange={(e) => setFormData(prev => ({ ...prev, stockQty: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Chilled energy drink..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-2 -mx-5 -mb-5 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingBeverage ? "Update Beverage" : "Create Beverage"}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: QUICK RESTOCK */}
      {restockModalBev && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-sm p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Add Stock: {restockModalBev.name}</h3>
              <button onClick={() => setRestockModalBev(null)} className="text-slate-400 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Current stock: <strong>{restockModalBev.stockQty !== null ? restockModalBev.stockQty : "Unlimited"}</strong>
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[+6, +12, +24].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAddStockAmount(amt)}
                  className={`py-2 rounded-xl text-xs font-bold border ${
                    addStockAmount === amt
                      ? "bg-indigo-50 border-indigo-600 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  +{amt}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Custom Add Amount</label>
              <input
                type="number"
                min="1"
                value={addStockAmount}
                onChange={(e) => setAddStockAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRestockModalBev(null)}
                className="px-3 py-1.5 text-xs text-slate-600 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRestockSubmit}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
              >
                Add +{addStockAmount} to Stock
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
