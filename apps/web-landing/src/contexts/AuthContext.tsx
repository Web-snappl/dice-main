import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, User } from '../api/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (emailOrPhone: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check local storage for existing session
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Failed to parse user from local storage', e);
                localStorage.removeItem('user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (emailOrPhone: string, password: string) => {
        setIsLoading(true);
        try {
            const userData = await authApi.login(emailOrPhone, password);
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            toast.success('Successfully logged in');
        } catch (error: any) {
            console.error('Login failed', error);
            toast.error('Login failed: ' + (error.response?.data?.message || 'Invalid credentials'));
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        toast.info('Logged out');
    };

    const refreshUser = async () => {
        if (!user?.uid) return;
        try {
            const freshUser = await authApi.getUser(user.uid);
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
        } catch (error) {
            console.error('Failed to refresh user data', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, isAuthenticated: !!user, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
