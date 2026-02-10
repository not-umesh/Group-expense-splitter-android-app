import { Expense, Member, Settlement, BalanceEntry, TransactionSuggestion } from '../types';

/**
 * Calculate the net balance for each member in a group.
 * Positive = member is owed money, Negative = member owes money
 */
export function calculateBalances(
    members: Member[],
    expenses: Expense[],
    settlements: Settlement[]
): BalanceEntry[] {
    const balanceMap: Record<string, number> = {};

    // Initialize all members with 0
    members.forEach((m) => {
        balanceMap[m.id] = 0;
    });

    // Process expenses
    expenses.forEach((expense) => {
        // The payer paid the full amount, so they are owed
        balanceMap[expense.paidById] = (balanceMap[expense.paidById] || 0) + expense.amount;

        // Each person who owes their split
        expense.splits.forEach((split) => {
            balanceMap[split.memberId] = (balanceMap[split.memberId] || 0) - split.amount;
        });
    });

    // Process settlements (from pays to)
    settlements.forEach((s) => {
        balanceMap[s.fromId] = (balanceMap[s.fromId] || 0) + s.amount;
        balanceMap[s.toId] = (balanceMap[s.toId] || 0) - s.amount;
    });

    return members.map((m) => ({
        memberId: m.id,
        memberName: m.name,
        balance: Math.round((balanceMap[m.id] || 0) * 100) / 100,
    }));
}

/**
 * Minimum transactions settlement algorithm.
 * Uses a greedy approach to match largest debtor with largest creditor.
 */
export function calculateMinimumTransactions(
    members: Member[],
    expenses: Expense[],
    settlements: Settlement[]
): TransactionSuggestion[] {
    const balances = calculateBalances(members, expenses, settlements);

    // Separate into creditors and debtors
    const creditors: { id: string; name: string; amount: number }[] = [];
    const debtors: { id: string; name: string; amount: number }[] = [];

    balances.forEach((b) => {
        if (b.balance > 0.01) {
            creditors.push({ id: b.memberId, name: b.memberName, amount: b.balance });
        } else if (b.balance < -0.01) {
            debtors.push({ id: b.memberId, name: b.memberName, amount: -b.balance });
        }
    });

    // Sort descending by amount
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const transactions: TransactionSuggestion[] = [];

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        const amount = Math.min(debtor.amount, creditor.amount);

        if (amount > 0.01) {
            transactions.push({
                fromId: debtor.id,
                fromName: debtor.name,
                toId: creditor.id,
                toName: creditor.name,
                amount: Math.round(amount * 100) / 100,
            });
        }

        debtor.amount -= amount;
        creditor.amount -= amount;

        if (debtor.amount < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }

    return transactions;
}

/**
 * Get total group spending
 */
export function getTotalSpending(expenses: Expense[]): number {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Get spending breakdown by category
 */
export function getSpendingByCategory(expenses: Expense[]): { category: string; amount: number }[] {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
        map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);
}

/**
 * Get monthly spending data
 */
export function getMonthlySpending(expenses: Expense[]): { month: string; amount: number }[] {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
        const date = new Date(e.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        map[key] = (map[key] || 0) + e.amount;
    });
    return Object.entries(map)
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6); // Last 6 months
}
