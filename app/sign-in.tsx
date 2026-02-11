/**
 * Sign In Screen — Premium glassmorphism design with animated gradient header.
 *
 * </UV>
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '../constants/theme';
import { rateLimitCreate, getThrottleMessage } from '../utils/rateLimiter';

export default function SignInScreen() {
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isFormValid = email.trim().length > 0 && password.length >= 6;

    const handleSignIn = async () => {
        if (!isFormValid || loading) return;

        const rateCheck = rateLimitCreate('signIn');
        if (!rateCheck.allowed) {
            setError(getThrottleMessage(rateCheck.retryAfterMs));
            return;
        }

        setError('');
        setLoading(true);

        const { error: signInError } = await signIn(email.trim(), password);

        if (signInError) {
            setError(signInError);
        }

        setLoading(false);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Gradient Header */}
                <LinearGradient
                    colors={['#6C63FF', '#8B83FF', '#A5A0FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <View style={styles.logoContainer}>
                        <View style={styles.logoCircle}>
                            <MaterialCommunityIcons name="wallet-outline" size={40} color="#6C63FF" />
                        </View>
                    </View>
                    <Text style={styles.appName}>Split & Settle</Text>
                    <Text style={styles.tagline}>Split smarter, settle faster</Text>
                </LinearGradient>

                {/* Form Card */}
                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>Welcome Back</Text>
                    <Text style={styles.formSubtitle}>Sign in to your account</Text>

                    {error ? (
                        <View style={styles.errorBox}>
                            <MaterialCommunityIcons name="alert-circle" size={16} color={Colors.light.error} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {/* Email */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Email</Text>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons
                                name="email-outline"
                                size={20}
                                color={Colors.light.textTertiary}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="you@example.com"
                                placeholderTextColor={Colors.light.textTertiary}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                maxLength={100}
                            />
                        </View>
                    </View>

                    {/* Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Password</Text>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons
                                name="lock-outline"
                                size={20}
                                color={Colors.light.textTertiary}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="••••••••"
                                placeholderTextColor={Colors.light.textTertiary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                maxLength={72}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeButton}
                            >
                                <MaterialCommunityIcons
                                    name={showPassword ? 'eye-off' : 'eye'}
                                    size={20}
                                    color={Colors.light.textTertiary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Sign In Button */}
                    <TouchableOpacity
                        style={[styles.button, !isFormValid && styles.buttonDisabled]}
                        onPress={handleSignIn}
                        disabled={!isFormValid || loading}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={isFormValid ? ['#6C63FF', '#8B83FF'] : ['#D1D5DB', '#D1D5DB']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.buttonGradient}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <Text style={styles.buttonText}>Sign In</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Sign Up Link */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => router.replace('/sign-up')}>
                            <Text style={styles.footerLink}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        paddingTop: 80,
        paddingBottom: 50,
        alignItems: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    logoContainer: {
        marginBottom: Spacing.lg,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.lg,
    },
    appName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    tagline: {
        fontSize: FontSize.sm,
        color: 'rgba(255,255,255,0.8)',
        marginTop: Spacing.xs,
    },
    formCard: {
        marginTop: -24,
        marginHorizontal: Spacing.xl,
        backgroundColor: Colors.light.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xxl,
        ...Shadows.lg,
    },
    formTitle: {
        fontSize: FontSize.xl,
        fontWeight: '700',
        color: Colors.light.text,
        textAlign: 'center',
    },
    formSubtitle: {
        fontSize: FontSize.sm,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginTop: Spacing.xs,
        marginBottom: Spacing.xxl,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderRadius: BorderRadius.sm,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
        gap: Spacing.sm,
    },
    errorText: {
        fontSize: FontSize.xs,
        color: Colors.light.error,
        flex: 1,
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    inputLabel: {
        fontSize: FontSize.xs,
        fontWeight: '600',
        color: Colors.light.textSecondary,
        marginBottom: Spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.surfaceElevated,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.light.border,
        paddingHorizontal: Spacing.md,
    },
    inputIcon: {
        marginRight: Spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: FontSize.md,
        color: Colors.light.text,
        paddingVertical: 14,
    },
    eyeButton: {
        padding: Spacing.sm,
    },
    button: {
        marginTop: Spacing.lg,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        ...Shadows.md,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.md,
    },
    buttonText: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.xxl,
        paddingBottom: Spacing.sm,
    },
    footerText: {
        fontSize: FontSize.sm,
        color: Colors.light.textSecondary,
    },
    footerLink: {
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: Colors.light.primary,
    },
});
