"use client";

import { useState, useEffect } from "react";
import { StockLedgerService, StockBalance } from "@/lib/services/StockLedgerService";
import { ItemService, Item } from "@/lib/services/ItemService";
import { LocationService, Location } from "@/lib/services/LocationService";
import { Package, DollarSign, MapPin, Grid3x3 } from "lucide-react";

interface EnrichedStockBalance extends StockBalance {
    itemSku?: string;
    itemUnit?: string;
}

export default function InventoryReportsPage() {
    const [stockBalances, setStockBalances] = useState<EnrichedStockBalance[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedLocation, setSelectedLocation] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [groupBy, setGroupBy] = useState<"none" | "location">("none");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [balances, itemsData, locationsData] = await Promise.all([
            StockLedgerService.getAllStockBalances(),
            ItemService.getItems(),
            LocationService.getLocations(),
        ]);

        // Enrich balances with item details
        const enrichedBalances: EnrichedStockBalance[] = balances.map(balance => {
            const item = itemsData.find(i => i.id === balance.itemId);
            const location = locationsData.find(l => l.id === balance.locationId);
            return {
                ...balance,
                itemName: item?.name || balance.itemName,
                itemSku: item?.sku,
                itemUnit: item?.unit,
                locationName: location?.name || balance.locationName,
            };
        });

        setStockBalances(enrichedBalances);
        setItems(itemsData);
        setLocations(locationsData);
        setLoading(false);
    };

    // Apply filters
    const filteredBalances = stockBalances.filter(balance => {
        if (selectedLocation && balance.locationId !== selectedLocation) return false;
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            return (
                balance.itemName?.toLowerCase().includes(search) ||
                balance.itemSku?.toLowerCase().includes(search)
            );
        }
        return true;
    });

    // Calculate totals
    const totalItems = filteredBalances.length;
    const totalQty = filteredBalances.reduce((sum, b) => sum + b.balanceQty, 0);
    const totalValue = filteredBalances.reduce((sum, b) => sum + b.stockValue, 0);
    const uniqueLocations = new Set(filteredBalances.map(b => b.locationId)).size;

    // Group balances
    const groupedBalances = () => {
        if (groupBy === "none") {
            return [{ key: "all", label: "All Items", balances: filteredBalances }];
        } else {
            const groups = new Map<string, EnrichedStockBalance[]>();
            filteredBalances.forEach(balance => {
                const location = balance.locationName || "Unknown";
                if (!groups.has(location)) {
                    groups.set(location, []);
                }
                groups.get(location)!.push(balance);
            });
            return Array.from(groups.entries()).map(([location, balances]) => ({
                key: location,
                label: location,
                balances,
            }));
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full"><div className="text-slate-500">Loading reports...</div></div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Inventory Reports</h1>
                <p className="text-slate-500 mt-1">Stock valuation and inventory analysis</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                        <Package className="text-blue-600" size={20} />
                        <div className="text-sm text-blue-600">Total Items</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">{totalItems}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                        <Grid3x3 className="text-green-600" size={20} />
                        <div className="text-sm text-green-600">Total Quantity</div>
                    </div>
                    <div className="text-2xl font-bold text-green-900">{totalQty.toFixed(2)}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="text-purple-600" size={20} />
                        <div className="text-sm text-purple-600">Total Value</div>
                    </div>
                    <div className="text-2xl font-bold text-purple-900">${totalValue.toFixed(2)}</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin className="text-amber-600" size={20} />
                        <div className="text-sm text-amber-600">Locations</div>
                    </div>
                    <div className="text-2xl font-bold text-amber-900">{uniqueLocations}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                        <select
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        >
                            <option value="">All Locations</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search items..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Group By</label>
                        <select
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value as any)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        >
                            <option value="none">No Grouping</option>
                            <option value="location">Location</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Stock Valuation Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900">Stock Valuation Report</h2>
                    <p className="text-sm text-slate-500 mt-1">As of {new Date().toLocaleDateString()}</p>
                </div>

                {groupedBalances().map((group) => (
                    <div key={group.key} className="border-b border-slate-200 last:border-b-0">
                        {groupBy !== "none" && (
                            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                                <h3 className="font-medium text-slate-900">{group.label}</h3>
                                <p className="text-sm text-slate-500">
                                    {group.balances.length} items •
                                    Total Value: ${group.balances.reduce((sum, b) => sum + b.stockValue, 0).toFixed(2)}
                                </p>
                            </div>
                        )}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">SKU</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Item Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Location</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Quantity</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Avg Cost</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {group.balances.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                                No stock found matching the filters
                                            </td>
                                        </tr>
                                    ) : (
                                        group.balances.map((balance) => (
                                            <tr key={`${balance.itemId}-${balance.locationId}`} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 text-sm text-slate-600">{balance.itemSku || "-"}</td>
                                                <td className="px-6 py-4 text-sm text-slate-900">{balance.itemName}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{balance.locationName}</td>
                                                <td className="px-6 py-4 text-sm text-right text-slate-900">
                                                    {balance.balanceQty.toFixed(2)} {balance.itemUnit}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right text-slate-600">
                                                    ${balance.avgCost.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right font-medium text-slate-900">
                                                    ${balance.stockValue.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    {groupBy !== "none" && group.balances.length > 0 && (
                                        <tr className="bg-slate-100 font-semibold">
                                            <td colSpan={5} className="px-6 py-4 text-sm text-slate-900">Subtotal</td>
                                            <td className="px-6 py-4 text-sm text-right text-slate-900">
                                                ${group.balances.reduce((sum, b) => sum + b.stockValue, 0).toFixed(2)}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}

                {/* Grand Total */}
                {filteredBalances.length > 0 && (
                    <div className="bg-slate-100 px-6 py-4 border-t-2 border-slate-300">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-slate-900">GRAND TOTAL</span>
                            <span className="text-2xl font-bold text-slate-900">${totalValue.toFixed(2)}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
