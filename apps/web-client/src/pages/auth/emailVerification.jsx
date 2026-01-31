// src/home/ForgotPassword.jsx
import Container from '@components/layout/container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';

const EmailVerification = () => {
    return (
        <Container spacing={0}>
            <Grid container size={{ lg: 12, xs: 12, sm: 12 }} sx={styles.container}>
                <Grid size={{ xs: 12 }} sx={styles.formContainer}>
                    {/* Logo */}
                    <Typography variant="h5" align="center" sx={styles.logo}>
                        Lokka
                    </Typography>

                    {/* Title & Subtitle */}
                    <Typography variant="h4" align="center" sx={styles.title}>
                        Forgot Password
                    </Typography>
                    <Typography variant="body1" align="center" sx={styles.subtitle}>
                        Enter your email and we’ll send you a password reset link.
                    </Typography>

                    {/* Email Input */}
                    <TextField
                        fullWidth
                        label="Email address"
                        variant="outlined"
                        placeholder="Enter your email"
                        sx={styles.input}
                    />

                    {/* Sign In Button */}
                    <Button
                        variant="contained"
                        fullWidth
                        sx={styles.signInButton}
                        href="/signin"
                    >
                        Sign In
                    </Button>

                    {/* Back to Login */}
                    <Box sx={styles.backToLogin}>
                        <Link href="/signin" underline="hover" color="text.secondary">
                            Back to Login
                        </Link>
                    </Box>

                    {/* Security Note */}
                    <Box sx={styles.securityNote}>
                        <Typography variant="body2" sx={styles.securityText}>
                            For security reasons, we don’t indicate whether an email address is registered with us. If you have an account, you’ll receive a reset link.
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
        </Container>
    );
};

export default EmailVerification;

const styles = {
    container: {
        height: '100vh',
        backgroundColor: '#f9f9f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
    },
    formContainer: {
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '30px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    },
    logo: {
        fontSize: '2rem',
        fontWeight: 700,
        color: '#4C6EF5', // Blue Lokka logo
        fontFamily: 'Inter, sans-serif',
        mb: 2,
    },
    title: {
        fontSize: '1.8rem',
        fontWeight: 700,
        color: '#222',
        fontFamily: 'Inter, sans-serif',
        mb: 1,
    },
    subtitle: {
        fontSize: '1rem',
        color: '#7A7A7A',
        fontFamily: 'Inter, sans-serif',
        mb: 3,
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
    signInButton: {
        backgroundColor: '#B0D6ED', // Light blue
        color: '#222',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        fontSize: '1rem',
        padding: '12px',
        borderRadius: '8px',
        '&:hover': {
            backgroundColor: '#9fcdeb',
        },
    },
    backToLogin: {
        textAlign: 'center',
        mt: 2,
    },
    securityNote: {
        mt: 3,
        p: 2,
        backgroundColor: '#E6F2FF', // Light blue background
        borderRadius: '8px',
        borderLeft: '4px solid #4C6EF5',
    },
    securityText: {
        fontSize: '0.875rem',
        color: '#222',
        fontFamily: 'Inter, sans-serif',
        lineHeight: 1.5,
    },
};