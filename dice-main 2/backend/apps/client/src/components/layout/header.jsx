import React, { useState } from 'react';
import { useNavigate } from 'react-router'
import { StyleSheet, css } from 'aphrodite';
import Container from '../ui/container';
import Button from '../ui/button';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate()

    const navLinks = [
        { id: 'features', label: 'Features' },
        { id: 'testimonials', label: 'Testimonials' },
        { id: 'pricing', label: 'Pricing' },
        { id: 'contact', label: 'Contact' }
    ];

    return (
        <header className={css(styles.header)}>
            <Container>
                <div className={css(styles.headerContent)}>
                    <div className={css(styles.logo)}>
                        <span className={css(styles.logoIcon)}>🏢</span>
                        <span className={css(styles.logoText)}> Project Immo </span>
                    </div>

                    <nav className={css(styles.navMenu)}>
                        {navLinks.map((link) => (
                            <a
                                key={link.id}
                                href={`#${link.id}`}
                                className={css(styles.navLink)}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    <div className={css(styles.headerButtons)}>
                        <Button variant="outline" onClick={() => { navigate('/signIn') }} >Sign In</Button>
                        <Button>Get Started</Button>
                    </div>

                    <button
                        className={css(styles.mobileToggle)}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        ☰
                    </button>
                </div>
            </Container>
        </header>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: 'white',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
    },
    headerContent: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 0',
        '@media (maxWidth: 768px)': {
            padding: '15px 0'
        }
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '24px',
        fontWeight: '700',
        color: '#2c3e50'
    },
    logoIcon: {
        marginRight: '8px'
    },
    navMenu: {
        display: 'flex',
        gap: '30px',
        '@media (maxWidth: 768px)': {
            position: 'fixed',
            top: '80px',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            flexDirection: 'column',
            padding: '20px',
            boxShadow: '0 5px 10px rgba(0, 0, 0, 0.1)',
            gap: '0'
        }
    },
    navLink: {
        textDecoration: 'none',
        color: '#555',
        fontWeight: '500',
        transition: 'color 0.3s',
        padding: '12px 0',
        display: 'block',
        '@media (minWidth: 769px)': {
            padding: '0'
        },
        ':hover': {
            color: '#3498db'
        }
    },
    headerButtons: {
        display: 'flex',
        gap: '12px',
        '@media (maxWidth: 768px)': {
            display: 'none'
        }
    },
    mobileToggle: {
        display: 'none',
        background: 'none',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        '@media (maxWidth: 768px)': {
            display: 'block'
        }
    }
});

export default Header;