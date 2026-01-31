// src/home/HeroMobile.jsx
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import stars from '@assets/rating-stars.png';
import blueResidency from '@assets/blue-residence.png';
import cover from '@assets/hero-image.png';
import { flexStyles } from '../../theme/flexStyles';
import { useNavigate } from 'react-router'

const HeroMobile = () => {

    const navigate = useNavigate()

    return (
        <Grid
            container
            size={{ xs: 12 }}
            sx={styles.wrapper}
        >
            {/* Text Content */}
            <Grid size={{ xs: 12 }} sx={styles.content}>
                <Typography variant="h3" sx={styles.headline}>
                    Live Comfortably
                </Typography>
                <Typography variant="h4" sx={styles.subtitle}>
                    with a Stunning View
                </Typography>
                <Button variant="contained" sx={styles.button}>
                    Discover Who We Are
                </Button>
            </Grid>

            {/* Rating & Blue Residency Card */}
            <Grid size={{ xs: 12 }} sx={styles.bottomSection}>
                <Box sx={styles.rating}>
                    <img src={stars} alt="5 Star Rating" style={styles.stars} />
                    <Typography variant="caption" sx={styles.ratingText}>
                        5 Star Rating
                    </Typography>
                </Box>

                <Grid container size={{ xs: 12 }} sx={flexStyles.center} >
                    <img
                        src={blueResidency}
                        alt="Blue Residency"
                        style={styles.residencyImage}
                    />
                </Grid>

            </Grid>
        </Grid>
    );
};

export default HeroMobile;

const styles = {
    wrapper: {
        height: '100vh',
        backgroundImage: `linear-gradient(90deg, rgba(8, 22, 44, 0.6) 0%, rgba(8, 22, 44, 0.6) 50%, rgba(8, 22, 44, 0.9) 100%), url(${cover})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: {
            lg: 'none', md: 'flex', xs: 'flex', sm: 'flex'
        },
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px',
        boxSizing: 'border-box',
        paddingTop: { xs: '100px', sm: '140px' }, // Space for navbar
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '16px',
    },
    headline: {
        fontSize: '2rem',
        fontWeight: 700,
        color: 'white',
        fontFamily: 'Inter, sans-serif',
        lineHeight: 1.3,
    },
    subtitle: {
        fontSize: '1.5rem',
        fontWeight: 700,
        color: 'white',
        fontFamily: 'Inter, sans-serif',
        lineHeight: 1.3,
    },
    button: {
        backgroundColor: '#B0D6ED',
        color: '#222',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        fontSize: '1rem',
        padding: '12px 24px',
        borderRadius: '8px',
        '&:hover': {
            backgroundColor: '#9fcdeb',
        },
    },
    bottomSection: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '20px',
    },
    rating: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    stars: {
        width: '80px',
        height: 'auto',
    },
    ratingText: {
        fontSize: '0.75rem',
        color: '#CCCCCC',
        fontFamily: 'Inter, sans-serif',
    },
    residencyCard: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        // backgroundColor: '#E6F2FF', // Light blue background
        borderRadius: '12px',
        padding: '12px',
        width: '100%',
        maxWidth: '320px',
        gap: '12px',
    },
    residencyText: {
        fontFamily: 'Inter',
        fontSize: '10px',
        fontWeight: 500,
        color: 'gray',
        position: 'absolute',
        left: '20%'
    },
    residencyTitle: {
        fontSize: '1rem',
        fontWeight: 700,
        color: '#222',
        fontFamily: 'Inter, sans-serif',
        lineHeight: 1.3,
        marginBottom: '4px',
    },
    residencySubtitle: {
        fontSize: '0.75rem',
        color: '#555',
        fontFamily: 'Inter, sans-serif',
        lineHeight: 1.4,
    },
    residencyImageWrapper: {
        width: '100%',
        height: '100px',
        borderRadius: '8px',
        overflow: 'hidden',
    },
    residencyImage: {
        width: '300px',
        height: '120px'
    },
};