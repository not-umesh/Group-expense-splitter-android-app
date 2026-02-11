import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ScrollView,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius, Shadows, GroupIcons } from '../../../constants/theme';
import { useStore } from '../../../store/useStore';
import { calculateBalances, calculateMinimumTransactions } from '../../../utils/settlement';
import { formatCurrency } from '../../../utils/helpers';
import ExpenseCard from '../../../components/ExpenseCard';
import MemberAvatar from '../../../components/MemberAvatar';
import EmptyState from '../../../components/EmptyState';

type TabKey = 'expenses' | 'balances' | 'stats';

export default function GroupDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { getGroup, getGroupExpenses, getGroupSettlements, deleteGroup, currency } = useStore();
    const [activeTab, setActiveTab] = useState<TabKey>('expenses');

    const group = getGroup(id);
    if (!group) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Group not found</Text>
            </View>
        );
    }

    const expenses = getGroupExpenses(id);
    const settlements = getGroupSettlements(id);
    const balances = calculateBalances(group.members, expenses, settlements);
    const transactions = calculateMinimumTransactions(group.members, expenses, settlements);
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

    const handleDelete = () => {
        Alert.alert('Delete Group', `Delete "${group.name}" and all its data?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await deleteGroup(id);
                    router.back();
                },
            },
        ]);
    };

    const renderExpenses = () => {
        if (expenses.length === 0) {
            return (
                <EmptyState
                    icon="receipt-text-outline"
                    title="No expenses"
                    subtitle="Add your first expense to start splitting costs."
                />
            );
        }
        return (
            <View style={styles.tabContent}>
                {expenses.map((exp) => (
                    <ExpenseCard
                        key={exp.id}
                        expense={exp}
                        members={group.members}
                        currency={currency}
                    />
                ))}
            </View>
        );
    };

    const renderBalances = () => (
        <View style={styles.tabContent}>
            {/* Individual Balances */}
            <Text style={styles.subTitle}>Individual Balances</Text>
            {balances.map((b) => {
                const member = group.members.find((m) => m.id === b.memberId);
                if (!member) return null;
                const isOwed = b.balance > 0;
                const isSettled = Math.abs(b.balance) < 0.01;
                return (
                    <View key={b.memberId} style={styles.balanceRow}>
                        <MemberAvatar name={member.name} color={member.color} size={36} />
                        <View style={styles.balanceInfo}>
                            <Text style={styles.balanceName}>{member.name}</Text>
                            <Text
                                style={[
                                    styles.balanceAmount,
                                    { color: isSettled ? Colors.light.textTertiary : isOwed ? Colors.light.success : Colors.light.secondary },
                                ]}
                            >
                                {isSettled
                                    ? 'Settled up'
                                    : isOwed
                                        ? `Gets back ${formatCurrency(b.balance, currency)}`
                                        : `Owes ${formatCurrency(b.balance, currency)}`}
                            </Text>
                        </View>
                    </View>
                );
            })}

            {/* Smart Settlement */}
            {transactions.length > 0 && (
                <>
                    <Text style={[styles.subTitle, { marginTop: Spacing.xl }]}>
                        Smart Settlement ({transactions.length} transaction{transactions.length !== 1 ? 's' : ''})
                    </Text>
                    {transactions.map((t, i) => (
                        <View key={i} style={styles.transactionRow}>
                            <View style={styles.transactionPeople}>
                                <Text style={styles.transactionName}>{t.fromName}</Text>
                                <MaterialCommunityIcons name="arrow-right" size={16} color={Colors.light.textTertiary} />
                                <Text style={styles.transactionName}>{t.toName}</Text>
                            </View>
                            <Text style={styles.transactionAmount}>{formatCurrency(t.amount, currency)}</Text>
                            <TouchableOpacity
                                style={styles.settleBtn}
                                onPress={() =>
                                    router.push({
                                        pathname: '/group/[id]/settle',
                                        params: { id, fromId: t.fromId, toId: t.toId, amount: t.amount.toString() },
                                    })
                                }
                            >
                                <Text style={styles.settleBtnText}>Settle</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </>
            )}

            {transactions.length === 0 && expenses.length > 0 && (
                <View style={styles.settledCard}>
                    <MaterialCommunityIcons name="check-circle" size={48} color={Colors.light.success} />
                    <Text style={styles.settledText}>All settled up! 🎉</Text>
                </View>
            )}
        </View>
    );

    const renderStats = () => (
        <View style={styles.tabContent}>
            <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{formatCurrency(totalSpent, currency)}</Text>
                    <Text style={styles.statLabel}>Total Spent</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{expenses.length}</Text>
                    <Text style={styles.statLabel}>Expenses</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{group.members.length}</Text>
                    <Text style={styles.statLabel}>Members</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>
                        {formatCurrency(group.members.length > 0 ? totalSpent / group.members.length : 0, currency)}
                    </Text>
                    <Text style={styles.statLabel}>Per Person</Text>
                </View>
            </View>

            {/* Top Spender */}
            {expenses.length > 0 && (
                <View style={styles.topSpenderCard}>
                    <Text style={styles.subTitle}>Top Payer</Text>
                    {(() => {
                        const payerMap: Record<string, number> = {};
                        expenses.forEach((e) => {
                            payerMap[e.paidById] = (payerMap[e.paidById] || 0) + e.amount;
                        });
                        const topId = Object.entries(payerMap).sort((a, b) => b[1] - a[1])[0];
                        const topMember = group.members.find((m) => m.id === topId[0]);
                        if (!topMember) return null;
                        return (
                            <View style={styles.balanceRow}>
                                <MemberAvatar name={topMember.name} color={topMember.color} size={40} />
                                <View style={styles.balanceInfo}>
                                    <Text style={styles.balanceName}>{topMember.name}</Text>
                                    <Text style={styles.balanceAmount}>
                                        Paid {formatCurrency(topId[1], currency)}
                                    </Text>
                                </View>
                            </View>
                        );
                    })()}
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.light.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerIcon}>{GroupIcons[group.category] || '📁'}</Text>
                    <Text style={styles.headerTitle} numberOfLines={1}>{group.name}</Text>
                </View>
                <TouchableOpacity onPress={handleDelete} style={styles.backBtn}>
                    <MaterialCommunityIcons name="delete-outline" size={22} color={Colors.light.error} />
                </TouchableOpacity>
            </View>

            {/* Members Row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.membersScroll}>
                <View style={styles.membersRow}>
                    {group.members.map((m) => (
                        <View key={m.id} style={styles.memberItem}>
                            <MemberAvatar name={m.name} color={m.color} size={36} />
                            <Text style={styles.memberName} numberOfLines={1}>
                                {m.name}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Tab Selector */}
            <View style={styles.tabBar}>
                {([
                    { key: 'expenses', label: 'Expenses', icon: 'receipt' },
                    { key: 'balances', label: 'Balances', icon: 'scale-balance' },
                    { key: 'stats', label: 'Stats', icon: 'chart-box' },
                ] as const).map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <MaterialCommunityIcons
                            name={tab.icon as any}
                            size={18}
                            color={activeTab === tab.key ? Colors.light.primary : Colors.light.textTertiary}
                        />
                        <Text
                            style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Tab Content */}
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {activeTab === 'expenses' && renderExpenses()}
                {activeTab === 'balances' && renderBalances()}
                {activeTab === 'stats' && renderStats()}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Add Expense FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push({ pathname: '/group/[id]/add-expense', params: { id } })}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={[Colors.light.primary, '#5A52E0']}
                    style={styles.fabGradient}
                >
                    <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
                    <Text style={styles.fabText}>Add Expense</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    errorText: {
        textAlign: 'center',
        marginTop: 100,
        color: Colors.light.textSecondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingTop: 60,
        paddingBottom: Spacing.md,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.light.surface,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.sm,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerIcon: {
        fontSize: 24,
    },
    headerTitle: {
        fontSize: FontSize.lg,
        fontWeight: '800',
        color: Colors.light.text,
        marginTop: 2,
    },
    membersScroll: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    membersRow: {
        flexDirection: 'row',
        gap: Spacing.lg,
    },
    memberItem: {
        alignItems: 'center',
        width: 56,
    },
    memberName: {
        fontSize: 10,
        color: Colors.light.textSecondary,
        marginTop: 4,
        textAlign: 'center',
    },
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: Spacing.lg,
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.lg,
        padding: 4,
        ...Shadows.sm,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: 6,
    },
    tabActive: {
        backgroundColor: Colors.light.primary + '15',
    },
    tabLabel: {
        fontSize: FontSize.xs,
        fontWeight: '600',
        color: Colors.light.textTertiary,
    },
    tabLabelActive: {
        color: Colors.light.primary,
    },
    scrollContent: {
        flex: 1,
    },
    tabContent: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
    },
    subTitle: {
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: Colors.light.textSecondary,
        marginBottom: Spacing.md,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        ...Shadows.sm,
    },
    balanceInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    balanceName: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.light.text,
    },
    balanceAmount: {
        fontSize: FontSize.xs,
        fontWeight: '600',
        marginTop: 2,
    },
    transactionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        ...Shadows.sm,
    },
    transactionPeople: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    transactionName: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.light.text,
    },
    transactionAmount: {
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: Colors.light.primary,
        marginRight: Spacing.md,
    },
    settleBtn: {
        backgroundColor: Colors.light.success,
        borderRadius: BorderRadius.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
    },
    settleBtnText: {
        fontSize: FontSize.xs,
        fontWeight: '700',
        color: '#FFF',
    },
    settledCard: {
        alignItems: 'center',
        paddingVertical: Spacing.xxxl,
    },
    settledText: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.light.success,
        marginTop: Spacing.md,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    statBox: {
        width: '47%',
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        alignItems: 'center',
        ...Shadows.sm,
    },
    statValue: {
        fontSize: FontSize.xl,
        fontWeight: '800',
        color: Colors.light.primary,
    },
    statLabel: {
        fontSize: FontSize.xs,
        color: Colors.light.textSecondary,
        marginTop: 4,
    },
    topSpenderCard: {
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        ...Shadows.sm,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        left: Spacing.lg,
        right: Spacing.lg,
        ...Shadows.lg,
    },
    fabGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.lg,
        gap: Spacing.sm,
    },
    fabText: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: '#FFF',
    },
});
