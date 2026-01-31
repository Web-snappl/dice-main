import React from 'react';
import { StyleSheet, css } from 'aphrodite';

const Container = ({ children, className, ...props }) => {
    return (
        <div className={css(styles.container, className)} {...props}>
            {children}
        </div>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        '@media (maxWidth: 768px)': {
            padding: '0 15px'
        }
    }
});

export default Container;