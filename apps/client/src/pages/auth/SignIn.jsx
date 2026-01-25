// src/home/SignIn.jsx
import Container from '@components/layout/container'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Box from '@mui/material/Box'
import { useNavigate } from 'react-router'
import background from '@assets/signin-background.png'
import { ContinueWithGoogle } from '@functions/googleLogin'
import { authApi } from '@functions/api/auth'
import { showToast } from '../../functions/toast'
import { useDispatch } from 'react-redux'
import { setUser } from '@store/features/user/userSlice'
import { useState } from 'react'

const SignIn = () => {

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const [userData, setUserData] = useState({
        email: undefined,
        password: undefined
    })


    const setState = (data) => {
        dispatch(setUser({
            uid: data.uid,
            displayName: data.displayName,
            email: data.email,
            role: data.role,
            photoURL: data?.photoURL
        }))
    }

    const googleLogin = async () => {
        const { user, error } = await ContinueWithGoogle()
        if (error) return

        const resp = await authApi.signIn(user.email, `a1@${user.uid}`)
        if (resp.error) return

        resp.data.photoURL = user?.photoURL || resp.data?.photoURL
        setState(resp.data)
        showToast('success', 'Login successfull', 'light')
        navigate('/dashboard')
    }

    const emailSignIn = async () => {
        if (!userData.email || !userData.password) showToast('error', 'Please fill in all fields', 'light')
        const { data, error } = await authApi.signIn(userData.email, userData.password)
        if (error) return
        showToast('success', 'Login successfull', 'light')
        setState(data)
        navigate('/dashboard')
    }

    return (
        <Container spacing={0}>
            <Grid container size={{ lg: 12, xs: 12, sm: 12 }} sx={styles.container}>
                {/* Left Side: Image + Overlay Text */}
                <Grid
                    container
                    size={{ lg: 6, xs: 12, sm: 12 }}
                    sx={styles.leftSide}
                >
                    <Box sx={styles.overlay}>
                        <Typography variant="h3" sx={styles.welcomeText}>
                            Welcome Back to Lokka
                        </Typography>
                        <Typography variant="body1" sx={styles.subtext}>
                            Manage your rental properties with ease and efficiency
                        </Typography>
                    </Box>
                </Grid>

                {/* Right Side: Form */}
                <Grid
                    container
                    size={{ lg: 6, xs: 12, sm: 12 }}
                    sx={styles.rightSide}
                >
                    <Box sx={styles.formContainer}>
                        <Typography variant="h5" sx={styles.title}>
                            Sign in to Lokka
                        </Typography>
                        <Typography variant="body2" sx={styles.subtitle}>
                            Welcome back! Please enter your details
                        </Typography>

                        <TextField
                            fullWidth
                            label="Email address"
                            variant="outlined"
                            placeholder="Enter your email"
                            onChange={(e) => { setUserData({ ...userData, email: e.target.value }) }}
                            sx={styles.input}
                        />

                        <TextField
                            fullWidth
                            label="Password"
                            variant="outlined"
                            type="password"
                            placeholder="Enter your password"
                            onChange={(e) => { setUserData({ ...userData, password: e.target.value }) }}
                            sx={styles.input}
                        />

                        <Box sx={styles.forgotPassword} onClick={() => navigate('/forgotPassword')}>
                            <Link href="" underline="hover" color="primary">
                                Forgot Password?
                            </Link>
                        </Box>

                        <Button
                            variant="contained"
                            fullWidth
                            sx={styles.signInButton}
                            onClick={emailSignIn}
                        >
                            Sign In
                        </Button>

                        <Box sx={styles.orDivider}>
                            <Typography variant="body2">OR</Typography>
                        </Box>

                        <Button
                            variant="outlined"
                            fullWidth
                            sx={styles.googleButton}
                            onClick={googleLogin}
                        >
                            Sign in with Google
                        </Button>

                        <Box sx={styles.registerLink}>
                            <Typography variant="body2">
                                Don’t have an account?{' '}
                                <Link href="#" underline="hover" color="primary" onClick={() => navigate('/signup')}>
                                    Register
                                </Link>
                            </Typography>
                        </Box>

                        <Typography variant="caption" sx={styles.footer}>
                            2025 Lokka • Simplify your property management
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
        </Container>
    );
};

export default SignIn;

const styles = {
    container: {
        height: '100vh',
        backgroundColor: '#f9f9f9',
    },
    leftSide: {
        backgroundImage: `linear-gradient(90deg,rgba(8, 22, 44, 0.6) 0%, rgba(8, 22, 44, 0.6) 50%, rgba(8, 22, 44, 0.9) 100%),url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        boxSizing: 'border-box',
    },
    overlay: {
        textAlign: 'center',
        color: 'white',
        maxWidth: '80%',
    },
    welcomeText: {
        fontSize: '2.5rem',
        fontWeight: 700,
        fontFamily: 'Inter, sans-serif',
        marginBottom: '16px',
    },
    subtext: {
        fontSize: '1rem',
        fontFamily: 'Inter, sans-serif',
        lineHeight: 1.5,
    },
    rightSide: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        boxSizing: 'border-box',
    },
    formContainer: {
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: 700,
        color: '#222',
        fontFamily: 'Inter, sans-serif',
        marginBottom: '4px',
    },
    subtitle: {
        fontSize: '0.875rem',
        color: '#7A7A7A',
        fontFamily: 'Inter, sans-serif',
        marginBottom: '24px',
    },
    input: {
        '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
        },
        '& .MuiInputLabel-root': {
            fontSize: '0.875rem',
            fontFamily: 'Inter, sans-serif',
        },
        '& .MuiInputBase-input': {
            fontSize: '0.875rem',
            fontFamily: 'Inter, sans-serif',
        },
    },
    forgotPassword: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '16px',
    },
    signInButton: {
        backgroundColor: '#4C6EF5',
        color: 'white',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        fontSize: '1rem',
        padding: '12px',
        borderRadius: '8px',
        '&:hover': {
            backgroundColor: '#3a5aeb',
        },
    },
    orDivider: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        my: 2,
        '&::before, &::after': {
            content: '""',
            flex: 1,
            height: '1px',
            backgroundColor: '#ccc',
        },
    },
    googleButton: {
        borderColor: '#ccc',
        color: '#222',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        fontSize: '1rem',
        padding: '12px',
        borderRadius: '8px',
        '&:hover': {
            borderColor: '#999',
            backgroundColor: '#f5f5f5',
        },
    },
    registerLink: {
        textAlign: 'center',
        marginTop: '16px',
    },
    footer: {
        textAlign: 'center',
        fontSize: '0.75rem',
        color: '#7A7A7A',
        fontFamily: 'Inter, sans-serif',
        marginTop: '24px',
    },
};