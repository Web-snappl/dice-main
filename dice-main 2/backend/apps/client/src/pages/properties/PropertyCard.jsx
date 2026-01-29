// src/home/PropertyCard.jsx
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import IconButton from '@mui/material/IconButton'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { stylize } from './PropertyCard.styles'
import { useSelector } from 'react-redux'

const PropertyCard = ({ property }) => {

    const themes = useSelector((state) => state.global.themes)
    const styles = stylize(themes)

    return (
        <Card sx={styles.card}>
            {/* Image */}
            <CardMedia
                component="img"
                height="200"
                image={property.image}
                alt={property.title}
                sx={styles.media}
            />

            {/* Content */}
            <CardContent sx={styles.content}>
                <Typography variant="h6" sx={styles.title}>
                    {property.title}
                </Typography>
                <Typography variant="caption" sx={styles.address}>
                    {property.address}
                </Typography>

                <Box sx={styles.priceRow}>
                    <Typography variant="h5" sx={styles.price}>
                        {property.price}
                    </Typography>
                    <Typography variant="caption" sx={styles.perMonth}>
                        par mois
                    </Typography>
                </Box>

                <Box sx={styles.meta}>
                    <Typography variant="caption" sx={styles.type}>
                        Type: {property.type}
                    </Typography>
                    <Typography variant="caption" sx={styles.unit}>
                        Unité: {property.unit}
                    </Typography>
                </Box>

                <Typography variant="caption" sx={styles.tenant}>
                    Locataire actuel: {property.tenant}
                </Typography>
            </CardContent>

            {/* Actions */}
            <CardActions sx={styles.actions}>
                <Button size="small" sx={styles.detailsButton}>
                    Détails
                </Button>
                <IconButton size="small">
                    <MoreVertIcon />
                </IconButton>
            </CardActions>
        </Card>
    );
};
export default PropertyCard
