import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadows, Spacing, FontSize, GroupIcons } from '../constants/theme';
import { Group } from '../types';
import { useStore } from '../store/useStore';
import { calculateBalances } from '../utils/settlement';
import { formatCurrency } from '../utils/helpers';

interface GroupCardProps {
    group: Group;
    onPress: () => void;
}

export default function GroupCard({ group, onPress }: GroupCardProps) {
    const { getGroupExpenses, getGroupSettlements, currency } = useStore();
    const expenses = getGroupExpenses(group.id);
    const settlements = getGroupSettlements(group.id);
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.iconContainer}>
                <Text style={styles.icon}>{GroupIcons[group.category] || '📁'}</Text>
            </View>
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{group.name}</Text>
                <Text style={styles.meta}>
                    {group.members.length} member{group.members.length !== 1 ? 's' : ''} · {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
                </Text>
            </View>
            <View style={styles.amountContainer}>
                <Text style={styles.amount}>{formatCurrency(totalSpent, currency)}</Text>
                <Text style={styles.amountLabel}>total</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.light.textTertiary} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        ...Shadows.sm,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.light.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    icon: {
        fontSize: 24,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 2,
    },
    meta: {
        fontSize: FontSize.xs,
        color: Colors.light.textSecondary,
    },
    amountContainer: {
        alignItems: 'flex-end',
        marginRight: Spacing.sm,
    },
    amount: {
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: Colors.light.primary,
    },
    amountLabel: {
        fontSize: FontSize.xs,
        color: Colors.light.textTertiary,
    },
});
