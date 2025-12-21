import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, Button, Box, Typography } from '@mui/material';
import { WifiOff, Wifi } from '@mui/icons-material';

const NetworkStatusMonitor = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showOfflineAlert, setShowOfflineAlert] = useState(false);
    const [showOnlineAlert, setShowOnlineAlert] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowOfflineAlert(false);
            setShowOnlineAlert(true);
            
            // Auto-hide online alert after 3 seconds
            setTimeout(() => {
                setShowOnlineAlert(false);
            }, 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowOfflineAlert(true);
            setShowOnlineAlert(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleRetry = () => {
        if (navigator.onLine) {
            window.location.reload();
        }
    };

    if (showOfflineAlert) {
        return (
            <Snackbar
                open={true}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                sx={{
                    '& .MuiAlert-root': {
                        width: '100%',
                        maxWidth: '400px'
                    }
                }}
            >
                <Alert
                    severity="warning"
                    icon={<WifiOff />}
                    action={
                        <Button 
                            color="inherit" 
                            size="small"
                            onClick={handleRetry}
                        >
                            Retry
                        </Button>
                    }
                    sx={{
                        backgroundColor: '#fff3cd',
                        color: '#856404',
                        border: '1px solid #ffeaa7'
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                            No Internet Connection
                        </Typography>
                        <Typography variant="body2">
                            You're offline. Some features may be limited.
                        </Typography>
                    </Box>
                </Alert>
            </Snackbar>
        );
    }

    if (showOnlineAlert) {
        return (
            <Snackbar
                open={true}
                autoHideDuration={3000}
                onClose={() => setShowOnlineAlert(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity="success"
                    icon={<Wifi />}
                    sx={{
                        backgroundColor: '#d4edda',
                        color: '#155724',
                        border: '1px solid #c3e6cb'
                    }}
                >
                    <Typography variant="body2">
                        Connection restored
                    </Typography>
                </Alert>
            </Snackbar>
        );
    }

    return null;
};

export default NetworkStatusMonitor;