// src/home/Footer.jsx
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import FacebookIcon from '@mui/icons-material/Facebook'
import TwitterIcon from '@mui/icons-material/Twitter'
import InstagramIcon from '@mui/icons-material/Instagram'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import { useNavigate } from 'react-router'

const Footer = () => {

    const navigate = useNavigate()
    const list = ['Apartment for Sale', 'Apartment for Rent', 'Offices for Sale', 'Offices for Rent']
    const companyLinks = ['Terms of Use', 'Privacy Policy', 'Pricing Plans', 'Our Services', 'Contact', 'Careers', 'FAQs']

    return (
        <Grid size={{ lg: 12, xs: 12 }} container sx={styles.footer}>
            {/* Row 1: Social Icons */}
            <Grid size={{ lg: 12, xs: 12 }} container sx={styles.socialRow}>
                <Grid size={{ xs: 'auto' }}>
                    <Typography variant="caption" sx={styles.followUs}>
                        Follow Us
                    </Typography>
                </Grid>
                <Grid size={{ xs: 'auto' }}>
                    <Grid container spacing={1.5}>
                        <Grid size={{ xs: 'auto' }}>
                            <Link href="https://www.facebook.com" color="inherit" sx={styles.iconLink}>
                                <FacebookIcon fontSize="small" />
                            </Link>
                        </Grid>
                        <Grid size={{ xs: 'auto' }}>
                            <Link href="#" color="inherit" sx={styles.iconLink}>
                                <TwitterIcon fontSize="small" />
                            </Link>
                        </Grid>
                        <Grid size={{ xs: 'auto' }}>
                            <Link href="https://www.instagram.com" color="inherit" sx={styles.iconLink}>
                                <InstagramIcon fontSize="small" />
                            </Link>
                        </Grid>
                        <Grid size={{ xs: 'auto' }}>
                            <Link href="https://www.linkedin.com" color="inherit" sx={styles.iconLink}>
                                <LinkedInIcon fontSize="small" />
                            </Link>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            {/* Row 2: 4-Column Content */}
            <Grid size={{ xs: 12 }} sx={{ marginBottom: '30px' }}>
                <Grid container spacing={4}>
                    {/* Column 1: Popular Search */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography variant="subtitle1" sx={styles.heading}>
                            Popular Search
                        </Typography>
                        <Grid container component="ul" sx={styles.list}>
                            {list.map((item) => (
                                <Grid size={{ xs: 12 }} component="li" key={item} sx={styles.listItem}>
                                    <Link href="#" color="text.secondary" sx={styles.link}>
                                        {item}
                                    </Link>
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>

                    {/* Column 2: Quick Links */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography variant="subtitle1" sx={styles.heading}>
                            Quick Links
                        </Typography>
                        <Grid container component="ul" sx={styles.list}>
                            {companyLinks.map((item) => (
                                <Grid size={{ xs: 12 }} component="li" key={item} sx={styles.listItem}>
                                    <Link href="#" color="text.secondary" sx={styles.link}>
                                        {item}
                                    </Link>
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>

                    {/* Column 3: Discovery */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography variant="subtitle1" sx={styles.heading}>
                            Discovery
                        </Typography>
                        <Grid container component="ul" sx={styles.list}>
                            {['Chicago', 'Los Angeles', 'New Jersey', 'New York', 'California'].map((item) => (
                                <Grid size={{ xs: 12 }} component="li" key={item} sx={styles.listItem}>
                                    <Link href="#" color="text.secondary" sx={styles.link}>
                                        {item}
                                    </Link>
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>

                    {/* Column 4: Customer Care + Newsletter */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography variant="subtitle1" sx={styles.heading}>
                            Total Free Customer Care
                        </Typography>
                        <Typography variant="body1" sx={styles.phone}>
                            +(088) 123 456 789
                        </Typography>
                        <Typography variant="body1" sx={styles.email}>
                            Lokka@gmail.com
                        </Typography>

                        <Typography variant="subtitle1" sx={{ ...styles.heading, marginTop: '24px' }}>
                            Keep Yourself Up to Date
                        </Typography>

                    </Grid>
                </Grid>
            </Grid>

            {/* Row 3: Legal Links */}
            <Grid size={{ xs: 12 }}>
                <Grid container sx={styles.bottom}>
                    <Grid size={{ xs: 'auto' }}>
                        <Link href="#" color="text.secondary" sx={styles.bottomLink}>
                            Privacy
                        </Link>
                    </Grid>
                    <Grid size={{ xs: 'auto' }}>
                        <Link href="#" color="text.secondary" sx={styles.bottomLink}>
                            Terms
                        </Link>
                    </Grid>
                    <Grid size={{ xs: 'auto' }}>
                        <Link href="#" color="text.secondary" sx={styles.bottomLink}>
                            Sitemap
                        </Link>
                    </Grid>
                </Grid>
                <Grid container justifyContent={'center'} >
                    <p style={styles.bottomLink} > version 0.0.1 </p>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default Footer;

const styles = {
    footer: {
        backgroundColor: '#08162C',
        color: 'white',
        padding: { xs: '40px 20px', md: '50px 40px' },
    },
    socialRow: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '20px',
    },
    followUs: {
        fontSize: '0.875rem',
        color: 'white',
        fontFamily: 'Inter, sans-serif',
    },
    iconLink: {
        color: 'white',
        '&:hover': { color: '#B0D6ED' },
    },
    heading: {
        fontSize: '1rem',
        fontWeight: 600,
        color: 'white',
        fontFamily: 'Inter, sans-serif',
        marginBottom: '16px',
    },
    list: {
        padding: 0,
        margin: 0,
        listStyle: 'none',
    },
    listItem: {
        marginBottom: '8px',
    },
    link: {
        fontSize: '0.875rem',
        color: '#CCCCCC',
        fontFamily: 'Inter, sans-serif',
        display: 'block',
        '&:hover': {
            color: '#B0D6ED',
            textDecoration: 'underline',
        },
    },
    phone: {
        fontSize: '1rem',
        fontWeight: 600,
        color: 'white',
        fontFamily: 'Inter, sans-serif',
        marginBottom: '8px',
    },
    email: {
        fontSize: '1rem',
        color: '#CCCCCC',
        fontFamily: 'Inter, sans-serif',
        marginBottom: '24px',
    },
    input: {
        width: '100%',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #333',
        backgroundColor: '#122a3f',
        color: 'white',
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.875rem',
    },
    button: {
        padding: '10px 16px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: '#B0D6ED',
        color: '#222',
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.875rem',
        whiteSpace: 'nowrap',
    },
    bottom: {
        justifyContent: 'center',
        gap: '20px',
        borderTop: '1px solid #1A2F42',
        paddingTop: '20px',
        paddingBottom: '10px',
    },
    bottomLink: {
        fontSize: '0.75rem',
        color: '#CCCCCC',
        fontFamily: 'Inter, sans-serif',
        '&:hover': {
            color: '#B0D6ED',
            textDecoration: 'underline',
        },
    },
};
