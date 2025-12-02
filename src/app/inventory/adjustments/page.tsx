"use client";

import { useState, useEffect } from "react";
import { StockLedgerService, StockLedgerEntry } from "@/lib/services/StockLedgerService";
import { ItemService, Item } from "@/lib/services/ItemService";
import { LocationService, Location } from "@/lib/services/LocationService";
import { Plus, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

export default function StockAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<StockLedgerEntry[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Form state
  const [adjustmentType, setAdjustmentType] = useState<"IN" | "OUT">("IN");
  const [itemId, setItemId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [adjustmentDate, setAdjustmentDate] = useState(new Date().toISOString().split('T')[0]);

  const reasonOptions = [
    "Damage",
    "Loss",
    "Theft",
    "Found",
    "Correction",
    "Expired",
    "Quality Issue",
    "Other"
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [adjustmentsData, itemsData, locationsData] = await Promise.all([
      StockLedgerService.getEntries({
        sourceType: "ADJUSTMENT_IN"
      }),
      ItemService.getItems(),
      LocationService.getLocations(),
    ]);

    // Get both IN and OUT adjustments
    const adjustmentsOut = await StockLedgerService.getEntries({
      sourceType: "ADJUSTMENT_OUT"
    });

    const allAdjustments = [...adjustmentsData, ...adjustmentsOut].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setAdjustments(allAdjustments);
    setItems(itemsData);
    setLocations(locationsData);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const item = items.find(i => i.id === itemId);
      const location = locations.find(l => l.id === locationId);

      if (!item || !location) {
        throw new Error("Invalid item or location");
      }

      const adjustmentEntry = {
        itemId,
        itemName: item.name,
        locationId,
        locationName: location.name,
        txnDate: adjustmentDate,
        sourceType: adjustmentType === "IN" ? "ADJUSTMENT_IN" as const : "ADJUSTMENT_OUT" as const,
        sourceId: `ADJ-${Date.now()}`,
        sourceNo: `ADJ-${Date.now()}`,
        qtyIn: adjustmentType === "IN" ? quantity : 0,
        qtyOut: adjustmentType === "OUT" ? quantity : 0,
        unitCost: item.costPrice,
        totalCost: quantity * item.costPrice,
        remarks: `${reason}: ${remarks}`,
      };

      await StockLedgerService.createEntry(adjustmentEntry);

      setNotification({ type: 'success', message: 'Stock adjustment created successfully' });
      setTimeout(() => setNotification(null), 3000);
      resetForm();
      loadData();
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const resetForm = () => {
    setAdjustmentType("IN");
    setItemId("");
    setLocationId("");
    setQuantity(0);
    setReason("");
    setRemarks("");
    setAdjustmentDate(new Date().toISOString().split('T')[0]);
    setShowForm(false);
  };

  // Calculate summary
  const totalIn = adjustments
    .filter(a => a.sourceType === "ADJUSTMENT_IN")
    .reduce((sum, a) => sum + a.qtyIn, 0);

  const totalOut = adjustments
    .filter(a => a.sourceType === "ADJUSTMENT_OUT")
    .reduce((sum, a) => sum + a.qtyOut, 0);

  const totalValueIn = adjustments
    .filter(a => a.sourceType === "ADJUSTMENT_IN")
    .reduce((sum, a) => sum + a.totalCost, 0);

  const totalValueOut = adjustments
    .filter(a => a.sourceType === "ADJUSTMENT_OUT")
    .reduce((sum, a) => sum + a.totalCost, 0);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="text-slate-500">Loading...</div></div>;
  }

  return (
    <>
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          {notification.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Stock Adjustments</h1>
            <p className="text-slate-500 mt-1">Manage inventory adjustments and corrections</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            New Adjustment
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-green-600" size={20} />
              <div className="text-sm text-green-600">Adjustments IN</div>
            </div>
            <div className="text-2xl font-bold text-green-900">{totalIn.toFixed(2)}</div>
            <div className="text-sm text-green-600 mt-1">${totalValueIn.toFixed(2)}</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="text-red-600" size={20} />
              <div className="text-sm text-red-600">Adjustments OUT</div>
            </div>
            <div className="text-2xl font-bold text-red-900">{totalOut.toFixed(2)}</div>
            <div className="text-sm text-red-600 mt-1">${totalValueOut.toFixed(2)}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="text-blue-600" size={20} />
              <div className="text-sm text-blue-600">Net Change</div>
            </div>
            <div className="text-2xl font-bold text-blue-900">{(totalIn - totalOut).toFixed(2)}</div>
            <div className="text-sm text-blue-600 mt-1">${(totalValueIn - totalValueOut).toFixed(2)}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-sm text-slate-600">Total Adjustments</div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{adjustments.length}</div>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Create Stock Adjustment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Adjustment Type *</label>
                  <select
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value as "IN" | "OUT")}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="IN">Increase Stock (IN)</option>
                    <option value="OUT">Decrease Stock (OUT)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={adjustmentDate}
                    onChange={(e) => setAdjustmentDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Item *</label>
                  <select
                    value={itemId}
                    onChange={(e) => setItemId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">Select item...</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location *</label>
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">Select location...</option>
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>{location.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reason *</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">Select reason...</option>
                    {reasonOptions.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Additional details..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Adjustment
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Adjustments List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {adjustments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      No adjustments found. Create your first adjustment to get started.
                    </td>
                  </tr>
                ) : (
                  adjustments.map((adjustment) => (
                    <tr key={adjustment.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-600">{adjustment.txnDate}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${adjustment.sourceType === "ADJUSTMENT_IN"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                          }`}>
                          {adjustment.sourceType === "ADJUSTMENT_IN" ? (
                            <><TrendingUp size={12} /> IN</>
                          ) : (
                            <><TrendingDown size={12} /> OUT</>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">{adjustment.itemName}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{adjustment.locationName}</td>
                      <td className="px-6 py-4 text-sm text-right text-slate-900">
                        {adjustment.sourceType === "ADJUSTMENT_IN" ? adjustment.qtyIn : adjustment.qtyOut}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-slate-900">
                        ${adjustment.totalCost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{adjustment.remarks || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
