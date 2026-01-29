
export const stylize = (themes) => {
    const activeTheme = themes.activeTheme === 'light' ? themes.light : themes.dark;

    return {
        container: {
            padding: '5px',
            backgroundColor: activeTheme.primary,
            margin: '0 auto',
            overflowY: 'visible',
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '30px',
            flexWrap: 'wrap',
            gap: '10px',
        },
        title: {
            fontWeight: 600,
            fontSize: '1.1rem',
            color: '#222',
            fontFamily: 'Inter, sans-serif',
            marginBottom: '4px'
        },
        subtitle: {
            fontSize: '1rem',
            color: '#555',
            fontFamily: 'Inter, sans-serif',
        },
        addButton: {
            backgroundColor: '#4C6EF5',
            color: 'white',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: '1rem',
            padding: '10px 20px',
            borderRadius: '8px',
            '&:hover': {
                backgroundColor: '#3a5aeb',
            },
        },
        stats: {
            marginBottom: '30px',
        },
        statCard: {
            backgroundColor: activeTheme.secondary,
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            textAlign: 'center',
        },
        statLabel: {
            fontSize: '0.875rem',
            color: '#7A7A7A',
            fontFamily: 'Inter, sans-serif',
            marginBottom: '8px',
        },
        statValueWrapper: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
        },
        statValue: {
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#222',
            fontFamily: 'Inter, sans-serif',
        },
        statIcon: {
            fontSize: '1.2rem',
            color: '#7A7A7A',
        },
        filterBar: {
            display: 'flex',
            gap: '16px',
            marginBottom: '30px',
            flexWrap: 'wrap',
            alignItems: 'center',
        },
        searchInput: {
            flex: 1,
            minWidth: '200px',
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
            border: `solid 1px ${activeTheme.secondary}`,
            borderRadius: '10px'
        },
        dropdown: {
            minWidth: '200px',
            '& .MuiSelect-select': {
                fontSize: '0.875rem',
                fontFamily: 'Inter, sans-serif',
                border: `solid 1px ${activeTheme.secondary}`,
                borderRadius: '10px'
            },
        },
        viewToggle: {
            display: 'flex',
            gap: '4px',
            '& .MuiButton-root': {
                fontSize: '0.875rem',
                fontFamily: 'Inter, sans-serif',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                '&:hover': {
                    backgroundColor: '#eee',
                },
            },
        },
        viewBtn: {
            '&.Mui-selected': {
                backgroundColor: '#4C6EF5',
                color: 'white',
                border: 'none',
            },
        },
        card: {
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            transition: 'transform 0.2s ease',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
            },
        },
        statusBadge: {
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: 1,
            padding: '4px 8px',
            borderRadius: '4px',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: 500,
            fontFamily: 'Inter, sans-serif',
        },
        media: {
            borderRadius: '12px 12px 0 0',
            objectFit: 'cover',
            height: '200px !important',
        },
        content: {
            padding: '16px',
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
            marginBottom: '8px',
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
        meta: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
        },
        type: {
            fontSize: '0.875rem',
            color: '#7A7A7A',
            fontFamily: 'Inter, sans-serif',
        },
        unit: {
            fontSize: '0.875rem',
            color: '#7A7A7A',
            fontFamily: 'Inter, sans-serif',
        },
        tenant: {
            fontSize: '0.875rem',
            color: '#555',
            fontFamily: 'Inter, sans-serif',
            marginTop: '8px',
        },
        actions: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 16px',
        },
        detailsButton: {
            fontSize: '0.875rem',
            color: '#4C6EF5',
            fontWeight: 500,
            '&:hover': {
                textDecoration: 'underline',
            },
        },
    };
}