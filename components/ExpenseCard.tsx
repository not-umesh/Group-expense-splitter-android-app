import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadows, Spacing, FontSize, ExpenseCategories } from '../constants/theme';
import { Expense, Member } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';

interface ExpenseCardProps {
    expense: Expense;
    members: Member[];
    currency: string;
    onPress?: () => void;
}

export default function ExpenseCard({ expense, members, currency, onPress }: ExpenseCardProps) {
    const payer = members.find((m) => m.id === expense.paidById);
    const categoryInfo = ExpenseCategories.find((c) => c.key === expense.category) || ExpenseCategories[6];

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
            <View style={[styles.iconContainer, { backgroundColor: categoryInfo.color + '20' }]}>
                <MaterialCommunityIcons name={categoryInfo.icon as any} size={22} color={categoryInfo.color} />
            </View>
            <View style={styles.info}>
                <Text style={styles.description} numberOfLines={1}>{expense.description}</Text>
                <Text style={styles.meta}>
                    Paid by {payer?.name || 'Unknown'} · {formatDate(expense.date)}
                </Text>
            </View>
            <View style={styles.amountContainer}>
                <Text style={styles.amount}>{formatCurrency(expense.amount, currency)}</Text>
                <Text style={styles.splitInfo}>
                    ÷ {expense.splits.length}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        ...Shadows.sm,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    info: {
        flex: 1,
    },
    description: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 2,
    },
    meta: {
        fontSize: FontSize.xs,
        color: Colors.light.textSecondary,
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: Colors.light.text,
    },
    splitInfo: {
        fontSize: FontSize.xs,
        color: Colors.light.textTertiary,
    },
});
