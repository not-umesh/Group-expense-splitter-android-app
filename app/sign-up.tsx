/**
 * Sign Up Screen — Premium design matching sign-in, with password strength indicator.
 *
 * </UV>
 */

import React, { useState, useMemo } from 'react';
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

// Password strength calculator
function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { level: 1, label: 'Weak', color: Colors.light.error };
    if (score <= 2) return { level: 2, label: 'Fair', color: Colors.light.warning };
    if (score <= 3) return { level: 3, label: 'Good', color: '#FFAA00' };
    if (score <= 4) return { level: 4, label: 'Strong', color: Colors.light.success };
    return { level: 5, label: 'Excellent', color: '#00C48C' };
}

export default function SignUpScreen() {
    const { signUp } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

    const isFormValid =
        displayName.trim().length >= 2 &&
        email.trim().length > 0 &&
        password.length >= 6 &&
        password === confirmPassword;

    const handleSignUp = async () => {
        if (!isFormValid || loading) return;

        const rateCheck = rateLimitCreate('signUp');
        if (!rateCheck.allowed) {
            setError(getThrottleMessage(rateCheck.retryAfterMs));
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setError('');
        setLoading(true);

        const { error: signUpError } = await signUp(email.trim(), password, displayName.trim());

        if (signUpError) {
            setError(signUpError);
        } else {
            setSuccess(true);
        }

        setLoading(false);
    };

    if (success) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={['#6C63FF', '#8B83FF', '#A5A0FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.successContainer}
                >
                    <View style={styles.successCircle}>
                        <MaterialCommunityIcons name="check" size={48} color={Colors.light.success} />
                    </View>
                    <Text style={styles.successTitle}>Account Created!</Text>
                    <Text style={styles.successText}>
                        Check your email for a confirmation link, then sign in.
                    </Text>
                    <TouchableOpacity
                        style={styles.successButton}
                        onPress={() => router.replace('/sign-in')}
                    >
                        <Text style={styles.successButtonText}>Go to Sign In</Text>
                    </TouchableOpacity>
                </LinearGradient>
            </View>
        );
    }

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
                            <MaterialCommunityIcons name="account-plus-outline" size={40} color="#6C63FF" />
                        </View>
                    </View>
                    <Text style={styles.appName}>Join Split & Settle</Text>
                    <Text style={styles.tagline}>Create your free account</Text>
                </LinearGradient>

                {/* Form Card */}
                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>Create Account</Text>
                    <Text style={styles.formSubtitle}>Fill in your details below</Text>

                    {error ? (
                        <View style={styles.errorBox}>
                            <MaterialCommunityIcons name="alert-circle" size={16} color={Colors.light.error} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {/* Display Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Display Name</Text>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons
                                name="account-outline"
                                size={20}
                                color={Colors.light.textTertiary}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="John Doe"
                                placeholderTextColor={Colors.light.textTertiary}
                                value={displayName}
                                onChangeText={setDisplayName}
                                autoCapitalize="words"
                                maxLength={30}
                            />
                        </View>
                    </View>

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
                                placeholder="Min 6 characters"
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

                        {/* Password Strength */}
                        {password.length > 0 && (
                            <View style={styles.strengthRow}>
                                <View style={styles.strengthBarContainer}>
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.strengthBarSegment,
                                                {
                                                    backgroundColor:
                                                        i <= passwordStrength.level
                                                            ? passwordStrength.color
                                                            : Colors.light.border,
                                                },
                                            ]}
                                        />
                                    ))}
                                </View>
                                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                                    {passwordStrength.label}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Confirm Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Confirm Password</Text>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons
                                name="lock-check-outline"
                                size={20}
                                color={Colors.light.textTertiary}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Re-enter password"
                                placeholderTextColor={Colors.light.textTertiary}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showPassword}
                                maxLength={72}
                            />
                            {confirmPassword.length > 0 && (
                                <MaterialCommunityIcons
                                    name={password === confirmPassword ? 'check-circle' : 'close-circle'}
                                    size={20}
                                    color={
                                        password === confirmPassword ? Colors.light.success : Colors.light.error
                                    }
                                    style={{ marginLeft: Spacing.sm }}
                                />
                            )}
                        </View>
                    </View>

                    {/* Sign Up Button */}
                    <TouchableOpacity
                        style={[styles.button, !isFormValid && styles.buttonDisabled]}
                        onPress={handleSignUp}
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
                                <Text style={styles.buttonText}>Create Account</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Sign In Link */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.replace('/sign-in')}>
                            <Text style={styles.footerLink}>Sign In</Text>
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
        paddingBottom: 40,
    },
    header: {
        paddingTop: 60,
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
        fontSize: 26,
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
    strengthRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.sm,
        gap: Spacing.sm,
    },
    strengthBarContainer: {
        flexDirection: 'row',
        flex: 1,
        gap: 3,
    },
    strengthBarSegment: {
        flex: 1,
        height: 4,
        borderRadius: 2,
    },
    strengthLabel: {
        fontSize: FontSize.xs,
        fontWeight: '600',
        width: 60,
        textAlign: 'right',
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
    // Success state
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xxxl,
    },
    successCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xxl,
        ...Shadows.lg,
    },
    successTitle: {
        fontSize: FontSize.xxl,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: Spacing.md,
    },
    successText: {
        fontSize: FontSize.md,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: Spacing.xxxl,
    },
    successButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: BorderRadius.md,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    successButtonText: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: '#FFF',
    },
});
