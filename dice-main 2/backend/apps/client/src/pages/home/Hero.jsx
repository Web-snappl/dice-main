//src/home/Hero.jsx
import Grid from '@mui/material/Grid'
import cover from '@assets/hero-image.png'
import blueResidency from '@assets/blue-residence.png'
import Typography from '@mui/material/Typography'
import stars from '@assets/rating-stars.png'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import { styled } from '@mui/material/styles'
import arrow from '@assets/arrow.png'
import { flexStyles } from '../../theme/flexStyles'
import { useNavigate } from 'react-router'
const Image = styled('img')({})

const Hero = () => {

    const navigate = useNavigate()

    return (
        <Grid container size={{ lg: 12, xs: 12, md: 12, sm: 12 }} spacing={2} sx={styles.wrapper}>

            <Grid container size={{ lg: 8, xs: 12, md: 12, sm: 12 }} sx={{ ...styles.leftSection, ...flexStyles.col.startAlign }} >
                <Typography sx={{ ...styles.typography, ...styles.headline }} >
                    Live comfortably
                </Typography>
                <Typography sx={{ ...styles.typography, ...styles.subtitle }}>
                    with a stunning view
                </Typography>
                <Typography sx={{ ...styles.typography, ...styles.description }}>
                    Discover exclusive real estate deals before they go public one <br></br>
                    easy search for the hottest foreclosures!
                </Typography>
                <Button variant="contained" style={styles.button} onClick={() => navigate('/about')} > Discover who we are </Button>
            </Grid>

            <Grid container size={{ lg: 4, xs: 12, md: 12, sm: 12 }} spacing={2} sx={{ ...styles.rightSection, ...flexStyles.col.startAlign }}>
                <Image src={blueResidency} />
                <Image src={stars} />

                <Typography sx={{ ...styles.typography, ...styles.grayline }}>
                    5 Star Rating
                </Typography>
                <Typography sx={{ ...styles.typography, ...styles.grayline }}>
                    More than 100 companies trust immo
                </Typography>

                <Grid container style={flexStyles.row.startAlign} >
                    <Typography sx={styles.typography} >
                        <Link href="#" style={styles.link} onClick={() => navigate('/about')} > Read more </Link>
                    </Typography>
                    <Image src={arrow} alt="alt" sx={styles.arrow} />
                </Grid>

            </Grid>
        </Grid>
    );
}
export default Hero

const styles = {
    wrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        backgroundImage: `linear-gradient(90deg,rgba(8, 22, 44, 0.6) 0%, rgba(8, 22, 44, 0.6) 50%, rgba(8, 22, 44, 0.9) 100%),url(${cover})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 100vh",
        height: "100vh",
        overflow: 'hidden',
        display: { lg: 'flex', md: 'flex', xs: 'none', sm: 'none' },
    },
    leftSection: {
        marginBottom: '3%',
        padding: '10px'
    },
    typography: {
        fontFamily: 'Inter',
        leadingTrim: 'NONE',
        lineHeight: '100%',
        letterSpacing: '0px',
        color: 'white'
    },
    headline: {
        fontWeight: 700,
        fontStyle: 'Bold',
        fontSize: '3.5rem'
    },
    subtitle: {
        fontWeight: 700,
        fontStyle: 'Bold',
        fontSize: '2.6rem'
    },
    description: {
        fontWeight: 500,
        fontStyle: 'Medium',
        fontSize: '1.0rem'
    },
    grayline: {
        color: '#7A7A7A',
        fontWeight: 'semi bold',
        fontStyle: 'Medium',
        fontSize: '15px',
        marginLeft: '5px'
    },
    rightSection: {
        marginBottom: '6%',
        padding: '10px',
    },
    button: {
        fontFamily: 'Inter',
        fontStyle: 'Medium',
        fontSize: '19px',
        width: '50%',
        height: '63px',
        backgroundColor: '#B0D6ED',
        color: '#222'
    },
    link: {
        marginLeft: '5px',
        color: 'lightgray',
        marginRight: '0px'
    },
    arrow: {
        width: '16%',
        height: '8px',
        cursor: 'pointer',
        marginTop: '7px'
    }
}

