"use client";

import { useState, useEffect } from "react";
import { StockLedgerService } from "@/lib/services/StockLedgerService";
import { ItemService, Item } from "@/lib/services/ItemService";
import { LocationService, Location } from "@/lib/services/LocationService";
import { Package, AlertTriangle, CheckCircle } from "lucide-react";

export default function InventoryStatusPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [stockBalances, setStockBalances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [itemsData, locationsData, balances] = await Promise.all([
            ItemService.getItems(),
            LocationService.getLocations(),
            StockLedgerService.getAllStockBalances(),
        ]);
        setItems(itemsData);
        setLocations(locationsData);
        setStockBalances(balances);
        setLoading(false);
    };

    const getStockStatus = (item: Item, balance: number) => {
        if (balance <= 0) return { status: "Out of Stock", color: "text-red-600", icon: AlertTriangle };
        if (balance < (item.minimumStock || 10)) return { status: "Low Stock", color: "text-amber-600", icon: AlertTriangle };
        return { status: "In Stock", color: "text-green-600", icon: CheckCircle };
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full"><div className="text-slate-500">Loading...</div></div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Inventory Status</h1>
                <p className="text-slate-500 mt-1">Current stock levels across all locations</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-900">{items.length}</div>
                    <div className="text-sm text-blue-600">Total Items</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-900">
                        {stockBalances.filter(b => b.balanceQty > 0).length}
                    </div>
                    <div className="text-sm text-green-600">In Stock</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <div className="text-2xl font-bold text-amber-900">
                        {items.filter(item => {
                            const balance = stockBalances.find(b => b.itemId === item.id);
                            return balance && balance.balanceQty > 0 && balance.balanceQty < (item.minimumStock || 10);
                        }).length}
                    </div>
                    <div className="text-sm text-amber-600">Low Stock</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="text-2xl font-bold text-red-900">
                        {items.filter(item => {
                            const balance = stockBalances.find(b => b.itemId === item.id);
                            return !balance || balance.balanceQty <= 0;
                        }).length}
                    </div>
                    <div className="text-sm text-red-600">Out of Stock</div>
                </div>
            </div>

            {/* Stock Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Item</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">SKU</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Location</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Available</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Min Stock</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Value</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {items.map((item) => {
                                const itemBalances = stockBalances.filter(b => b.itemId === item.id);
                                if (itemBalances.length === 0) {
                                    const status = getStockStatus(item, 0);
                                    return (
                                        <tr key={`${item.id}-none`} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 text-sm text-slate-900">{item.name}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{item.sku}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">All Locations</td>
                                            <td className="px-6 py-4 text-sm text-right text-slate-900">0</td>
                                            <td className="px-6 py-4 text-sm text-right text-slate-600">{item.minimumStock || 10}</td>
                                            <td className="px-6 py-4 text-sm text-right text-slate-900">$0.00</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 text-sm ${status.color}`}>
                                                    <status.icon size={16} />
                                                    {status.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                }
                                return itemBalances.map((balance) => {
                                    const location = locations.find(l => l.id === balance.locationId);
                                    const status = getStockStatus(item, balance.balanceQty);
                                    return (
                                        <tr key={`${item.id}-${balance.locationId}`} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 text-sm text-slate-900">{item.name}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{item.sku}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{location?.name || balance.locationId}</td>
                                            <td className="px-6 py-4 text-sm text-right text-slate-900">{balance.balanceQty.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm text-right text-slate-600">{item.minimumStock || 10}</td>
                                            <td className="px-6 py-4 text-sm text-right text-slate-900">
                                                ${(balance.balanceQty * balance.avgCost).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 text-sm ${status.color}`}>
                                                    <status.icon size={16} />
                                                    {status.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                });
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
