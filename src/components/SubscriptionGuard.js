// src/components/SubscriptionGuard.js
import React from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    Typography,
    Box,
    useTheme
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const SubscriptionGuard = ({ 
    children, 
    gameId, 
    isPremium = false 
}) => {
    const [open, setOpen] = React.useState(false);
    const theme = useTheme();
    const navigate = useNavigate();

    // This would come from your games service
    const requiresSubscription = isPremium; // Check if game requires subscription

    const handleSubscribeClick = () => {
        setOpen(false);
        navigate('/subscription');
    };

    if (!requiresSubscription) {
        return children;
    }

    // Check subscription status (this would come from your auth context)
    const hasSubscription = false; // Replace with actual subscription check

    if (!hasSubscription) {
        return (
            <>
                <Box
                    onClick={() => setOpen(true)}
                    sx={{
                        position: 'relative',
                        cursor: 'pointer',
                        '&:hover': {
                            opacity: 0.9
                        }
                    }}
                >
                    {children}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            color: 'white',
                            borderRadius: theme.shape.borderRadius
                        }}
                    >
                        <LockIcon sx={{ fontSize: 48, mb: 2 }} />
                        <Typography variant="h6" fontWeight="bold">
                            Premium Content
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Subscribe to unlock
                        </Typography>
                    </Box>
                </Box>

                <Dialog open={open} onClose={() => setOpen(false)}>
                    <DialogTitle>
                        <Box display="flex" alignItems="center" gap={1}>
                            <LockIcon color="primary" />
                            <Typography variant="h6">
                                Premium Content Locked
                            </Typography>
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <Typography variant="body1" paragraph>
                            This game is part of our premium collection. Subscribe now to access:
                        </Typography>
                        <Box component="ul" sx={{ pl: 2 }}>
                            <Typography component="li" variant="body2">
                                Unlimited access to all premium games
                            </Typography>
                            <Typography component="li" variant="body2">
                                New games added monthly
                            </Typography>
                            <Typography component="li" variant="body2">
                                Ad-free experience
                            </Typography>
                            <Typography component="li" variant="body2">
                                Priority support
                            </Typography>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <Button onClick={() => setOpen(false)}>
                            Maybe Later
                        </Button>
                        <Button 
                            variant="contained" 
                            onClick={handleSubscribeClick}
                            sx={{ 
                                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                color: 'white'
                            }}
                        >
                            View Subscription Plans
                        </Button>
                    </DialogActions>
                </Dialog>
            </>
        );
    }

    return children;
};

export default SubscriptionGuard;