// src/components/dashboard/Header.jsx
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import NotificationsIcon from '@mui/icons-material/Notifications'
import NightsStayRoundedIcon from '@mui/icons-material/NightsStayRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import { useSelector } from 'react-redux'
import { stylize } from './Header.styles'
import { useDispatch } from 'react-redux'
import { setTheme } from '@store/features/state/stateSlice'
import { styled } from '@mui/material/styles'
import menu from '@assets/mobile-menu.png'
import { useNavigate } from 'react-router'

const Image = styled('img')({})

const currentUser = {
    name: 'Guest',
    avatar: 'https://static.vecteezy.com/system/resources/previews/024/183/525/non_2x/avatar-of-a-man-portrait-of-a-young-guy-illustration-of-male-character-in-modern-color-style-vector.jpg',
}

const Header = () => {
    const themes = useSelector((state) => state.global.themes)
    const styles = stylize(themes.activeTheme === 'light' ? themes.light : themes.dark)
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const toggleTheme = (themeName) => dispatch(setTheme(themeName))

    return (
        <Grid
            container
            size={{ lg: 12, md: 12, sm: 12, xs: 12 }}
            sx={styles.header}
        >
            {/* Left Side: Title */}
            <Grid
                container
                size={{ lg: 6, md: 6, sm: 12, xs: 12 }}
                spacing={3}
                sx={styles.headerLeft}
            >

                <Image src={menu} onClick={()=> navigate('/mobile-navbar')} />

                <Typography variant="h5" sx={styles.title}>
                    Centre immobilier
                </Typography>

                <TextField
                    variant="outlined"
                    placeholder="Rechercher une propriété, un locataire ou un paiement..."
                    sx={styles.searchInput}
                />
            </Grid>

            {/* Right Side: Search + Date + Profile */}
            <Grid
                container
                size={{ lg: 6, md: 6, sm: 12, xs: 12 }}
                spacing={3}
                sx={styles.headerRight}
            >

                {themes.activeTheme === 'light' ?
                    <LightModeRoundedIcon style={styles.themeToggleIcon} onClick={() => { toggleTheme('dark') }} />
                    :
                    <NightsStayRoundedIcon style={styles.themeToggleIcon} onClick={() => { toggleTheme('light') }} />
                }

                <Typography variant="body2" sx={styles.date}>
                    Jeudi 6 novembre 2025
                </Typography>
                <Box sx={styles.profile}>
                    <NotificationsIcon sx={styles.icon} />
                    <Avatar src={currentUser.avatar} alt={currentUser.name} />
                </Box>
            </Grid>
        </Grid>

    )
}

export default Header
