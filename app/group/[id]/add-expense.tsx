import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius, Shadows, ExpenseCategories } from '../../../constants/theme';
import { useStore } from '../../../store/useStore';
import MemberAvatar from '../../../components/MemberAvatar';
import {
    validateDescription,
    validateAmount,
    sanitizeString,
    V_LIMITS,
} from '../../../utils/validation';
import { rateLimitCreate, getThrottleMessage } from '../../../utils/rateLimiter';

export default function AddExpenseScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { getGroup, addExpense, currency } = useStore();

    const group = getGroup(id);
    if (!group) return null;

    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('food');
    const [paidById, setPaidById] = useState(group.members[0]?.id || '');
    const [splitType, setSplitType] = useState<'equal' | 'unequal'>('equal');
    const [selectedMembers, setSelectedMembers] = useState<string[]>(
        group.members.map((m) => m.id)
    );
    const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

    const toggleMember = (memberId: string) => {
        if (selectedMembers.includes(memberId)) {
            if (selectedMembers.length > 1) {
                setSelectedMembers(selectedMembers.filter((id) => id !== memberId));
            }
        } else {
            setSelectedMembers([...selectedMembers, memberId]);
        }
    };

    const handleSave = async () => {
        // Rate limit — prevents spam tapping
        const rateCheck = rateLimitCreate('expense');
        if (!rateCheck.allowed) {
            Alert.alert('Hold On', getThrottleMessage(rateCheck.retryAfterMs));
            return;
        }

        // Validate description (schema-based)
        const descCheck = validateDescription(description);
        if (!descCheck.valid) {
            Alert.alert('Error', descCheck.error);
            return;
        }

        // Validate amount (schema-based)
        const amountCheck = validateAmount(amount);
        if (!amountCheck.valid) {
            Alert.alert('Error', amountCheck.error);
            return;
        }

        const amountNum = parseFloat(amount);

        if (selectedMembers.length === 0) {
            Alert.alert('Error', 'Select at least one member.');
            return;
        }

        let splits;
        if (splitType === 'equal') {
            const perPerson = Math.round((amountNum / selectedMembers.length) * 100) / 100;
            splits = selectedMembers.map((memberId) => ({
                memberId,
                amount: perPerson,
            }));
        } else {
            // Unequal split — validate each custom amount
            splits = selectedMembers.map((memberId) => ({
                memberId,
                amount: parseFloat(customAmounts[memberId] || '0'),
            }));
            const total = splits.reduce((s, sp) => s + sp.amount, 0);
            if (Math.abs(total - amountNum) > 0.5) {
                Alert.alert(
                    'Split Mismatch',
                    `Individual amounts (${currency}${total.toFixed(2)}) don't add up to total (${currency}${amountNum.toFixed(2)}).`
                );
                return;
            }
        }

        const success = await addExpense({
            groupId: id,
            description: sanitizeString(description),
            amount: amountNum,
            paidById,
            category,
            splitType,
            splits,
            date: new Date().toISOString(),
        });

        if (!success) {
            Alert.alert('Error', 'Could not add expense. You may have reached the limit.');
            return;
        }

        router.back();
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.light.text} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Add Expense</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Amount — maxLength prevents absurd input */}
                <View style={styles.amountCard}>
                    <Text style={styles.currencySign}>{currency}</Text>
                    <TextInput
                        style={styles.amountInput}
                        placeholder="0.00"
                        placeholderTextColor={Colors.light.textTertiary}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="decimal-pad"
                        maxLength={12}
                        autoFocus
                    />
                </View>

                {/* Description — maxLength enforced */}
                <View style={styles.section}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="What was this expense for?"
                        placeholderTextColor={Colors.light.textTertiary}
                        value={description}
                        onChangeText={setDescription}
                        maxLength={V_LIMITS.DESCRIPTION_MAX}
                    />
                </View>

                {/* Category */}
                <View style={styles.section}>
                    <Text style={styles.label}>Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.chipRow}>
                            {ExpenseCategories.map((cat) => (
                                <TouchableOpacity
                                    key={cat.key}
                                    style={[
                                        styles.catChip,
                                        category === cat.key && { backgroundColor: cat.color },
                                    ]}
                                    onPress={() => setCategory(cat.key)}
                                >
                                    <MaterialCommunityIcons
                                        name={cat.icon as any}
                                        size={16}
                                        color={category === cat.key ? '#FFF' : cat.color}
                                    />
                                    <Text
                                        style={[
                                            styles.catChipText,
                                            category === cat.key && { color: '#FFF' },
                                        ]}
                                    >
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                {/* Paid By */}
                <View style={styles.section}>
                    <Text style={styles.label}>Paid By</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.chipRow}>
                            {group.members.map((m) => (
                                <TouchableOpacity
                                    key={m.id}
                                    style={[
                                        styles.payerChip,
                                        paidById === m.id && { backgroundColor: m.color },
                                    ]}
                                    onPress={() => setPaidById(m.id)}
                                >
                                    <MemberAvatar name={m.name} color={paidById === m.id ? '#FFF' : m.color} size={24} />
                                    <Text
                                        style={[
                                            styles.payerChipText,
                                            paidById === m.id && { color: '#FFF' },
                                        ]}
                                    >
                                        {m.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                {/* Split Type */}
                <View style={styles.section}>
                    <Text style={styles.label}>Split Type</Text>
                    <View style={styles.splitToggle}>
                        <TouchableOpacity
                            style={[styles.splitOption, splitType === 'equal' && styles.splitOptionActive]}
                            onPress={() => setSplitType('equal')}
                        >
                            <MaterialCommunityIcons
                                name="equal"
                                size={18}
                                color={splitType === 'equal' ? '#FFF' : Colors.light.textSecondary}
                            />
                            <Text style={[styles.splitText, splitType === 'equal' && styles.splitTextActive]}>
                                Equal
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.splitOption, splitType === 'unequal' && styles.splitOptionActive]}
                            onPress={() => setSplitType('unequal')}
                        >
                            <MaterialCommunityIcons
                                name="tune-variant"
                                size={18}
                                color={splitType === 'unequal' ? '#FFF' : Colors.light.textSecondary}
                            />
                            <Text style={[styles.splitText, splitType === 'unequal' && styles.splitTextActive]}>
                                Unequal
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Split Among */}
                <View style={styles.section}>
                    <Text style={styles.label}>Split Among</Text>
                    {group.members.map((m) => {
                        const isSelected = selectedMembers.includes(m.id);
                        const perPerson = isSelected && splitType === 'equal' && amount
                            ? (parseFloat(amount) / selectedMembers.length).toFixed(2)
                            : '';
                        return (
                            <TouchableOpacity
                                key={m.id}
                                style={[styles.memberRow, isSelected && styles.memberRowActive]}
                                onPress={() => toggleMember(m.id)}
                            >
                                <View style={styles.memberCheckbox}>
                                    <MaterialCommunityIcons
                                        name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                        size={22}
                                        color={isSelected ? Colors.light.primary : Colors.light.textTertiary}
                                    />
                                </View>
                                <MemberAvatar name={m.name} color={m.color} size={32} />
                                <Text style={styles.memberRowName}>{m.name}</Text>
                                {splitType === 'unequal' && isSelected ? (
                                    <TextInput
                                        style={styles.customAmountInput}
                                        placeholder="0.00"
                                        placeholderTextColor={Colors.light.textTertiary}
                                        keyboardType="decimal-pad"
                                        maxLength={12}
                                        value={customAmounts[m.id] || ''}
                                        onChangeText={(val) =>
                                            setCustomAmounts({ ...customAmounts, [m.id]: val })
                                        }
                                    />
                                ) : (
                                    perPerson ? (
                                        <Text style={styles.perPersonAmount}>{currency}{perPerson}</Text>
                                    ) : null
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Save Button */}
                <TouchableOpacity onPress={handleSave} style={styles.saveBtnWrapper} activeOpacity={0.8}>
                    <LinearGradient
                        colors={[Colors.light.primary, '#5A52E0']}
                        style={styles.saveBtn}
                    >
                        <MaterialCommunityIcons name="check" size={22} color="#FFF" />
                        <Text style={styles.saveBtnText}>Save Expense</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </KeyboardAvoidingView>
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
    title: {
        fontSize: FontSize.xl,
        fontWeight: '800',
        color: Colors.light.text,
    },
    amountCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xl,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.xl,
        ...Shadows.md,
    },
    currencySign: {
        fontSize: FontSize.xxl,
        fontWeight: '800',
        color: Colors.light.primary,
    },
    amountInput: {
        fontSize: FontSize.hero,
        fontWeight: '800',
        color: Colors.light.text,
        minWidth: 100,
        textAlign: 'center',
    },
    section: {
        paddingHorizontal: Spacing.lg,
        marginTop: Spacing.xl,
    },
    label: {
        fontSize: FontSize.xs,
        fontWeight: '700',
        color: Colors.light.textSecondary,
        marginBottom: Spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        fontSize: FontSize.sm,
        color: Colors.light.text,
        ...Shadows.sm,
    },
    chipRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    catChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.round,
        backgroundColor: Colors.light.surface,
        ...Shadows.sm,
    },
    catChipText: {
        fontSize: FontSize.xs,
        fontWeight: '600',
        color: Colors.light.text,
    },
    payerChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: BorderRadius.round,
        backgroundColor: Colors.light.surface,
        ...Shadows.sm,
    },
    payerChipText: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.light.text,
    },
    splitToggle: {
        flexDirection: 'row',
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.lg,
        padding: 4,
        ...Shadows.sm,
    },
    splitOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: 6,
    },
    splitOptionActive: {
        backgroundColor: Colors.light.primary,
    },
    splitText: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.light.textSecondary,
    },
    splitTextActive: {
        color: '#FFF',
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        gap: Spacing.sm,
        ...Shadows.sm,
    },
    memberRowActive: {
        borderLeftWidth: 3,
        borderLeftColor: Colors.light.primary,
    },
    memberCheckbox: {
        marginRight: 4,
    },
    memberRowName: {
        flex: 1,
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.light.text,
    },
    perPersonAmount: {
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: Colors.light.primary,
    },
    customAmountInput: {
        width: 80,
        textAlign: 'right',
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: Colors.light.primary,
        backgroundColor: Colors.light.surfaceElevated,
        borderRadius: BorderRadius.sm,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
    },
    saveBtnWrapper: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.xxxl,
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.lg,
        gap: Spacing.sm,
    },
    saveBtnText: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: '#FFF',
    },
});
