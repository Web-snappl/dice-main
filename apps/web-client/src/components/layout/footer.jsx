import React from 'react';
import { StyleSheet, css } from 'aphrodite';
import Container from '../ui/container';

const Footer = () => {
    const footerLinks = {
        product: [
            { label: 'Features', href: '#' },
            { label: 'Pricing', href: '#' },
            { label: 'Integrations', href: '#' },
            { label: 'Roadmap', href: '#' }
        ],
        resources: [
            { label: 'Blog', href: '#' },
            { label: 'Help Center', href: '#' },
            { label: 'Community', href: '#' },
            { label: 'Webinars', href: '#' }
        ],
        company: [
            { label: 'About Us', href: '#' },
            { label: 'Careers', href: '#' },
            { label: 'Contact', href: '#' },
            { label: 'Partners', href: '#' }
        ]
    };

    return (
        <footer className={css(styles.footer)}>
            <Container>
                <div className={css(styles.footerGrid)}>
                    <div className={css(styles.footerCol)}>
                        <div className={css(styles.footerLogo)}>
                            <span className={css(styles.logoIcon)}>🏢</span>
                            <span className={css(styles.logoText)}>PropManage</span>
                        </div>
                        <p className={css(styles.footerDescription)}>
                            Modern property management solutions for the real estate industry.
                        </p>
                    </div>

                    <div className={css(styles.footerCol)}>
                        <h4 className={css(styles.footerTitle)}>Product</h4>
                        <ul className={css(styles.footerList)}>
                            {footerLinks.product.map((link, index) => (
                                <li key={index} className={css(styles.footerListItem)}>
                                    <a href={link.href} className={css(styles.footerLink)}>{link.label}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className={css(styles.footerCol)}>
                        <h4 className={css(styles.footerTitle)}>Resources</h4>
                        <ul className={css(styles.footerList)}>
                            {footerLinks.resources.map((link, index) => (
                                <li key={index} className={css(styles.footerListItem)}>
                                    <a href={link.href} className={css(styles.footerLink)}>{link.label}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className={css(styles.footerCol)}>
                        <h4 className={css(styles.footerTitle)}>Company</h4>
                        <ul className={css(styles.footerList)}>
                            {footerLinks.company.map((link, index) => (
                                <li key={index} className={css(styles.footerListItem)}>
                                    <a href={link.href} className={css(styles.footerLink)}>{link.label}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className={css(styles.footerBottom)}>
                    <p className={css(styles.copyright)}>&copy; 2025 PropManage. All rights reserved.</p>
                    <div className={css(styles.footerBottomLinks)}>
                        <a href="#" className={css(styles.footerBottomLink)}>Privacy Policy</a>
                        <a href="#" className={css(styles.footerBottomLink)}>Terms of Service</a>
                        <a href="#" className={css(styles.footerBottomLink)}>Cookies</a>
                    </div>
                </div>
            </Container>
        </footer>
    );
};

const styles = StyleSheet.create({
    footer: {
        backgroundColor: '#2c3e50',
        color: '#ecf0f1',
        padding: '70px 0 30px'
    },
    footerGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '40px',
        marginBottom: '40px'
    },
    footerCol: {
        '@media (maxWidth: 768px)': {
            marginBottom: '30px'
        }
    },
    footerLogo: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px',
        fontSize: '24px',
        fontWeight: '700'
    },
    logoIcon: {
        marginRight: '8px'
    },
    logoText: {
        color: 'white'
    },
    footerDescription: {
        color: '#bdc3c7'
    },
    footerTitle: {
        color: 'white',
        marginBottom: '20px',
        fontSize: '18px'
    },
    footerList: {
        listStyle: 'none',
        padding: 0,
        margin: 0
    },
    footerListItem: {
        marginBottom: '12px'
    },
    footerLink: {
        color: '#bdc3c7',
        textDecoration: 'none',
        transition: 'color 0.3s',
        ':hover': {
            color: 'white'
        }
    },
    footerBottom: {
        display: 'flex',
        justifyContent: 'space-between',
        paddingTop: '30px',
        borderTop: '1px solid #34495e',
        color: '#bdc3c7',
        fontSize: '14px',
        '@media (maxWidth: 768px)': {
            flexDirection: 'column',
            gap: '15px',
            textAlign: 'center'
        }
    },
    copyright: {
        margin: 0
    },
    footerBottomLinks: {
        display: 'flex',
        '@media (maxWidth: 768px)': {
            justifyContent: 'center'
        }
    },
    footerBottomLink: {
        color: '#bdc3c7',
        textDecoration: 'none',
        marginLeft: '20px',
        ':hover': {
            color: 'white'
        },
        '@media (maxWidth: 768px)': {
            marginLeft: '10px',
            marginRight: '10px'
        }
    }
});

export default Footer;