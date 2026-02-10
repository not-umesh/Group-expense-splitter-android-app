import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../../../constants/theme';
import { useStore } from '../../../store/useStore';
import MemberAvatar from '../../../components/MemberAvatar';
import { formatCurrency } from '../../../utils/helpers';

export default function SettleScreen() {
    const { id, fromId, toId, amount: amountStr } = useLocalSearchParams<{
        id: string;
        fromId: string;
        toId: string;
        amount: string;
    }>();
    const router = useRouter();
    const { getGroup, addSettlement, currency } = useStore();

    const group = getGroup(id);
    if (!group) return null;

    const fromMember = group.members.find((m) => m.id === fromId);
    const toMember = group.members.find((m) => m.id === toId);
    const amount = parseFloat(amountStr || '0');

    const handleSettle = () => {
        Alert.alert(
            'Confirm Settlement',
            `${fromMember?.name} pays ${formatCurrency(amount, currency)} to ${toMember?.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: () => {
                        addSettlement(id, fromId, toId, amount);
                        router.back();
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.light.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Settle Up</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Settlement Card */}
            <View style={styles.settlementCard}>
                <View style={styles.personSection}>
                    <MemberAvatar name={fromMember?.name || ''} color={fromMember?.color || '#999'} size={64} />
                    <Text style={styles.personName}>{fromMember?.name}</Text>
                    <Text style={styles.personRole}>Pays</Text>
                </View>

                <View style={styles.arrowContainer}>
                    <MaterialCommunityIcons name="arrow-right-bold" size={32} color={Colors.light.primary} />
                    <Text style={styles.settleAmount}>{formatCurrency(amount, currency)}</Text>
                </View>

                <View style={styles.personSection}>
                    <MemberAvatar name={toMember?.name || ''} color={toMember?.color || '#999'} size={64} />
                    <Text style={styles.personName}>{toMember?.name}</Text>
                    <Text style={styles.personRole}>Receives</Text>
                </View>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity onPress={handleSettle} style={styles.confirmWrapper} activeOpacity={0.8}>
                <LinearGradient
                    colors={[Colors.light.success, '#00A876']}
                    style={styles.confirmBtn}
                >
                    <MaterialCommunityIcons name="handshake" size={24} color="#FFF" />
                    <Text style={styles.confirmText}>Mark as Settled</Text>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingTop: 60,
        paddingBottom: Spacing.lg,
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
    title: {
        fontSize: FontSize.xl,
        fontWeight: '800',
        color: Colors.light.text,
    },
    settlementCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.xxxl,
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        ...Shadows.md,
    },
    personSection: {
        flex: 1,
        alignItems: 'center',
    },
    personName: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.light.text,
        marginTop: Spacing.sm,
        textAlign: 'center',
    },
    personRole: {
        fontSize: FontSize.xs,
        color: Colors.light.textSecondary,
        marginTop: 2,
    },
    arrowContainer: {
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
    },
    settleAmount: {
        fontSize: FontSize.lg,
        fontWeight: '800',
        color: Colors.light.primary,
        marginTop: Spacing.xs,
    },
    confirmWrapper: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.xxxl,
    },
    confirmBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.lg,
        gap: Spacing.sm,
    },
    confirmText: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: '#FFF',
    },
});
