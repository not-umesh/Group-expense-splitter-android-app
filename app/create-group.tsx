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
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius, Shadows, GroupIcons } from '../constants/theme';
import { useStore } from '../store/useStore';
import MemberAvatar from '../components/MemberAvatar';
import { getMemberColor } from '../utils/helpers';
import { Group } from '../types';
import {
    validateGroupName,
    validateMemberName,
    validateMemberCount,
    sanitizeString,
    V_LIMITS,
} from '../utils/validation';
import { rateLimitCreate, getThrottleMessage } from '../utils/rateLimiter';

const CATEGORIES: { key: Group['category']; label: string }[] = [
    { key: 'trip', label: '✈️ Trip' },
    { key: 'roommates', label: '🏠 Roommates' },
    { key: 'dinner', label: '🍽️ Dinner' },
    { key: 'party', label: '🎉 Party' },
    { key: 'shopping', label: '🛒 Shopping' },
    { key: 'office', label: '💼 Office' },
    { key: 'custom', label: '⚙️ Custom' },
];

export default function CreateGroupScreen() {
    const router = useRouter();
    const { addGroup } = useStore();
    const [name, setName] = useState('');
    const [category, setCategory] = useState<Group['category']>('trip');
    const [memberName, setMemberName] = useState('');
    const [members, setMembers] = useState<string[]>(['You']);

    const handleAddMember = () => {
        const trimmed = sanitizeString(memberName);
        if (!trimmed) return;

        // Validate member name (schema-based)
        const nameCheck = validateMemberName(trimmed);
        if (!nameCheck.valid) {
            Alert.alert('Invalid Name', nameCheck.error);
            return;
        }

        // Validate member count limit
        const countCheck = validateMemberCount(members.length);
        if (!countCheck.valid) {
            Alert.alert('Limit Reached', countCheck.error);
            return;
        }

        // Reject duplicates (case-insensitive)
        if (members.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
            Alert.alert('Duplicate', 'This member already exists.');
            return;
        }

        setMembers([...members, trimmed]);
        setMemberName('');
    };

    const handleRemoveMember = (index: number) => {
        setMembers(members.filter((_, i) => i !== index));
    };

    const handleCreate = () => {
        // Rate limit check — prevents spam tapping
        const rateCheck = rateLimitCreate('group');
        if (!rateCheck.allowed) {
            Alert.alert('Hold On', getThrottleMessage(rateCheck.retryAfterMs));
            return;
        }

        // Validate group name
        const nameCheck = validateGroupName(name);
        if (!nameCheck.valid) {
            Alert.alert('Error', nameCheck.error);
            return;
        }

        if (members.length < 2) {
            Alert.alert('Error', 'Add at least 2 members to the group.');
            return;
        }

        const groupId = addGroup(sanitizeString(name), category, members);
        if (!groupId) {
            Alert.alert('Error', 'Could not create group. You may have reached the limit.');
            return;
        }
        router.replace(`/group/${groupId}`);
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
                    <Text style={styles.title}>New Group</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Group Name — maxLength enforced */}
                <View style={styles.section}>
                    <Text style={styles.label}>Group Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Goa Trip 2025"
                        placeholderTextColor={Colors.light.textTertiary}
                        value={name}
                        onChangeText={setName}
                        maxLength={V_LIMITS.GROUP_NAME_MAX}
                        autoFocus
                    />
                </View>

                {/* Category Picker */}
                <View style={styles.section}>
                    <Text style={styles.label}>Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.categoryRow}>
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat.key}
                                    style={[
                                        styles.categoryChip,
                                        category === cat.key && styles.categoryChipActive,
                                    ]}
                                    onPress={() => setCategory(cat.key)}
                                >
                                    <Text
                                        style={[
                                            styles.categoryText,
                                            category === cat.key && styles.categoryTextActive,
                                        ]}
                                    >
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                {/* Members */}
                <View style={styles.section}>
                    <Text style={styles.label}>Members ({members.length}/{V_LIMITS.MEMBERS_MAX})</Text>
                    <View style={styles.membersList}>
                        {members.map((m, i) => (
                            <View key={i} style={styles.memberChip}>
                                <MemberAvatar name={m} color={getMemberColor(i)} size={28} />
                                <Text style={styles.memberChipName}>{m}</Text>
                                {i > 0 && (
                                    <TouchableOpacity onPress={() => handleRemoveMember(i)}>
                                        <MaterialCommunityIcons name="close-circle" size={18} color={Colors.light.textTertiary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </View>

                    <View style={styles.addMemberRow}>
                        <TextInput
                            style={styles.memberInput}
                            placeholder="Add member name"
                            placeholderTextColor={Colors.light.textTertiary}
                            value={memberName}
                            onChangeText={setMemberName}
                            onSubmitEditing={handleAddMember}
                            returnKeyType="done"
                            maxLength={V_LIMITS.MEMBER_NAME_MAX}
                        />
                        <TouchableOpacity style={styles.addBtn} onPress={handleAddMember}>
                            <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Create Button */}
                <TouchableOpacity onPress={handleCreate} style={styles.createBtnWrapper} activeOpacity={0.8}>
                    <LinearGradient
                        colors={[Colors.light.primary, '#5A52E0']}
                        style={styles.createBtn}
                    >
                        <MaterialCommunityIcons name="check" size={22} color="#FFF" />
                        <Text style={styles.createBtnText}>Create Group</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* </UV> */}
                <Text style={styles.watermark}>{'</UV>'} {'//'} git commit -m "first blood"</Text>

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
    section: {
        paddingHorizontal: Spacing.lg,
        marginTop: Spacing.xl,
    },
    label: {
        fontSize: FontSize.sm,
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
        fontSize: FontSize.md,
        color: Colors.light.text,
        ...Shadows.sm,
    },
    categoryRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    categoryChip: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.round,
        backgroundColor: Colors.light.surface,
        ...Shadows.sm,
    },
    categoryChipActive: {
        backgroundColor: Colors.light.primary,
    },
    categoryText: {
        fontSize: FontSize.sm,
        color: Colors.light.text,
        fontWeight: '600',
    },
    categoryTextActive: {
        color: '#FFF',
    },
    membersList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    memberChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.round,
        paddingRight: Spacing.md,
        paddingLeft: 4,
        paddingVertical: 4,
        gap: Spacing.xs,
        ...Shadows.sm,
    },
    memberChipName: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.light.text,
    },
    addMemberRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    memberInput: {
        flex: 1,
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: FontSize.sm,
        color: Colors.light.text,
        ...Shadows.sm,
    },
    addBtn: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.light.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.sm,
    },
    createBtnWrapper: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.xxxl,
    },
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.lg,
        gap: Spacing.sm,
    },
    createBtnText: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: '#FFF',
    },
    watermark: {
        textAlign: 'center',
        fontSize: 10,
        color: Colors.light.textTertiary,
        marginTop: Spacing.md,
        opacity: 0.5,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
});
