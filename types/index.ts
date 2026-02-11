/**
 * Types — App data structures.
 *
 * IDs are UUIDs from Supabase. CamelCase is used in the app layer;
 * the store handles snake_case ↔ camelCase mapping at the Supabase boundary.
 *
 * </UV>
 */

export interface Group {
    id: string;
    userId?: string;
    name: string;
    category: 'trip' | 'roommates' | 'dinner' | 'party' | 'shopping' | 'office' | 'custom';
    createdAt: string;
    members: Member[];
}

export interface Member {
    id: string;
    groupId?: string;
    name: string;
    color: string;
    sortOrder?: number;
}

export interface Expense {
    id: string;
    groupId: string;
    description: string;
    amount: number;
    paidById: string;
    category: string;
    splitType: 'equal' | 'unequal' | 'itemwise';
    splits: ExpenseSplit[];
    date: string;
    createdAt: string;
}

export interface ExpenseSplit {
    memberId: string;
    amount: number;
    itemName?: string;
}

export interface Settlement {
    id: string;
    groupId: string;
    fromId: string;
    toId: string;
    amount: number;
    date: string;
}

export interface BalanceEntry {
    memberId: string;
    memberName: string;
    balance: number; // positive = is owed, negative = owes
}

export interface TransactionSuggestion {
    fromId: string;
    fromName: string;
    toId: string;
    toName: string;
    amount: number;
}
