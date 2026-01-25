// src/components/dashboard/Dashboard.jsx
import Grid from '@mui/material/Grid'
import DashboardNavMenu from './DashboardNavMenu'
import Header from './Header'
import { useSelector } from 'react-redux'
import { stylize } from './Dashboard.styles'

const Dashboard = ({ children, spacing }) => {

    const themes = useSelector((state) => state.global.themes)
    const styles = stylize(themes)

    return (
        <main style={styles.root}>
            <Grid container spacing={spacing || 1} size={{ lg: 12, md: 12, sm: 12, xs: 12 }}>
                {/* First Row: Header Bar */}
                <Header />
                {/* Second Row: Nav Menu + Main Content */}
                <Grid
                    container
                    size={{ lg: 12, md: 12, sm: 12, xs: 12 }}
                    sx={styles.contentRow}
                >
                    {/* Left Nav Menu */}
                    <Grid container size={{ lg: 3, md: 3, sm: 0, xs: 0 }} sx={styles.navColumn}                    >
                        <DashboardNavMenu />
                    </Grid>

                    {/* Main Content Area */}
                    <Grid container size={{ lg: 9, md: 9, sm: 12, xs: 12 }} sx={styles.mainContent}                    >
                        {children}
                    </Grid>
                </Grid>
            </Grid>
        </main>
    )
}

export default Dashboard
