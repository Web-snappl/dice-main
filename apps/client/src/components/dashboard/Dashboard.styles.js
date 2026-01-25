// src/components/dashboard/Dashboard.styles.js
export const stylize = (themes) => {
    const theme = themes.activeTheme === 'light' ? themes.light : themes.dark
    return {
        root: {
            display: 'flex',
            flexDirection: 'column',
            height: 'auto'
        },
        contentRow: {
            flexGrow: 1,
            display: 'flex',
           // minHeight: 'calc(100vh - 8vh)',
        },
        navColumn: {
            height: 'auto',
            backgroundColor: theme.primary,
            borderRight: `1px solid ${theme.divider}`,
            overflowY: 'auto',
            padding: '20px 0',
        },
        mainContent: {
            height: 'auto',
            padding: '20px',
            overflowY: 'auto',
            backgroundColor: theme.primary,
        }
    }

}