// src/home/Discover.jsx
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import apartment from '@assets/apartment.png'; // ← shared image

// Sample data (only title, address, price needed)
const properties = [
    { id: 1, title: 'Loft de luxe au centre-ville', address: '123, rue Main, centre-ville', price: '$1000' },
    { id: 2, title: 'Loft de luxe au centre-ville', address: '123, rue Main, centre-ville', price: '$2,400' },
    { id: 3, title: 'Loft de luxe au centre-ville', address: '123, rue Main, centre-ville', price: '$1200' },
    { id: 4, title: 'Loft de luxe au centre-ville', address: '123, rue Main, centre-ville', price: '$600' },
    { id: 5, title: 'Loft de luxe au centre-ville', address: '123, rue Main, centre-ville', price: '$800' },
    { id: 6, title: 'Loft de luxe au centre-ville', address: '123, rue Main, centre-ville', price: '$3100' },
];

const Discover = () => {
    return (
        <Box sx={styles.container}>
            {/* Header */}
            <Box sx={styles.header}>
                <Typography variant="h2" sx={styles.title}>
                    Discover Popular Properties
                </Typography>
                <Typography variant="body2" sx={styles.subtitle}>
                    <Link href="#" underline="hover" color="primary">
                        As the complexity of buildings to increase, the field of architecture.
                    </Link>
                </Typography>
            </Box>

            {/* Property Grid */}
            <Grid container spacing={3}>
                {properties.map((property) => (
                    <Grid key={property.id} size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card sx={styles.card}>
                            <CardMedia
                                component="img"
                                height="200"
                                image={apartment} // ← same image for all
                                alt={property.title}
                                sx={styles.media}
                            />
                            <CardContent sx={styles.content}>
                                <Typography variant="h6" sx={styles.titleText}>
                                    {property.title}
                                </Typography>
                                <Typography variant="caption" sx={styles.address}>
                                    {property.address}
                                </Typography>
                                <Box sx={styles.priceRow}>
                                    <Typography variant="h5" sx={styles.price}>
                                        {property.price}
                                    </Typography>
                                    <Typography variant="caption" sx={styles.perMonth}>
                                        par mois
                                    </Typography>
                                </Box>
                                {/* ✅ "Type" and "Units" removed */}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default Discover;

const styles = {
    container: {
        padding: { xs: '40px 20px', md: '60px 40px' },
        backgroundColor: '#f9f9f9',
        maxWidth: '1280px',
        margin: '0 auto',
    },
    header: {
        marginBottom: '30px',
    },
    title: {
        fontSize: { xs: '2rem', md: '2.5rem' },
        fontWeight: 700,
        color: '#222',
        fontFamily: 'Inter, sans-serif',
        marginBottom: '8px',
    },
    subtitle: {
        fontSize: '1rem',
        color: '#007BFF',
        fontFamily: 'Inter, sans-serif',
    },
    card: {
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
        },
    },
    media: {
        borderRadius: '12px 12px 0 0',
        objectFit: 'cover',
        height: '200px !important',
    },
    content: {
        padding: '16px',
    },
    titleText: {
        fontWeight: 600,
        fontSize: '1.1rem',
        color: '#222',
        fontFamily: 'Inter, sans-serif',
        marginBottom: '4px',
    },
    address: {
        fontSize: '0.875rem',
        color: '#7A7A7A',
        fontFamily: 'Inter, sans-serif',
        marginBottom: '8px',
    },
    priceRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },
    price: {
        fontWeight: 700,
        fontSize: '1.25rem',
        color: '#222',
        fontFamily: 'Inter, sans-serif',
    },
    perMonth: {
        fontSize: '0.875rem',
        color: '#7A7A7A',
        fontFamily: 'Inter, sans-serif',
    },
}