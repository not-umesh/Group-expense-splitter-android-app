/**
 * Zustand Store — Global State Management
 * 
 * All mutation actions are guarded with input validation (OWASP A03).
 * String inputs are sanitized before storage.
 * Capacity limits prevent unbounded data growth.
 *
 * </UV> // works on my machine ™
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Group, Member, Expense, Settlement } from '../types';
import { generateId, getMemberColor } from '../utils/helpers';
import {
    sanitizeString,
    validateGroupName,
    validateMemberName,
    validateAmount,
    validateCategory,
    validateGroupCount,
    validateMemberCount,
    validateExpenseCount,
    V_LIMITS,
} from '../utils/validation';

interface AppState {
    groups: Group[];
    expenses: Expense[];
    settlements: Settlement[];
    currency: string;

    // Group actions (validated & sanitized)
    addGroup: (name: string, category: Group['category'], memberNames: string[]) => string | null;
    updateGroup: (id: string, updates: Partial<Pick<Group, 'name' | 'category'>>) => void;
    deleteGroup: (id: string) => void;
    addMemberToGroup: (groupId: string, name: string) => boolean;

    // Expense actions (validated & sanitized)
    addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => boolean;
    deleteExpense: (id: string) => void;

    // Settlement actions
    addSettlement: (groupId: string, fromId: string, toId: string, amount: number) => boolean;

    // Settings (validated)
    setCurrency: (currency: string) => void;

    // Data management
    clearAll: () => void;

    // Getters
    getGroup: (id: string) => Group | undefined;
    getGroupExpenses: (groupId: string) => Expense[];
    getGroupSettlements: (groupId: string) => Settlement[];
    getAllExpenses: () => Expense[];
}

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            groups: [],
            expenses: [],
            settlements: [],
            currency: '₹',

            // ─── Group Actions (Validated) ─────────────────────────
            addGroup: (name, category, memberNames) => {
                // Validate group count limit
                const countCheck = validateGroupCount(get().groups.length);
                if (!countCheck.valid) return null;

                // Validate & sanitize group name
                const cleanName = sanitizeString(name);
                const nameCheck = validateGroupName(cleanName);
                if (!nameCheck.valid) return null;

                // Validate category enum
                const catCheck = validateCategory(category);
                if (!catCheck.valid) return null;

                // Validate & sanitize member names, cap at limit
                const validMembers = memberNames
                    .slice(0, V_LIMITS.MEMBERS_MAX)
                    .map((n) => sanitizeString(n))
                    .filter((n) => validateMemberName(n).valid);

                if (validMembers.length < 2) return null;

                const id = generateId();
                const members: Member[] = validMembers.map((n, i) => ({
                    id: generateId(),
                    name: n,
                    color: getMemberColor(i),
                }));

                const group: Group = {
                    id,
                    name: cleanName,
                    category,
                    createdAt: new Date().toISOString(),
                    members,
                };
                set((state) => ({ groups: [group, ...state.groups] }));
                return id;
            },

            updateGroup: (id, updates) => {
                // Sanitize any name updates
                const safeUpdates = { ...updates };
                if (safeUpdates.name) {
                    const cleanName = sanitizeString(safeUpdates.name);
                    const check = validateGroupName(cleanName);
                    if (!check.valid) return;
                    safeUpdates.name = cleanName;
                }
                if (safeUpdates.category) {
                    const check = validateCategory(safeUpdates.category);
                    if (!check.valid) return;
                }

                set((state) => ({
                    groups: state.groups.map((g) =>
                        g.id === id ? { ...g, ...safeUpdates } : g
                    ),
                }));
            },

            deleteGroup: (id) => {
                set((state) => ({
                    groups: state.groups.filter((g) => g.id !== id),
                    expenses: state.expenses.filter((e) => e.groupId !== id),
                    settlements: state.settlements.filter((s) => s.groupId !== id),
                }));
            },

            addMemberToGroup: (groupId, name) => {
                const group = get().groups.find((g) => g.id === groupId);
                if (!group) return false;

                // Validate member count limit
                const countCheck = validateMemberCount(group.members.length);
                if (!countCheck.valid) return false;

                // Validate & sanitize name
                const cleanName = sanitizeString(name);
                const nameCheck = validateMemberName(cleanName);
                if (!nameCheck.valid) return false;

                // Reject duplicates (case-insensitive)
                if (group.members.some((m) => m.name.toLowerCase() === cleanName.toLowerCase())) {
                    return false;
                }

                set((state) => ({
                    groups: state.groups.map((g) => {
                        if (g.id !== groupId) return g;
                        return {
                            ...g,
                            members: [
                                ...g.members,
                                {
                                    id: generateId(),
                                    name: cleanName,
                                    color: getMemberColor(g.members.length),
                                },
                            ],
                        };
                    }),
                }));
                return true;
            },

            // ─── Expense Actions (Validated) ───────────────────────
            addExpense: (expense) => {
                // Validate expense count for this group
                const groupExpenses = get().expenses.filter((e) => e.groupId === expense.groupId);
                const countCheck = validateExpenseCount(groupExpenses.length);
                if (!countCheck.valid) return false;

                // Validate amount
                const amountCheck = validateAmount(expense.amount);
                if (!amountCheck.valid) return false;

                // Sanitize description
                const cleanDesc = sanitizeString(expense.description);

                const newExpense: Expense = {
                    ...expense,
                    description: cleanDesc,
                    amount: Math.round(expense.amount * 100) / 100, // normalize to 2 decimals
                    id: generateId(),
                    createdAt: new Date().toISOString(),
                };
                set((state) => ({ expenses: [newExpense, ...state.expenses] }));
                return true;
            },

            deleteExpense: (id) => {
                set((state) => ({
                    expenses: state.expenses.filter((e) => e.id !== id),
                }));
            },

            // ─── Settlement Actions (Validated) ────────────────────
            addSettlement: (groupId, fromId, toId, amount) => {
                // Validate amount
                const amountCheck = validateAmount(amount);
                if (!amountCheck.valid) return false;

                // Reject invalid: same person
                if (fromId === toId) return false;

                const settlement: Settlement = {
                    id: generateId(),
                    groupId,
                    fromId,
                    toId,
                    amount: Math.round(amount * 100) / 100,
                    date: new Date().toISOString(),
                };
                set((state) => ({ settlements: [...state.settlements, settlement] }));
                return true;
            },

            // ─── Settings (Validated) ──────────────────────────────
            setCurrency: (currency) => {
                // Only accept known currencies
                const VALID = ['₹', '$', '€', '£', '¥', '₩'];
                if (VALID.includes(currency)) {
                    set({ currency });
                }
            },

            // ─── Data Management ───────────────────────────────────
            clearAll: () => {
                set({ groups: [], expenses: [], settlements: [], currency: '₹' });
            },

            // ─── Getters ───────────────────────────────────────────
            getGroup: (id) => get().groups.find((g) => g.id === id),
            getGroupExpenses: (groupId) =>
                get()
                    .expenses.filter((e) => e.groupId === groupId)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            getGroupSettlements: (groupId) =>
                get().settlements.filter((s) => s.groupId === groupId),
            getAllExpenses: () =>
                get()
                    .expenses.slice()
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        }),
        {
            name: 'split-settle-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
