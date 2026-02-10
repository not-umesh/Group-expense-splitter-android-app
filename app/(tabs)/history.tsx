import React from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar } from 'react-native';
import { Colors, Spacing, FontSize } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import ExpenseCard from '../../components/ExpenseCard';
import EmptyState from '../../components/EmptyState';

export default function HistoryScreen() {
    const { getAllExpenses, groups, currency } = useStore();
    const allExpenses = getAllExpenses();

    const getMembersForExpense = (groupId: string) => {
        const group = groups.find((g) => g.id === groupId);
        return group?.members || [];
    };

    const getGroupName = (groupId: string) => {
        return groups.find((g) => g.id === groupId)?.name || 'Unknown';
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <FlatList
                data={allExpenses}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.expenseWrapper}>
                        <Text style={styles.groupLabel}>{getGroupName(item.groupId)}</Text>
                        <ExpenseCard
                            expense={item}
                            members={getMembersForExpense(item.groupId)}
                            currency={currency}
                        />
                    </View>
                )}
                ListEmptyComponent={
                    <EmptyState
                        icon="history"
                        title="No expenses yet"
                        subtitle="Your expense history will appear here once you start adding expenses to your groups."
                    />
                }
                contentContainerStyle={
                    allExpenses.length === 0 ? styles.emptyList : styles.list
                }
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    list: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: 40,
    },
    emptyList: {
        flexGrow: 1,
    },
    expenseWrapper: {
        marginBottom: Spacing.sm,
    },
    groupLabel: {
        fontSize: FontSize.xs,
        color: Colors.light.textSecondary,
        fontWeight: '600',
        marginBottom: 4,
        marginLeft: 4,
    },
});
