import React from 'react';
import { StyleSheet, css } from 'aphrodite';

const TestimonialCard = ({ content, name, role, isActive }) => {
    return (
        <div className={css(styles.card)}>
            <div className={css(styles.content)}>"{content}"</div>
            <div className={css(styles.author)}>
                <div className={css(styles.name)}>{name}</div>
                <div className={css(styles.role)}>{role}</div>
            </div>
        </div>
    );
};

const styles = StyleSheet.create({
    card: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)'
    },
    content: {
        fontStyle: 'italic',
        fontSize: '20px',
        color: '#2c3e50',
        marginBottom: '20px',
        lineHeight: '1.6'
    },
    author: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '15px'
    },
    name: {
        fontWeight: '700',
        color: '#2c3e50'
    },
    role: {
        color: '#7f8c8d',
        fontSize: '16px'
    }
});

export default TestimonialCard;