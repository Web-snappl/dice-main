import React from 'react';
import { StyleSheet, css } from 'aphrodite';

const Button = ({ children, variant = 'primary', size = 'medium', ...props }) => {
    const buttonStyles = getButtonStyles(size);

    return (
        <button
            className={css(
                styles.base,
                variant === 'primary' ? buttonStyles.primary : buttonStyles.outline,
                props.className
            )}
            {...props}
        >
            {children}
        </button>
    );
};

const getButtonStyles = (size) => {
    const baseSize = size === 'large' ? 18 : size === 'small' ? 14 : 16;

    return StyleSheet.create({
        primary: {
            backgroundColor: '#3498db',
            color: 'white',
            ':hover': {
                backgroundColor: '#2980b9',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3)'
            }
        },
        outline: {
            backgroundColor: 'transparent',
            border: '2px solid #3498db',
            color: '#3498db',
            ':hover': {
                backgroundColor: '#3498db',
                color: 'white'
            }
        }
    });
};

const styles = StyleSheet.create({
    base: {
        padding: '10px 20px',
        borderRadius: '30px',
        fontWeight: '600',
        cursor: 'pointer',
        border: 'none',
        fontSize: '16px',
        transition: 'all 0.3s ease',
        outline: 'none',
        ':focus': {
            outline: '2px solid #3498db',
            outlineOffset: '2px'
        }
    }
});

export default Button;