import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing } from '../constants/theme';

interface EmptyStateProps {
    icon: string;
    title: string;
    subtitle: string;
}

export default function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
    return (
        <View style={styles.container}>
            <MaterialCommunityIcons name={icon as any} size={64} color={Colors.light.textTertiary} />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xxxl,
        paddingVertical: 60,
    },
    title: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.light.textSecondary,
        marginTop: Spacing.lg,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: FontSize.sm,
        color: Colors.light.textTertiary,
        marginTop: Spacing.sm,
        textAlign: 'center',
        lineHeight: 20,
    },
});
