"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import CurrencySelector from "./CurrencySelector";
import {
    LayoutDashboard,
    Calculator,
    Package,
    ShoppingCart,
    Settings,
    Users,
    FileText,
    PieChart,
    Shield,
    Sparkles,
    Activity,
    Building2,
    Percent,
    BookOpen,
    Truck,
    UserCircle,
    ClipboardList,
    ArrowUpDown,
    TrendingUp,
    Lightbulb,
    Boxes,
    Factory,
    ShoppingBag,
    FileCheck,
    Receipt,
    CreditCard,
    Undo2,
    FileQuestion,
    PackageCheck,
    DollarSign,
    Wallet,
    BookMarked,
    ChevronDown,
    ChevronRight
} from "lucide-react";

export default function Sidebar() {
    const pathname = usePathname();
    const [expandedSections, setExpandedSections] = useState<string[]>([
        "General", "Administration", "Sales", "Finance", "Reports", "Inventory"
    ]);

    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    };

    const isExpanded = (section: string) => expandedSections.includes(section);

    const navigationSections = [
        {
            title: "General",
            items: [
                { name: "Dashboard", href: "/", icon: LayoutDashboard },
                { name: "AI Assistant", href: "/ai-assistant", icon: Sparkles },
                { name: "Dev Status", href: "/dev-status", icon: Activity },
            ]
        },
        {
            title: "Administration",
            items: [
                { name: "Company Profile", href: "/settings/company", icon: Building2 },
                { name: "User Roles", href: "/settings/users", icon: Shield },
                { name: "TAX/VAT Settings", href: "/settings/tax", icon: Percent },
                { name: "Currencies", href: "/settings/currencies", icon: DollarSign },
            ]
        },
        {
            title: "Inventory",
            items: [
                { name: "Item Master", href: "/inventory/items", icon: Package },
                { name: "Inventory Status", href: "/inventory/status", icon: ClipboardList },
                { name: "Stock Adjustments", href: "/inventory/adjustments", icon: ArrowUpDown },
                { name: "Stock Movement", href: "/inventory/movement", icon: TrendingUp },
                { name: "AI Recommendations", href: "/inventory/ai-recommendations", icon: Lightbulb },
            ]
        },
        {
            title: "Sales",
            items: [
                { name: "Customer Master", href: "/sales/customers", icon: UserCircle },
                { name: "Bill of Materials", href: "/production/bom", icon: Boxes },
                { name: "Production Orders", href: "/production/orders", icon: Factory },
                { name: "Quotations", href: "/sales/orders", icon: FileText },
                { name: "Sales Invoices", href: "/sales/invoices", icon: FileCheck },
                { name: "Sales Returns", href: "/sales/returns", icon: Undo2 },
            ]
        },
        {
            title: "Procurement",
            items: [
                { name: "Suppliers", href: "/procurement/suppliers", icon: Truck },
                { name: "Purchase Orders", href: "/procurement/orders", icon: ShoppingBag },
                { name: "Goods Receipt Note", href: "/procurement/grn", icon: PackageCheck },
                { name: "Supplier Invoices", href: "/procurement/invoices", icon: Receipt },
                { name: "Purchase Returns", href: "/procurement/returns", icon: Undo2 },
            ]
        },
        {
            title: "Finance",
            items: [
                { name: "Chart of Accounts", href: "/finance/coa", icon: BookOpen },
                { name: "Journal Entries", href: "/finance/journals", icon: BookMarked },
                { name: "Cash Book", href: "/finance/cash-book", icon: Wallet },
                { name: "Accounts Receivable", href: "/finance/accounts-receivable", icon: CreditCard },
                { name: "Accounts Payable", href: "/finance/accounts-payable", icon: FileQuestion },
            ]
        },
        {
            title: "Reports",
            items: [
                { name: "Financial Reports", href: "/finance/reports", icon: PieChart },
            ]
        }
    ];

    return (
        <div className="flex h-screen w-64 flex-col bg-slate-900 text-white">
            <div className="border-b border-slate-800 p-4">
                <h1 className="text-xl font-bold text-blue-400">ProductionFlow</h1>
                <p className="text-xs text-slate-400">Enterprise ERP</p>
                <div className="mt-3">
                    <CurrencySelector />
                </div>
            </div>
            <nav className="flex-1 overflow-y-auto py-4">
                {navigationSections.map((section) => (
                    <div key={section.title} className="mb-2">
                        <button
                            onClick={() => toggleSection(section.title)}
                            className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-300"
                        >
                            <span>{section.title}</span>
                            {isExpanded(section.title) ? (
                                <ChevronDown size={16} />
                            ) : (
                                <ChevronRight size={16} />
                            )}
                        </button>
                        {isExpanded(section.title) && (
                            <ul className="space-y-1 px-2 mt-1">
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <li key={item.name}>
                                            <Link
                                                href={item.href}
                                                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
                                                    ? "bg-blue-600 text-white"
                                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                                    }`}
                                            >
                                                <item.icon className="h-4 w-4" />
                                                {item.name}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                ))}
            </nav>
            <div className="border-t border-slate-800 p-4">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                        US
                    </div>
                    <div>
                        <p className="text-sm font-medium">User</p>
                        <p className="text-xs text-slate-500">Admin</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
