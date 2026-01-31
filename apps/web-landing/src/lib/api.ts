const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = {
    auth: {
        publicSignup: async (data: any) => {
            const response = await fetch(`${API_URL}/auth/public/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Registration failed');
            }

            return response.json();
        }
    }
};
