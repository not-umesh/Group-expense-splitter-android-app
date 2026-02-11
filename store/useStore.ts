/**
 * Zustand Store — Supabase-backed Global State Management
 *
 * All data is persisted to Supabase Postgres. Zustand provides
 * in-memory caching for reactivity. Data is hydrated on login.
 *
 * Mutation actions are guarded with input validation (OWASP A03).
 * String inputs are sanitized before storage.
 *
 * </UV>
 */

import { create } from 'zustand';
import { Group, Member, Expense, Settlement, ExpenseSplit } from '../types';
import { getMemberColor } from '../utils/helpers';
import { supabase } from '../lib/supabase';
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
    isHydrated: boolean;

    // Hydration — load from Supabase on login
    hydrate: () => Promise<void>;
    clearLocal: () => void;

    // Group actions (validated & sanitized)
    addGroup: (name: string, category: Group['category'], memberNames: string[]) => Promise<string | null>;
    updateGroup: (id: string, updates: Partial<Pick<Group, 'name' | 'category'>>) => Promise<void>;
    deleteGroup: (id: string) => Promise<void>;
    addMemberToGroup: (groupId: string, name: string) => Promise<boolean>;

    // Expense actions (validated & sanitized)
    addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'splits'> & { splits: ExpenseSplit[] }) => Promise<boolean>;
    deleteExpense: (id: string) => Promise<void>;

    // Settlement actions
    addSettlement: (groupId: string, fromId: string, toId: string, amount: number) => Promise<boolean>;

    // Settings (validated)
    setCurrency: (currency: string) => void;

    // Data management
    clearAll: () => Promise<void>;

    // Getters
    getGroup: (id: string) => Group | undefined;
    getGroupExpenses: (groupId: string) => Expense[];
    getGroupSettlements: (groupId: string) => Settlement[];
    getAllExpenses: () => Expense[];
}

export const useStore = create<AppState>()(
    (set, get) => ({
        groups: [],
        expenses: [],
        settlements: [],
        currency: '₹',
        isHydrated: false,

        // ─── Hydration ────────────────────────────────────────
        hydrate: async () => {
            try {
                // Fetch groups with members
                const { data: groupRows, error: gErr } = await supabase
                    .from('groups')
                    .select('*, members(*)')
                    .order('created_at', { ascending: false });

                if (gErr) throw gErr;

                const groups: Group[] = (groupRows || []).map((g: any) => ({
                    id: g.id,
                    userId: g.user_id,
                    name: g.name,
                    category: g.category,
                    createdAt: g.created_at,
                    members: (g.members || [])
                        .sort((a: any, b: any) => a.sort_order - b.sort_order)
                        .map((m: any) => ({
                            id: m.id,
                            groupId: m.group_id,
                            name: m.name,
                            color: m.color,
                            sortOrder: m.sort_order,
                        })),
                }));

                // Fetch expenses with splits
                const { data: expenseRows, error: eErr } = await supabase
                    .from('expenses')
                    .select('*, expense_splits(*)')
                    .order('date', { ascending: false });

                if (eErr) throw eErr;

                const expenses: Expense[] = (expenseRows || []).map((e: any) => ({
                    id: e.id,
                    groupId: e.group_id,
                    description: e.description,
                    amount: Number(e.amount),
                    paidById: e.paid_by_id,
                    category: e.category,
                    splitType: e.split_type,
                    date: e.date,
                    createdAt: e.created_at,
                    splits: (e.expense_splits || []).map((s: any) => ({
                        memberId: s.member_id,
                        amount: Number(s.amount),
                        itemName: s.item_name,
                    })),
                }));

                // Fetch settlements
                const { data: settlementRows, error: sErr } = await supabase
                    .from('settlements')
                    .select('*')
                    .order('date', { ascending: false });

                if (sErr) throw sErr;

                const settlements: Settlement[] = (settlementRows || []).map((s: any) => ({
                    id: s.id,
                    groupId: s.group_id,
                    fromId: s.from_id,
                    toId: s.to_id,
                    amount: Number(s.amount),
                    date: s.date,
                }));

                set({ groups, expenses, settlements, isHydrated: true });
            } catch (err) {
                console.error('Hydration error:', err);
                set({ isHydrated: true }); // still mark as hydrated so UI isn't stuck
            }
        },

        clearLocal: () => {
            set({ groups: [], expenses: [], settlements: [], isHydrated: false });
        },

        // ─── Group Actions (Validated) ─────────────────────────
        addGroup: async (name, category, memberNames) => {
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

            try {
                // Get current user
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return null;

                // Insert group
                const { data: groupData, error: gErr } = await supabase
                    .from('groups')
                    .insert({ name: cleanName, category, user_id: user.id })
                    .select()
                    .single();

                if (gErr || !groupData) throw gErr;

                // Insert members
                const memberInserts = validMembers.map((n, i) => ({
                    group_id: groupData.id,
                    name: n,
                    color: getMemberColor(i),
                    sort_order: i,
                }));

                const { data: memberData, error: mErr } = await supabase
                    .from('members')
                    .insert(memberInserts)
                    .select();

                if (mErr) throw mErr;

                // Build local group object
                const newGroup: Group = {
                    id: groupData.id,
                    userId: groupData.user_id,
                    name: groupData.name,
                    category: groupData.category,
                    createdAt: groupData.created_at,
                    members: (memberData || []).map((m: any) => ({
                        id: m.id,
                        groupId: m.group_id,
                        name: m.name,
                        color: m.color,
                        sortOrder: m.sort_order,
                    })),
                };

                set((state) => ({ groups: [newGroup, ...state.groups] }));
                return groupData.id;
            } catch (err) {
                console.error('addGroup error:', err);
                return null;
            }
        },

        updateGroup: async (id, updates) => {
            const safeUpdates: Record<string, any> = {};
            if (updates.name) {
                const cleanName = sanitizeString(updates.name);
                const check = validateGroupName(cleanName);
                if (!check.valid) return;
                safeUpdates.name = cleanName;
            }
            if (updates.category) {
                const check = validateCategory(updates.category);
                if (!check.valid) return;
                safeUpdates.category = updates.category;
            }

            try {
                const { error } = await supabase
                    .from('groups')
                    .update(safeUpdates)
                    .eq('id', id);

                if (error) throw error;

                set((state) => ({
                    groups: state.groups.map((g) =>
                        g.id === id ? { ...g, ...updates } : g
                    ),
                }));
            } catch (err) {
                console.error('updateGroup error:', err);
            }
        },

        deleteGroup: async (id) => {
            try {
                const { error } = await supabase
                    .from('groups')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                // Cascade delete is handled by DB, update local state
                set((state) => ({
                    groups: state.groups.filter((g) => g.id !== id),
                    expenses: state.expenses.filter((e) => e.groupId !== id),
                    settlements: state.settlements.filter((s) => s.groupId !== id),
                }));
            } catch (err) {
                console.error('deleteGroup error:', err);
            }
        },

        addMemberToGroup: async (groupId, name) => {
            const group = get().groups.find((g) => g.id === groupId);
            if (!group) return false;

            const countCheck = validateMemberCount(group.members.length);
            if (!countCheck.valid) return false;

            const cleanName = sanitizeString(name);
            const nameCheck = validateMemberName(cleanName);
            if (!nameCheck.valid) return false;

            // Reject duplicates (case-insensitive)
            if (group.members.some((m) => m.name.toLowerCase() === cleanName.toLowerCase())) {
                return false;
            }

            try {
                const { data, error } = await supabase
                    .from('members')
                    .insert({
                        group_id: groupId,
                        name: cleanName,
                        color: getMemberColor(group.members.length),
                        sort_order: group.members.length,
                    })
                    .select()
                    .single();

                if (error || !data) throw error;

                const newMember: Member = {
                    id: data.id,
                    groupId: data.group_id,
                    name: data.name,
                    color: data.color,
                    sortOrder: data.sort_order,
                };

                set((state) => ({
                    groups: state.groups.map((g) => {
                        if (g.id !== groupId) return g;
                        return { ...g, members: [...g.members, newMember] };
                    }),
                }));
                return true;
            } catch (err) {
                console.error('addMemberToGroup error:', err);
                return false;
            }
        },

        // ─── Expense Actions (Validated) ───────────────────────
        addExpense: async (expense) => {
            // Validate expense count for this group
            const groupExpenses = get().expenses.filter((e) => e.groupId === expense.groupId);
            const countCheck = validateExpenseCount(groupExpenses.length);
            if (!countCheck.valid) return false;

            // Validate amount
            const amountCheck = validateAmount(expense.amount);
            if (!amountCheck.valid) return false;

            // Sanitize description
            const cleanDesc = sanitizeString(expense.description);
            const normalizedAmount = Math.round(expense.amount * 100) / 100;

            try {
                // Insert expense
                const { data: expData, error: eErr } = await supabase
                    .from('expenses')
                    .insert({
                        group_id: expense.groupId,
                        description: cleanDesc,
                        amount: normalizedAmount,
                        paid_by_id: expense.paidById,
                        category: expense.category,
                        split_type: expense.splitType,
                        date: expense.date,
                    })
                    .select()
                    .single();

                if (eErr || !expData) throw eErr;

                // Insert splits
                const splitInserts = expense.splits.map((s) => ({
                    expense_id: expData.id,
                    member_id: s.memberId,
                    amount: Math.round(s.amount * 100) / 100,
                    item_name: s.itemName || null,
                }));

                const { error: sErr } = await supabase
                    .from('expense_splits')
                    .insert(splitInserts);

                if (sErr) throw sErr;

                // Build local expense object
                const newExpense: Expense = {
                    id: expData.id,
                    groupId: expData.group_id,
                    description: expData.description,
                    amount: Number(expData.amount),
                    paidById: expData.paid_by_id,
                    category: expData.category,
                    splitType: expData.split_type,
                    date: expData.date,
                    createdAt: expData.created_at,
                    splits: expense.splits,
                };

                set((state) => ({ expenses: [newExpense, ...state.expenses] }));
                return true;
            } catch (err) {
                console.error('addExpense error:', err);
                return false;
            }
        },

        deleteExpense: async (id) => {
            try {
                const { error } = await supabase
                    .from('expenses')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                set((state) => ({
                    expenses: state.expenses.filter((e) => e.id !== id),
                }));
            } catch (err) {
                console.error('deleteExpense error:', err);
            }
        },

        // ─── Settlement Actions (Validated) ────────────────────
        addSettlement: async (groupId, fromId, toId, amount) => {
            const amountCheck = validateAmount(amount);
            if (!amountCheck.valid) return false;
            if (fromId === toId) return false;

            try {
                const { data, error } = await supabase
                    .from('settlements')
                    .insert({
                        group_id: groupId,
                        from_id: fromId,
                        to_id: toId,
                        amount: Math.round(amount * 100) / 100,
                    })
                    .select()
                    .single();

                if (error || !data) throw error;

                const settlement: Settlement = {
                    id: data.id,
                    groupId: data.group_id,
                    fromId: data.from_id,
                    toId: data.to_id,
                    amount: Number(data.amount),
                    date: data.date,
                };

                set((state) => ({ settlements: [...state.settlements, settlement] }));
                return true;
            } catch (err) {
                console.error('addSettlement error:', err);
                return false;
            }
        },

        // ─── Settings (Validated) ──────────────────────────────
        setCurrency: (currency) => {
            const VALID = ['₹', '$', '€', '£', '¥', '₩'];
            if (VALID.includes(currency)) {
                set({ currency });
            }
        },

        // ─── Data Management ───────────────────────────────────
        clearAll: async () => {
            try {
                // Delete all groups (cascades to members, expenses, settlements)
                const { error } = await supabase
                    .from('groups')
                    .delete()
                    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

                if (error) throw error;

                set({ groups: [], expenses: [], settlements: [], currency: '₹' });
            } catch (err) {
                console.error('clearAll error:', err);
            }
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
    })
);
