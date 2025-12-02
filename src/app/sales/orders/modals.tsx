// Modal Components for Sales Orders

import { useState } from "react";
import { X } from "lucide-react";
import { SalesOrder } from "@/lib/services/SalesOrderService";

interface OrderDetailsModalProps {
    order: SalesOrder;
    onClose: () => void;
}

function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">Order Details</h2>
                        <p className="text-sm text-slate-500 mt-1">{order.orderNo}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Order Information */}
                    <div>
                        <h3 className="font-semibold text-slate-900 mb-3">Order Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-slate-500">Customer:</span>
                                <span className="ml-2 font-medium text-slate-900">{order.customerName}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">Order Date:</span>
                                <span className="ml-2 font-medium text-slate-900">{order.orderDate}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">Delivery Date:</span>
                                <span className="ml-2 font-medium text-slate-900">{order.deliveryDate}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">Payment Term:</span>
                                <span className="ml-2 font-medium text-slate-900">{order.paymentTerm}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">Status:</span>
                                <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${order.status === "CONFIRMED" ? "bg-blue-100 text-blue-700" :
                                    order.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                                        order.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                                            "bg-slate-100 text-slate-700"
                                    }`}>
                                    {order.status}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-500">Payment Status:</span>
                                <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${order.paymentStatus === "PAID" ? "bg-green-100 text-green-700" :
                                    order.paymentStatus === "PARTIAL" ? "bg-yellow-100 text-yellow-700" :
                                        "bg-slate-100 text-slate-700"
                                    }`}>
                                    {order.paymentStatus}
                                </span>
                            </div>
                        </div>
                        {order.remarks && (
                            <div className="mt-3">
                                <span className="text-slate-500 text-sm">Remarks:</span>
                                <p className="mt-1 text-sm text-slate-900">{order.remarks}</p>
                            </div>
                        )}
                    </div>

                    {/* Order Lines */}
                    <div>
                        <h3 className="font-semibold text-slate-900 mb-3">Items</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Item</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Quantity</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Unit Price</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Tax Rate</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Line Total</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Delivered</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {order.lines.map((line, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3 text-slate-900">{line.itemName}</td>
                                            <td className="px-4 py-3 text-slate-600">{line.qty} {line.unit}</td>
                                            <td className="px-4 py-3 text-slate-600">${line.price.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-slate-600">{(line.taxRate * 100).toFixed(0)}%</td>
                                            <td className="px-4 py-3 font-medium text-slate-900">${line.lineTotal.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-slate-600">{line.deliveredQty} {line.unit}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="border-t border-slate-200 pt-4">
                        <div className="flex justify-end">
                            <div className="w-64 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Subtotal:</span>
                                    <span className="font-medium text-slate-900">${order.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Tax:</span>
                                    <span className="font-medium text-slate-900">${order.taxAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-semibold border-t border-slate-200 pt-2">
                                    <span className="text-slate-900">Total:</span>
                                    <span className="text-slate-900">${order.totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

interface PaymentModalProps {
    order: SalesOrder;
    onClose: () => void;
    onConfirm: (amount: number) => void;
}

function PaymentModal({ order, onClose, onConfirm }: PaymentModalProps) {
    const [amount, setAmount] = useState(order.totalAmount);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(amount);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">Record Payment</h2>
                        <p className="text-sm text-slate-500 mt-1">{order.orderNo}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="text-sm text-blue-700">
                            <div className="flex justify-between mb-2">
                                <span>Customer:</span>
                                <span className="font-medium">{order.customerName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Amount:</span>
                                <span className="font-semibold text-lg">${order.totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Payment Amount *
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                            min="0"
                            max={order.totalAmount}
                            step="0.01"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Enter the amount received from the customer
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Record Payment
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface DeliveryModalProps {
    order: SalesOrder;
    onClose: () => void;
    onConfirm: () => void;
}

function DeliveryModal({ order, onClose, onConfirm }: DeliveryModalProps) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">Confirm Delivery</h2>
                        <p className="text-sm text-slate-500 mt-1">{order.orderNo}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                        <h3 className="font-semibold text-amber-900 mb-2">Delivery Confirmation</h3>
                        <p className="text-sm text-amber-700 mb-3">
                            This action will:
                        </p>
                        <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                            <li>Update stock levels for all items</li>
                            <li>Post the invoice to General Ledger</li>
                            <li>Mark the order as DELIVERED</li>
                            <li>This action cannot be undone</li>
                        </ul>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-medium text-slate-900 mb-2">Order Summary</h4>
                        <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-slate-600">Customer:</span>
                                <span className="font-medium text-slate-900">{order.customerName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Total Amount:</span>
                                <span className="font-semibold text-slate-900">${order.totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Payment Status:</span>
                                <span className={`font-medium ${order.paymentStatus === "PAID" ? "text-green-600" : "text-amber-600"}`}>
                                    {order.paymentStatus}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                            Confirm Delivery
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export { OrderDetailsModal, PaymentModal, DeliveryModal };
