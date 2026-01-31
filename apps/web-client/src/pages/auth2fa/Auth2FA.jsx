// src/pages/auth/Auth2FA.jsx
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { stylize } from './Auth2FA.styles'
import Dashboard from '@components/dashboard/dashboard'

const Auth2FA = () => {
    const { t } = useTranslation();
    const themes = useSelector((state) => state.global.themes);
    const styles = stylize(themes)

    return (
        <Dashboard>
            <Grid size={{ lg: 7, md: 12, sm: 6, xs: 12 }} sx={styles.container}>
                {/* Logo */}
                <Typography variant="h5" sx={styles.logo}>
                    Lokka
                </Typography>

                {/* Header */}
                <Typography variant="h4" sx={styles.title}>
                    {t('two_factor_auth')}
                </Typography>
                <Typography variant="caption" sx={styles.subtitle}>
                    {t('enter_code_from_app')}
                </Typography>

                {/* Authenticator App Code */}
                <Box sx={styles.codeSection}>
                    <Box sx={styles.codeInputRow}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <input key={i} type="text" maxLength="1" style={styles.codeInput} />
                        ))}
                    </Box>
                    <Button variant="contained" sx={styles.verifyButton}>
                        {t('verify_code')}
                    </Button>
                </Box>

                {/* SMS Code */}
                <Grid container sx={styles.codeSection}>
                    <Typography variant="caption" sx={styles.smsLabel}>
                        {t('enter_code_from_sms')}
                    </Typography>
                    <Box sx={styles.codeInputRow}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <input key={i} type="text" maxLength="1" style={styles.codeInput} />
                        ))}
                    </Box>
                    <Button variant="contained" sx={styles.verifyButton}>
                        {t('verify_code')}
                    </Button>
                </Grid>

                {/* Didn't receive code? */}
                <Box sx={styles.resendSection}>
                    <Typography variant="caption" sx={styles.resendText}>
                        {t('didnt_receive_code')}
                    </Typography>
                    <Button variant="text" sx={styles.resendButton}>
                        {t('resend_code')}
                    </Button>
                </Box>

                {/* Back to Login */}
                <Button variant="outlined" sx={styles.backButton}>
                    {t('back_to_login')}
                </Button>
            </Grid>

        </Dashboard>
    );
};

export default Auth2FA