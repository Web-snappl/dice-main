// src/home/Properties.jsx
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Dashboard from '@components/dashboard/dashboard';
import { autocomplete, properties } from '@info/properties.info';
import PropertyCard from './PropertyCard';
import { useSelector } from 'react-redux';
import { stylize } from './Properties.styles';
import { useTranslation } from 'react-i18next';

const Properties = () => {
    const themes = useSelector((state) => state.global.themes);
    const styles = stylize(themes);
    const { t } = useTranslation();
    const activeTheme = themes.activeTheme === 'light' ? themes.light : themes.dark;

    return (
        <Dashboard>
            <Box sx={styles.container}>
                {/* Header */}
                <Box sx={styles.header}>
                    <Box>
                        <Typography variant="h4" sx={styles.title}>
                            {t('properties_title')}
                        </Typography>
                        <Typography variant="body1" sx={styles.subtitle}>
                            {t('properties_subtitle')}
                        </Typography>
                    </Box>
                    <Button variant="contained" sx={styles.addButton}>
                        {t('add_new_property')}
                    </Button>
                </Box>

                {/* Stats Cards */}
                <Grid container spacing={3} sx={styles.stats}>
                    {autocomplete.map((stat, i) => (
                        <Grid key={i} size={{ xs: 6, sm: 3 }}>
                            <Box sx={styles.statCard}>
                                <Typography variant="body2" sx={styles.statLabel}>
                                    {t(stat.labelKey)} {/* ✅ Translated label */}
                                </Typography>
                                <Box sx={styles.statValueWrapper}>
                                    <Typography variant="h5" sx={styles.statValue}>
                                        {stat.value}
                                    </Typography>
                                    <Box sx={styles.statIcon}>{stat.icon}</Box>
                                </Box>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                {/* Search & Filter Bar */}
                <Box sx={styles.filterBar}>
                    <TextField
                        fullWidth
                        placeholder={t('search_properties')}
                        variant="outlined"
                        sx={styles.searchInput}
                        inputProps={
                            {
                                sx: {
                                    '&::placeholder': {
                                        color: activeTheme.secondary,
                                        opacity: 1,
                                    },
                                },
                            }
                        }
                    />
                    <Select defaultValue="all" sx={styles.dropdown}>
                        <MenuItem value="all">{t('all_properties')}</MenuItem>
                        <MenuItem value="active">{t('active')}</MenuItem>
                        <MenuItem value="occupied">{t('occupied')}</MenuItem>
                        <MenuItem value="vacant">{t('vacant')}</MenuItem>
                    </Select>
                    <Box sx={styles.viewToggle}>
                        <Button size="small" sx={styles.viewBtn}>
                            {t('grid_view')}
                        </Button>
                        <Button size="small" sx={styles.viewBtn}>
                            {t('list_view')}
                        </Button>
                    </Box>
                </Box>

                {/* Property Grid */}
                <Grid container spacing={3}>
                    {properties.map((property) => (
                        <Grid key={property.id} size={{ xs: 12, sm: 6, md: 4 }}>
                            <PropertyCard property={property} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Dashboard>
    );
};

export default Properties;