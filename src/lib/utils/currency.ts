import { useCurrency } from "@/lib/stores/useCurrency";

/**
 * Format amount with current currency symbol
 */
export function useFormatAmount() {
    const { currentCurrency } = useCurrency();

    return (amount: number): string => {
        if (isNaN(amount)) return `${currentCurrency.symbol}0.00`;
        return `${currentCurrency.symbol}${amount.toFixed(2)}`;
    };
}

/**
 * Convert amount from base currency to current currency
 */
export function useConvertAmount() {
    const { currentCurrency } = useCurrency();

    return (baseAmount: number): number => {
        if (isNaN(baseAmount)) return 0;
        return baseAmount * currentCurrency.exchangeRate;
    };
}

/**
 * Format and convert amount in one step
 */
export function useFormatConvertedAmount() {
    const formatAmount = useFormatAmount();
    const convertAmount = useConvertAmount();

    return (baseAmount: number): string => {
        const converted = convertAmount(baseAmount);
        return formatAmount(converted);
    };
}
