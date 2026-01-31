// src/home/NavbarMobile.jsx
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import cover from '@assets/hero-image.png'; // ← Keep this!
import { useNavigate } from 'react-router'
import { navItems } from '@info/navRoutes.info';

const NavbarMobile = () => {

    const navigate = useNavigate()

    return (
        <Grid
            container
            size={{ xs: 12 }}
            sx={styles.wrapper}
        >
            {navItems.map((item) => (
                <Grid size={{ xs: 12 }} key={item.text}>
                    <Typography
                        variant="body1"
                        sx={styles.navItem}
                        onClick={() => navigate(item.route)}
                    >
                        {item.text}
                    </Typography>
                </Grid>
            ))}
        </Grid>
    );
};

export default NavbarMobile;

const styles = {
    wrapper: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        backgroundImage: `linear-gradient(90deg, rgba(8, 22, 44, 0.6) 0%, rgba(8, 22, 44, 0.6) 50%, rgba(8, 22, 44, 0.9) 100%), url(${cover})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: 1400,
        display: { xs: 'flex', sm: 'none' },
        flexDirection: 'column',
        overflowY: 'auto',
        padding: '20px',
        boxSizing: 'border-box',
    },
    navItem: {
        fontSize: '1.2rem',
        fontWeight: 500,
        color: 'white', // ✅ White text for contrast
        fontFamily: 'Inter, sans-serif',
        padding: '16px 24px',
        cursor: 'pointer',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        transition: 'background-color 0.2s ease',
        '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.05)',
        },
        '&:last-child': {
            borderBottom: 'none',
        },
    },
};