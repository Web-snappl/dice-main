// src/home/SignUp.jsx
import Container from '@components/layout/container'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Checkbox from '@mui/material/Checkbox'
import Box from '@mui/material/Box'
import background from '@assets/signin-background.png'
import { useNavigate } from 'react-router'
import { authApi } from '@functions/api/auth'
import { useState } from 'react'
import { showToast } from '@functions/toast'
import { useDispatch } from 'react-redux'
import { setUser } from '@store/features/user/userSlice'
import { ContinueWithGoogle } from '@functions/googleLogin'

const SignUp = () => {

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const [userData, setUserData] = useState({
        email: undefined,
        password: undefined,
        displayName: undefined,
        confirmPassword: undefined,
        role: undefined,
        termsAccepted: false
    })


    const createAccount = async () => {
        if (!userData.email || !userData.password || !userData.displayName || !userData.confirmPassword || !userData.role) showToast('error', 'Please fill in all fields', 'dark')
        const { data, error } = await authApi.signUp(userData.email, userData.password, userData.displayName, userData.role.toLowerCase())
        if (error) return
        showToast('success', 'Account created successfully! Please verify your email.', 'light')
        // set data in redux store
        dispatch(setUser(data))
        navigate('/dashboard')
    }

    const googleSignup = async () => {
        if (!userData.role || !userData.termsAccepted) {
            showToast('error', 'Please enter your role and accept terms of service', 'light')
            return
        }

        const { user, error } = await ContinueWithGoogle()
        if (error) return

        const resp = await authApi.signUp(user.email, `a1@${user.uid}`, user.displayName, userData.role.toLowerCase())
        if (resp.error) return

        dispatch(setUser({
            uid: resp.data.uid,
            displayName: resp.data.displayName,
            email: resp.data.email,
            role: resp.data.role,
            photoURL: user?.photoURL || resp.data?.photoURL
        }))

        showToast('success', 'Login successfull', 'light')
        navigate('/properties')
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
                            Start your Journey with Lokka
                        </Typography>
                        <Typography variant="body1" sx={styles.subtext}>
                            Join thousands of property managers who trust Lokka for their rental
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
                            Create your Lokka account
                        </Typography>
                        <Typography variant="body2" sx={styles.subtitle}>
                            Start managing your rental properties effortlessly
                        </Typography>

                        <TextField
                            fullWidth
                            label="Full Name"
                            variant="outlined"
                            placeholder="Enter your name"
                            onChange={(e) => { setUserData({ ...userData, displayName: e.target.value }) }}
                            sx={styles.input}
                        />

                        <TextField
                            fullWidth
                            label="Email Address"
                            variant="outlined"
                            placeholder="Enter your email address"
                            onChange={(e) => { setUserData({ ...userData, email: e.target.value }) }}
                            sx={styles.input}
                        />

                        <TextField
                            fullWidth
                            label="Password"
                            variant="outlined"
                            type="password"
                            placeholder="Create password"
                            onChange={(e) => { setUserData({ ...userData, password: e.target.value }) }}
                            sx={styles.input}
                        />

                        <TextField
                            fullWidth
                            label="Confirm Password"
                            variant="outlined"
                            type="password"
                            placeholder="Confirm your password"
                            onChange={(e) => { setUserData({ ...userData, confirmPassword: e.target.value }) }}

                            sx={styles.input}
                        />

                        <TextField
                            fullWidth
                            label="Role"
                            variant="outlined"
                            placeholder="Your role (Owner / Co-owner / Tenant)"
                            onChange={(e) => { setUserData({ ...userData, role: e.target.value }) }}
                            sx={styles.input}
                        />

                        <Box sx={styles.terms}>
                            <Checkbox onChange={() => {
                                setUserData({ ...userData, termsAccepted: userData.termsAccepted ? false : true })
                            }}
                            />
                            <Typography variant="body2">
                                I agree to the{' '}
                                <Link href="#" underline="hover" color="primary">
                                    Terms of Services
                                </Link>{' '}
                                and{' '}
                                <Link href="#" underline="hover" color="primary">
                                    Privacy Policy
                                </Link>
                            </Typography>
                        </Box>


                        <Button
                            variant="contained"
                            fullWidth
                            sx={styles.createAccountButton}
                            onClick={createAccount}
                        >
                            Create an account
                        </Button>

                        <Button
                            variant="outlined"
                            fullWidth
                            sx={styles.googleButton}
                            onClick={googleSignup}
                        >
                            Sign up with Google
                        </Button>

                        <Box sx={styles.signInLink}>
                            <Typography variant="body2">
                                Already have an account?{' '}
                                <Link href="#" underline="hover" color="primary" onClick={() => navigate('/signin')} >
                                    Sign In
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

export default SignUp;

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
    terms: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.875rem',
        color: '#555',
        fontFamily: 'Inter, sans-serif',
    },
    createAccountButton: {
        backgroundColor: '#7B5FFE', // Purple
        color: 'white',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        fontSize: '1rem',
        padding: '12px',
        borderRadius: '8px',
        '&:hover': {
            backgroundColor: '#6a4cd6',
        },
    },
    signInLink: {
        textAlign: 'center',
        marginTop: '16px',
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
    footer: {
        textAlign: 'center',
        fontSize: '0.75rem',
        color: '#7A7A7A',
        fontFamily: 'Inter, sans-serif',
        marginTop: '24px',
    },
};