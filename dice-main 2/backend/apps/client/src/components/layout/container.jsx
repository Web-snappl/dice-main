import React from 'react'
import Grid from '@mui/material/Grid'

const Container = ({ children, spacing }) => {
    return (
        <main style={styles.root} >
            <Grid container spacing={spacing || 1}>
                {children}
            </Grid>
        </main>
    );
}
export default Container

const styles = {
    root: {
        flexGrow: 1,
        height: 'auto'
    }
}

