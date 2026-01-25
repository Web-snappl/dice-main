import React from 'react';
import { StyleSheet, css } from 'aphrodite';

const FeatureCard = ({ icon, title, description }) => {
    return (
        <div className={css(styles.card)}>
            <div className={css(styles.icon)}>{icon}</div>
            <h3 className={css(styles.title)}>{title}</h3>
            <p className={css(styles.description)}>{description}</p>
        </div>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#f8f9fa',
        borderRadius: '16px',
        padding: '30px',
        textAlign: 'center',
        transition: 'transform 0.3s, box-shadow 0.3s'
    },
    icon: {
        fontSize: '48px',
        marginBottom: '20px'
    },
    title: {
        fontSize: '24px',
        color: '#2c3e50',
        marginBottom: '15px',
        fontWeight: '600'
    },
    description: {
        color: '#7f8c8d',
        margin: 0
    }
});

export default FeatureCard;