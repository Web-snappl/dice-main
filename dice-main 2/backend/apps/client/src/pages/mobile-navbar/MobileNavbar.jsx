// src/components/dashboard/DashboardNavMenu.jsx
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import { navItems } from '@info/dashboardNavMenu.info'
import { useNavigate } from 'react-router';
import { setNavbarPageNum } from '@store/features/state/stateSlice';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';

const MobileNavbar = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const navbarPageNum = useSelector((state) => state.global.navbarPageNum)

    const shift = (item, index) => {
        dispatch(setNavbarPageNum(index + 1))
        navigate(item.route)
    }

    return (
        <Box sx={styles.navMenu}>
            {navItems.map((item, i) => (
                <Button
                    key={i}
                    fullWidth
                    variant={navbarPageNum === (i + 1) ? 'contained' : 'text'}
                    sx={{
                        ...styles.navItem,
                        ...(navbarPageNum === (i + 1) && styles.navItemActive),
                    }}
                    onClick={() => shift(item, i)}
                >
                    {item.label}
                </Button>
            ))}
        </Box>
    );
};

export default MobileNavbar

const styles = {
    navMenu: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '0 16px',
    },
    navItem: {
        justifyContent: 'flex-start',
        textAlign: 'left',
        borderRadius: '8px',
        fontSize: '0.875rem',
        fontFamily: 'Inter, sans-serif',
        padding: '12px 16px',
        color: '#555',
        '&:hover': {
            backgroundColor: '#f5f5f5',
        },
    },
    navItemActive: {
        backgroundColor: '#E6F2FF',
        color: '#4C6EF5',
        fontWeight: 600,
        '&:hover': {
            backgroundColor: '#D0E6FF',
        },
    },
};