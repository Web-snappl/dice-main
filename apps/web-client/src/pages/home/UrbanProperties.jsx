// src/home/UrbanProperties.jsx
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { urbanProps } from '@info/urbanProperties.info';

const UrbanProperties = () => {
  return (
    <Box sx={styles.container}>
      {/* Header */}
      <Box sx={styles.headerTop}>
        <Typography variant="h2" sx={styles.title}>
          Properties By cities
        </Typography>
    
      </Box>

      <Typography variant="body2" sx={styles.subtitle}>
        <Link href="#" underline="hover" color="primary">
          Certains de nos meilleurs départements
        </Link>
      </Typography>

      {/* Grid of horizontal items */}
      <Grid container spacing={3}>
        {urbanProps.map((item) => (
          <Grid size={{ xs: 6, sm: 6, md: 3 }} key={item.id}>
            <Box sx={styles.item}>
              <Grid container spacing={2} alignItems="center">
                {/* Image */}
                <Grid size={{ xs: 'auto' }}>
                  <Box
                    component="img"
                    src={item.image}
                    alt={`${item.city} property`}
                    sx={styles.image}
                  />
                </Grid>

                {/* Text */}
                <Grid size={{ xs: 'auto', flexGrow: 1 }}>
                  <Typography variant="h6" sx={styles.cityName}>
                    {item.city}
                  </Typography>
                  <Typography variant="body2" sx={styles.propertyCount}>
                    {item.count} Properties
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default UrbanProperties;

const styles = {
  container: {
    padding: '50px 20px',
    backgroundColor: '#f9f9f9',
    maxWidth: '1280px',
    margin: '0 auto',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '4px',
    marginBottom: '8px',
  },
  title: {
    fontSize: { xs: '2rem', md: '2.5rem' },
    fontWeight: 700,
    color: '#222',
    fontFamily: 'Inter, sans-serif',
  },
  viewAll: {
    fontSize: '0.875rem',
    color: '#7A7A7A',
    fontFamily: 'Inter, sans-serif',
    whiteSpace: 'nowrap',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#007BFF',
    fontFamily: 'Inter, sans-serif',
    marginBottom: '30px',
    display: 'block',
  },
  item: {
    padding: '12px',
    borderRadius: '12px',
    backgroundColor: '#fff',
    height: '100%',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
    },
    display: 'flex',
    alignItems: 'center',
  },
  image: {
    height: '100px', // Adjusted slightly for better fit
    width: 'auto',
    borderRadius: '8px',
    objectFit: 'cover',
    objectPosition: 'center',
  },
  cityName: {
    fontWeight: 600,
    fontSize: '1rem',
    color: '#222',
    fontFamily: 'Inter, sans-serif',
  },
  propertyCount: {
    fontSize: '0.75rem',
    color: '#7A7A7A',
    fontFamily: 'Inter, sans-serif',
    marginTop: '2px',
  },
};