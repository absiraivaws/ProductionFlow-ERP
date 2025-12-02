"use client";

import { useState, useEffect } from "react";
import { StockLedgerService, StockLedgerEntry } from "@/lib/services/StockLedgerService";
import { ItemService, Item } from "@/lib/services/ItemService";
import { LocationService, Location } from "@/lib/services/LocationService";
import { Filter, Download, TrendingUp, TrendingDown, Package, Truck, Factory, RefreshCw } from "lucide-react";

export default function StockMovementPage() {
  const [movements, setMovements] = useState<StockLedgerEntry[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [movementsData, itemsData, locationsData] = await Promise.all([
      StockLedgerService.getEntries({}),
      ItemService.getItems(),
      LocationService.getLocations(),
    ]);

    setMovements(movementsData.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));

    // Remove duplicate items by id
    const uniqueItems = itemsData.filter((item, index, self) =>
      index === self.findIndex((t) => t.id === item.id)
    );
    setItems(uniqueItems);
    setLocations(locationsData);
    setLoading(false);
  };

  // Apply filters
  const filteredMovements = movements.filter(movement => {
    if (selectedItem && movement.itemId !== selectedItem) return false;
    if (selectedLocation && movement.locationId !== selectedLocation) return false;
    if (selectedType && movement.sourceType !== selectedType) return false;
    if (startDate && movement.txnDate < startDate) return false;
    if (endDate && movement.txnDate > endDate) return false;
    return true;
  });

  // Calculate running balance for filtered movements
  const movementsWithBalance = filteredMovements.map((movement, index) => {
    const previousMovements = filteredMovements.slice(index + 1);
    const balance = previousMovements.reduce((sum, m) => sum + m.qtyIn - m.qtyOut, 0) + movement.qtyIn - movement.qtyOut;
    return { ...movement, runningBalance: balance };
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "PURCHASE": return <Package size={14} />;
      case "SALES": return <Truck size={14} />;
      case "PRODUCTION_IN": return <Factory size={14} />;
      case "PRODUCTION_OUT": return <Factory size={14} />;
      case "ADJUSTMENT_IN": return <TrendingUp size={14} />;
      case "ADJUSTMENT_OUT": return <TrendingDown size={14} />;
      case "TRANSFER_IN": return <RefreshCw size={14} />;
      case "TRANSFER_OUT": return <RefreshCw size={14} />;
      default: return <Package size={14} />;
    }
  };

  const getTransactionColor = (type: string) => {
    if (type.includes("IN")) return "bg-green-100 text-green-700";
    if (type.includes("OUT")) return "bg-red-100 text-red-700";
    return "bg-blue-100 text-blue-700";
  };

  const handleExport = () => {
    // Simple CSV export
    const headers = ["Date", "Type", "Item", "Location", "Qty In", "Qty Out", "Balance", "Reference", "Remarks"];
    const rows = movementsWithBalance.map(m => [
      m.txnDate,
      m.sourceType,
      m.itemName,
      m.locationName,
      m.qtyIn,
      m.qtyOut,
      m.runningBalance,
      m.sourceNo,
      m.remarks || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-movement-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="text-slate-500">Loading...</div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Stock Movement</h1>
          <p className="text-slate-500 mt-1">View all stock transactions and movements</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Download size={20} />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-green-600" size={20} />
            <div className="text-sm text-green-600">Total IN</div>
          </div>
          <div className="text-2xl font-bold text-green-900">
            {filteredMovements.reduce((sum, m) => sum + m.qtyIn, 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="text-red-600" size={20} />
            <div className="text-sm text-red-600">Total OUT</div>
          </div>
          <div className="text-2xl font-bold text-red-900">
            {filteredMovements.reduce((sum, m) => sum + m.qtyOut, 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Package className="text-blue-600" size={20} />
            <div className="text-sm text-blue-600">Net Movement</div>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {(filteredMovements.reduce((sum, m) => sum + m.qtyIn - m.qtyOut, 0)).toFixed(2)}
          </div>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-sm text-slate-600">Total Transactions</div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{filteredMovements.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-slate-600" />
          <h3 className="font-medium text-slate-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Item</label>
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="">All Items</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>{item.sku} - {item.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="">All Locations</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Transaction Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="">All Types</option>
              <option value="PURCHASE">Purchase</option>
              <option value="SALES">Sales</option>
              <option value="PRODUCTION_IN">Production IN</option>
              <option value="PRODUCTION_OUT">Production OUT</option>
              <option value="ADJUSTMENT_IN">Adjustment IN</option>
              <option value="ADJUSTMENT_OUT">Adjustment OUT</option>
              <option value="TRANSFER_IN">Transfer IN</option>
              <option value="TRANSFER_OUT">Transfer OUT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Movement Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Location</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Qty IN</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Qty OUT</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {movementsWithBalance.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-500">
                    No stock movements found matching the filters.
                  </td>
                </tr>
              ) : (
                movementsWithBalance.map((movement) => (
                  <tr key={movement.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-600">{movement.txnDate}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTransactionColor(movement.sourceType)}`}>
                        {getTransactionIcon(movement.sourceType)}
                        {movement.sourceType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">{movement.itemName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{movement.locationName}</td>
                    <td className="px-6 py-4 text-sm text-right text-green-600 font-medium">
                      {movement.qtyIn > 0 ? movement.qtyIn.toFixed(2) : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-red-600 font-medium">
                      {movement.qtyOut > 0 ? movement.qtyOut.toFixed(2) : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-slate-900 font-semibold">
                      {movement.runningBalance.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{movement.sourceNo}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{movement.remarks || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
