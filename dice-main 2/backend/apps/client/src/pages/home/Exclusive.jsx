// src/home/Exclusive.jsx
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import imageGroup from '@assets/image-group.png'; // ← Ensure this path is correct

const Exclusive = () => {
    const texts = [
        'Find excellent deals',
        'Friendly host & Fast support',
        'List your own property',
    ]
    return (
        <Box sx={styles.container}>
            <Grid container spacing={4} alignItems="center">
                {/* Left Text Column */}
                <Grid size={{ lg: 6, md: 6, sm: 12, xs: 12 }}>
                    <Typography variant="h2" sx={styles.title}>
                        Let’s Find The Right <br />
                        Selling Option For You
                    </Typography>

                    <Typography variant="body1" sx={styles.subtitle}>
                        As the complexity of buildings to increase, the field of architecture.
                    </Typography>

                    <Box sx={styles.list}>
                        {texts.map((item, index) => (
                            <Box key={index} sx={styles.listItem}>
                                <CheckCircleIcon sx={styles.icon} />
                                <Typography variant="body1" sx={styles.listText}>
                                    {item}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    <Link href="#" underline="none" sx={styles.learnMore}>
                        Learn More
                    </Link>
                </Grid>

                {/* Right Image Column */}
                <Grid size={{ lg: 6, md: 6, sm: 12, xs: 12 }}>
                    <Box sx={styles.imageWrapper}>
                        <img
                            src={imageGroup}
                            alt="Couple reviewing property with exclusive agents"
                            style={{
                                width: '100%',
                                height: 'auto',
                                borderRadius: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            }}
                        />
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Exclusive;

const styles = {
    container: {
        padding: { xs: '40px 20px', md: '60px 40px' },
        backgroundColor: '#f9f9f9',
        maxWidth: '1280px',
        margin: '0 auto',
    },
    title: {
        fontSize: { xs: '2rem', md: '2.5rem' },
        fontWeight: 700,
        color: '#222',
        fontFamily: 'Inter, sans-serif',
        lineHeight: 1.3,
        marginBottom: '16px',
    },
    subtitle: {
        fontSize: '1rem',
        color: '#555',
        fontFamily: 'Inter, sans-serif',
        marginBottom: '24px',
    },
    list: {
        marginBottom: '24px',
    },
    listItem: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        marginBottom: '12px',
    },
    icon: {
        color: '#00C853',
        fontSize: '1.1rem',
        marginTop: '2px',
    },
    listText: {
        fontSize: '1rem',
        color: '#333',
        fontFamily: 'Inter, sans-serif',
    },
    learnMore: {
        fontSize: '1rem',
        color: '#007BFF',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        '&:hover': {
            textDecoration: 'underline',
        },
    },
    imageWrapper: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderRadius: '12px',
    },
};