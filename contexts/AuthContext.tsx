/**
 * AuthContext — Global authentication state management.
 *
 * Wraps the app in <AuthProvider>, exposes session/user/profile + auth methods.
 * Subscribes to onAuthStateChange for automatic session tracking.
 *
 * </UV>
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';

interface Profile {
    id: string;
    display_name: string;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch user profile from profiles table
    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, display_name')
                .eq('id', userId)
                .single();

            if (!error && data) {
                setProfile(data);
            }
        } catch {
            // Profile fetch failed silently — non-critical
        }
    };

    useEffect(() => {
        // Get initial session with error handling and timeout
        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
                if (session?.user) {
                    await fetchProfile(session.user.id);
                    await useStore.getState().hydrate();
                }
            } catch (err) {
                // Session fetch failed — proceed as unauthenticated
                console.warn('Auth init error:', err);
            } finally {
                setLoading(false);
            }
        };

        initSession();

        // Safety timeout in case Supabase hangs
        const timeout = setTimeout(() => {
            setLoading(false);
        }, 5000);

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setSession(session);
                if (session?.user) {
                    await fetchProfile(session.user.id);
                    await useStore.getState().hydrate();
                } else {
                    setProfile(null);
                    useStore.getState().clearLocal();
                }
            }
        );

        return () => {
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
    };

    const signUp = async (email: string, password: string, displayName: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { display_name: displayName },
            },
        });
        return { error: error?.message ?? null };
    };

    const signOut = async () => {
        useStore.getState().clearLocal();
        await supabase.auth.signOut();
        setProfile(null);
    };

    return (
        <AuthContext.Provider
            value={{
                session,
                user: session?.user ?? null,
                profile,
                loading,
                signIn,
                signUp,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
