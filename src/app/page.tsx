"use client";

import { useState, useEffect } from "react";
import { DashboardService, DashboardMetrics } from "@/lib/services/DashboardService";
import CurrencyAmount from "@/components/CurrencyAmount";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    const data = await DashboardService.getMetrics();
    setMetrics(data);
    setLoading(false);
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  const profitMargin = metrics.totalRevenue > 0
    ? ((metrics.netProfit / metrics.totalRevenue) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome to ProductionFlow ERP</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <DollarSign size={24} />
            </div>
            <ArrowUpRight className="text-white/60" size={20} />
          </div>
          <div className="text-3xl font-bold mb-1"><CurrencyAmount value={metrics.totalRevenue} /></div>
          <div className="text-green-100 text-sm">Total Revenue</div>
        </div>

        {/* Expenses Card */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <ArrowDownRight size={24} />
            </div>
            <TrendingDown className="text-white/60" size={20} />
          </div>
          <div className="text-3xl font-bold mb-1"><CurrencyAmount value={metrics.totalExpenses} /></div>
          <div className="text-red-100 text-sm">Total Expenses</div>
        </div>

        {/* Profit Card */}
        <div className={`bg-gradient-to-br ${metrics.netProfit >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'
          } rounded-xl shadow-lg p-6 text-white`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <TrendingUp size={24} />
            </div>
            <div className="text-white/80 text-sm">{profitMargin}%</div>
          </div>
          <div className="text-3xl font-bold mb-1"><CurrencyAmount value={metrics.netProfit} /></div>
          <div className="text-blue-100 text-sm">Net Profit</div>
        </div>

        {/* Inventory Card */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Package size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1"><CurrencyAmount value={metrics.inventoryValue} /></div>
          <div className="text-purple-100 text-sm">Inventory Value</div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
              <Users size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{metrics.totalCustomers}</div>
              <div className="text-sm text-slate-500">Total Customers</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600">
              <FileText size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{metrics.totalInvoices}</div>
              <div className="text-sm text-slate-500">Total Invoices</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-lg text-amber-600">
              <AlertTriangle size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{metrics.lowStockItems.length}</div>
              <div className="text-sm text-slate-500">Low Stock Alerts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Recent Invoices</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {metrics.recentInvoices.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-500 text-sm">No invoices yet</div>
            ) : (
              metrics.recentInvoices.map((invoice) => (
                <div key={invoice.id} className="px-6 py-4 hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">{invoice.invoiceNo}</div>
                      <div className="text-sm text-slate-500">{invoice.customerName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600"><CurrencyAmount value={invoice.invoiceTotal} /></div>
                      <div className="text-xs text-slate-500">{new Date(invoice.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent GRNs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Recent Purchases (GRN)</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {metrics.recentGRNs.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-500 text-sm">No purchases yet</div>
            ) : (
              metrics.recentGRNs.map((grn) => (
                <div key={grn.id} className="px-6 py-4 hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">{grn.grnNo}</div>
                      <div className="text-sm text-slate-500">{grn.supplierName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-600"><CurrencyAmount value={grn.grnTotal} /></div>
                      <div className="text-xs text-slate-500">{new Date(grn.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {metrics.lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-amber-600" size={24} />
            <h2 className="text-lg font-semibold text-amber-900">Low Stock Alert</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.lowStockItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg p-4 border border-amber-200">
                <div className="font-medium text-slate-900">{item.name}</div>
                <div className="text-sm text-slate-500 mt-1">SKU: {item.sku}</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Stock:</span>
                  <span className="font-semibold text-red-600">{item.currentStock} {item.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
