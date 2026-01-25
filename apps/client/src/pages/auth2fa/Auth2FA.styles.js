// src/pages/auth/Auth2FA.styles.js
export const stylize = (themes) => {
    const activeTheme =
        themes.activeTheme === 'light' ? themes.light : themes.dark;

    return {
        screen: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '90vh',
            padding: '5px 5px',

        },
        container: {
            padding: '25px 25px',
            backgroundColor: activeTheme.primary,
            height: '80vh',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            boxShadow: `5px 5px 15px 5px ${activeTheme.secondary}`
        },
        logo: {
            fontSize: '2rem',
            fontWeight: 700,
            color: '#4C6EF5',
            fontFamily: 'Inter, sans-serif',
            marginBottom: '8px'
        },
        title: {
            fontSize: '1.5rem',
            fontWeight: 700,
            color: activeTheme.text,
            fontFamily: 'Inter, sans-serif',
            marginBottom: '4px',
        },
        subtitle: {
            fontSize: '0.875rem',
            color: activeTheme.subTextSecondary,
            fontFamily: 'Inter, sans-serif',
            marginBottom: '30px',
        },
        codeSection: {
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
        },
        codeInputRow: {
            display: 'flex',
            justifyContent: 'space-between',
            gap: '8px',
        },
        codeInput: {
            width: '40px',
            height: '40px',
            textAlign: 'center',
            fontSize: '1.2rem',
            fontWeight: 700,
            color: activeTheme.text,
            fontFamily: 'Inter, sans-serif',
            outline: 'none',
            border: `solid 1px lightgray`,
            borderRadius: '8px',
            backgroundColor: activeTheme.secondary,
            '&:focus': {
                outline: 'none',
                borderColor: activeTheme.icon,
            },
        },
        verifyButton: {
            width: '100%',
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
        smsLabel: {
            fontSize: '0.875rem',
            color: activeTheme.subTextSecondary,
            fontFamily: 'Inter, sans-serif',
            marginBottom: '8px',
        },
        resendSection: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
        },
        resendText: {
            fontSize: '0.875rem',
            color: activeTheme.subTextSecondary,
            fontFamily: 'Inter, sans-serif',
        },
        resendButton: {
            fontSize: '0.875rem',
            color: '#4C6EF5',
            fontWeight: 500,
            fontFamily: 'Inter, sans-serif',
            '&:hover': {
                textDecoration: 'underline',
            },
        },
        backButton: {
            width: '100%',
            backgroundColor: 'transparent',
            color: activeTheme.text,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: '1rem',
            padding: '10px 20px',
            borderRadius: '8px',
            border: `1px solid ${activeTheme.divider}`,
            '&:hover': {
                backgroundColor: activeTheme.primary,
            },
        },
    };
};