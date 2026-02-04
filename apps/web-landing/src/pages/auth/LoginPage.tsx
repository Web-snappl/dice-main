import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            await login(email, password);
            navigate('/dashboard/wallet'); // Redirect directly to wallet as requested context implies it's the main feature
        } catch (error) {
            // toast handled in auth context
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-500/10 via-neutral-900/50 to-neutral-950">
            <Card className="w-full max-w-md backdrop-blur-sm bg-neutral-950 border-red-600/50 shadow-xl shadow-red-900/20">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center text-white">Welcome back</CardTitle>
                    <CardDescription className="text-center text-neutral-400">
                        Enter your credentials to access your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-neutral-300">Email or Phone Number</Label>
                            <Input
                                id="email"
                                type="text"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                className="bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-red-500 focus:ring-red-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-neutral-300">Password</Label>
                                <Link
                                    to="#"
                                    className="text-sm font-medium text-red-500 hover:text-red-400"
                                    onClick={(e) => { e.preventDefault(); toast.info('Please use the mobile app to reset your password.'); }}
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                className="bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-red-500 focus:ring-red-500"
                            />
                        </div>
                        <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 text-center text-sm text-neutral-400">
                    <div>
                        Don't have an account?{' '}
                        <Link to="/" className="font-medium text-red-500 hover:text-red-400">
                            Download the app to register
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
