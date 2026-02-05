// API client using native fetch - no external dependencies needed
const API_SECRET = 'quJTa6SEDnn4tSlA';
const API_BASE_URL = '/api';

interface LoginParams {
    email?: string;
    phoneNumber?: string;
    password: string;
}

export interface User {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    role: string;
    balance?: number;
    stripeAccountId?: string;
    isStripeConnected?: boolean;
}

const apiClient = {
    async login(params: LoginParams): Promise<User> {
        const queryParams = new URLSearchParams();

        if (params.email) {
            queryParams.append('email', params.email);
        }
        if (params.phoneNumber) {
            queryParams.append('phoneNumber', params.phoneNumber);
        }
        queryParams.append('password', params.password);

        const response = await fetch(`${API_BASE_URL}/auth/login?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': API_SECRET,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Login failed');
        }

        const data = await response.json();
        // Backend returns { accessToken, refreshToken, user: {...} }
        // Extract user object which contains the balance
        return data.user || data;
    },

    async getUserTransactions(uid: string): Promise<any[]> {
        const response = await fetch(`${API_BASE_URL}/transactions/user/${uid}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': API_SECRET,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error('Failed to fetch transactions');
            return [];
        }

        return response.json();
    },

    async getUser(uid: string): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/users/${uid}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': API_SECRET,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user');
        }

        return response.json();
    },

    stripe: {
        async onboard(uid: string, returnUrl: string, refreshUrl: string) {
            const response = await fetch(`${API_BASE_URL}/stripe/onboard`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': API_SECRET,
                },
                body: JSON.stringify({ uid, returnUrl, refreshUrl }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to start onboarding');
            }
            return response.json();
        },

        async getStatus(uid: string) {
            const response = await fetch(`${API_BASE_URL}/stripe/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': API_SECRET,
                },
                body: JSON.stringify({ uid }),
            });
            if (!response.ok) throw new Error('Failed to get status');
            return response.json();
        },

        async withdraw(uid: string, amount: number) {
            const response = await fetch(`${API_BASE_URL}/stripe/withdraw`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': API_SECRET,
                },
                body: JSON.stringify({ uid, amount }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Withdrawal failed');
            return data;
        }
    }
};

// Export authApi for compatibility with AuthContext
export const authApi = {
    async login(emailOrPhone: string, password: string): Promise<User> {
        // Determine if input is email or phone based on @ symbol
        const isEmail = emailOrPhone.includes('@');
        return apiClient.login({
            email: isEmail ? emailOrPhone : undefined,
            phoneNumber: isEmail ? undefined : emailOrPhone,
            password
        });
    },
    async getUser(uid: string): Promise<User> {
        return apiClient.getUser(uid);
    },
    async getUserTransactions(uid: string): Promise<any[]> {
        return apiClient.getUserTransactions(uid);
    }
};

export const stripeApi = apiClient.stripe;
