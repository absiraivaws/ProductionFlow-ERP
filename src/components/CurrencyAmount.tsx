"use client";

import { useCurrency } from "@/lib/stores/useCurrency";

interface AmountProps {
    value: number;
    className?: string;
}

/**
 * Display amount with current currency symbol
 * Automatically updates when currency changes
 */
export default function CurrencyAmount({ value, className = "" }: AmountProps) {
    const { currentCurrency } = useCurrency();

    if (isNaN(value)) value = 0;

    return (
        <span className={className}>
            {currentCurrency.symbol}{value.toFixed(2)}
        </span>
    );
}
