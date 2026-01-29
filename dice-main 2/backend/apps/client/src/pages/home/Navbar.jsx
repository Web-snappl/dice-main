// src/home/Navbar.jsx
import Grid from '@mui/material/Grid'
import blurBar from '@assets/blur-bar.png'
import mobileMenu from '@assets/mobile-menu.png'
import { useNavigate } from 'react-router'
import { navItems } from '@info/navRoutes.info'

const Navbar = () => {

    const navigate = useNavigate()

    const paginate = (route) => navigate(route)

    return (
        <Grid
            container
            sx={styles.wrapper}
        >
            <Grid
                container
                size={{ xs: 12, sm: 11, md: 10, lg: 11 }}
                sx={styles.navbar}
            >
                <Grid size={{ xs: 8, sm: 4 }} sx={styles.logo}>
                    <h1 style={styles.propHunt}> Property Hunter </h1>
                </Grid>

                {/* Desktop Menu Icon */}
                <Grid
                    container
                    size={{ xs: 0, sm: 8 }}
                    sx={styles.desktopNavItemWrap}
                >
                    {navItems.map((item) => (
                        <Grid key={item.text} sx={styles.navItem} onClick={() => paginate(item.route)}>
                            <p style={styles.text}>{item.text}</p>
                        </Grid>
                    ))}
                </Grid>

                {/* Mobile Menu Icon */}
                <Grid
                    size={{ xs: 4, sm: 0 }}
                    sx={styles.menuIcon}
                    onClick={() => paginate('/navmobi')}
                >
                    <img src={mobileMenu} alt="Open menu" style={styles.menuImage} />
                </Grid>
            </Grid>
        </Grid>
    );
};

export default Navbar;

const styles = {
    wrapper: {
        position: 'fixed',
        top: '2%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '1400px',
        zIndex: 1300,
        padding: {
            xs: '5px', sm: '5px', md: '5px'
        },
    },
    navbar: {
        height: '8vh',
        borderRadius: '48px',
        padding: '0 20px',
        backgroundImage: `url(${blurBar})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'space-between',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
    },
    desktopNavItemWrap: {
        display: { xs: 'none', sm: 'flex' },
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'nowrap',
        marginLeft: 'auto',
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
    },
    propHunt: {
        fontFamily: 'Lobster, cursive',
        fontSize: { xs: '20px', sm: '24px', md: '28px', lg: '32px' },
        fontWeight: '400',
        color: 'white',
        margin: 0,
        whiteSpace: 'nowrap',
    },
    navItem: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '30px',
        height: '40px',
        backgroundColor: '#465F6F',
        minWidth: '110px',
        textAlign: 'center',
        cursor: 'pointer'
    },
    text: {
        color: 'white',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 300,
        fontSize: '14px',
        margin: 0,
        whiteSpace: 'nowrap',
    },
    menuIcon: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        cursor: 'pointer',
    },
    menuImage: {
        width: '32px',
        height: '32px',
        objectFit: 'contain',
        cursor: 'pointer'
    },
};