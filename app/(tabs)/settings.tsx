import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
    Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { rateLimitDelete, getThrottleMessage } from '../../utils/rateLimiter';

const CURRENCIES = ['₹', '$', '€', '£', '¥', '₩'];

export default function SettingsScreen() {
    const { currency, setCurrency, groups, expenses, settlements, clearAll } = useStore();

    const handleClearData = () => {
        // Rate limit destructive operations
        const rateCheck = rateLimitDelete('clearAll');
        if (!rateCheck.allowed) {
            Alert.alert('Hold On', getThrottleMessage(rateCheck.retryAfterMs));
            return;
        }

        Alert.alert(
            'Clear All Data',
            'This will permanently delete all groups, expenses, and settlements. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: () => {
                        clearAll();
                        Alert.alert('Done', 'All data has been cleared.');
                    },
                },
            ]
        );
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <StatusBar barStyle="dark-content" />

            {/* Currency */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Currency</Text>
                <View style={styles.currencyRow}>
                    {CURRENCIES.map((c) => (
                        <TouchableOpacity
                            key={c}
                            style={[
                                styles.currencyChip,
                                currency === c && styles.currencyChipActive,
                            ]}
                            onPress={() => setCurrency(c)}
                        >
                            <Text
                                style={[
                                    styles.currencyText,
                                    currency === c && styles.currencyTextActive,
                                ]}
                            >
                                {c}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Stats */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>App Stats</Text>
                <View style={styles.statCard}>
                    <StatRow icon="account-group" label="Groups" value={groups.length.toString()} />
                    <StatRow icon="receipt" label="Expenses" value={expenses.length.toString()} />
                    <StatRow icon="handshake" label="Settlements" value={settlements.length.toString()} />
                </View>
            </View>

            {/* About */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <View style={styles.aboutCard}>
                    <Text style={styles.appName}>Split & Settle</Text>
                    <Text style={styles.appVersion}>Version 1.0.0</Text>
                    <Text style={styles.appDesc}>
                        Effortless group expense splitting with smart settlement algorithm.
                    </Text>
                    <Text style={styles.watermark}>{'</UV>'} // sudo rm -rf bugs/*</Text>
                </View>
            </View>

            {/* Danger Zone */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: Colors.light.error }]}>Danger Zone</Text>
                <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
                    <MaterialCommunityIcons name="delete-forever" size={20} color={Colors.light.error} />
                    <Text style={styles.dangerText}>Clear All Data</Text>
                </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

function StatRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <View style={styles.statRow}>
            <MaterialCommunityIcons name={icon as any} size={20} color={Colors.light.primary} />
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    section: {
        paddingHorizontal: Spacing.lg,
        marginTop: Spacing.xl,
    },
    sectionTitle: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: Spacing.md,
    },
    currencyRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    currencyChip: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.light.surface,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.sm,
    },
    currencyChipActive: {
        backgroundColor: Colors.light.primary,
    },
    currencyText: {
        fontSize: FontSize.lg,
        color: Colors.light.text,
    },
    currencyTextActive: {
        color: '#FFF',
    },
    statCard: {
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        ...Shadows.sm,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    statLabel: {
        flex: 1,
        marginLeft: Spacing.md,
        fontSize: FontSize.sm,
        color: Colors.light.text,
    },
    statValue: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.light.primary,
    },
    aboutCard: {
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        alignItems: 'center',
        ...Shadows.sm,
    },
    appName: {
        fontSize: FontSize.xl,
        fontWeight: '800',
        color: Colors.light.primary,
    },
    appVersion: {
        fontSize: FontSize.sm,
        color: Colors.light.textSecondary,
        marginTop: 4,
    },
    appDesc: {
        fontSize: FontSize.sm,
        color: Colors.light.textTertiary,
        textAlign: 'center',
        marginTop: Spacing.md,
        lineHeight: 20,
    },
    dangerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.light.error + '40',
    },
    dangerText: {
        marginLeft: Spacing.md,
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.light.error,
    },
    watermark: {
        fontSize: 10,
        color: Colors.light.textTertiary,
        marginTop: Spacing.md,
        opacity: 0.4,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
});
