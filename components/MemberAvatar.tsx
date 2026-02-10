import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, FontSize } from '../constants/theme';
import { getInitials } from '../utils/helpers';

interface MemberAvatarProps {
    name: string;
    color: string;
    size?: number;
}

export default function MemberAvatar({ name, color, size = 40 }: MemberAvatarProps) {
    return (
        <View
            style={[
                styles.avatar,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color + '20',
                    borderColor: color,
                },
            ]}
        >
            <Text
                style={[
                    styles.initials,
                    {
                        fontSize: size * 0.36,
                        color: color,
                    },
                ]}
            >
                {getInitials(name)}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    avatar: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    initials: {
        fontWeight: '700',
    },
});
