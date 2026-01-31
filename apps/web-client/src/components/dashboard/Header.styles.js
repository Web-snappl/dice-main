// src/components/dashboard/Header.styles.js

export const stylize = (activeTheme) => {
    return {
        header: {
            height: { lg: '8vh', xs: '16vh' },
            backgroundColor: activeTheme.primary,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            boxSizing: 'border-box',
        },
        headerLeft: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: { lg: 'flex-start', xs: 'center' },
        },
        title: {
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#222',
            fontFamily: 'Inter, sans-serif',
            color: activeTheme.text
        },
        headerRight: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '16px',
        },
        searchInput: {
            display: {
                lg: 'block', xs: 'none'
            },
            minWidth: '300px',
            '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
            },
            '& .MuiInputLabel-root': {
                fontSize: '0.875rem',
                fontFamily: 'Inter, sans-serif',
            },
            '& .MuiInputBase-input': {
                fontSize: '0.875rem',
                fontFamily: 'Inter, sans-serif',
            },
        },
        date: {
            fontSize: '0.875rem',
            color: '#555',
            fontFamily: 'Inter, sans-serif',
        },
        profile: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
        },
        icon: {
            color: '#7A7A7A',
            cursor: 'pointer',
        },
        contentRow: {
            flexGrow: 1,
            display: 'flex',
            minHeight: 'calc(100vh - 8vh)',
        },
        navColumn: {
            height: '100%',
            backgroundColor: 'white',
            borderRight: '1px solid #eee',
            overflowY: 'auto',
            padding: '20px 0',
        },
        mainContent: {
            height: 'auto',
            padding: '20px',
            overflowY: 'auto',
            backgroundColor: '#fafafa',
        },
        themeToggleIcon: {
            color: activeTheme.icon,
            cursor: 'pointer'
        }
    }
}