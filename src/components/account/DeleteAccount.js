import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import './DeleteAccount.css';

const DeleteAccount = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(true); // Open confirmation dialog by default

  const handleDeleteAccount = async () => {
    setLoading(true);
    setError(null);

    try {
      // Note: You'll need to implement a delete account API endpoint
      // For now, we'll simulate the deletion
      const response = await fetch('https://admin.daretoconnectgames.com/api/deleteAccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hashedKey: 'daretoconnect_games_api_key_2024',
          accessToken: localStorage.getItem('accessToken')
        })
      });

      const data = await response.json();
      
      if (data.status === 'Ok') {
        // Logout and redirect
        logout();
        navigate('/login');
      } else {
        throw new Error(data.message || 'Failed to delete account');
      }
      
    } catch (err) {
      console.error('Delete account error:', err);
      setError(err.message || 'Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="delete-account-page">
      <div className="delete-account-header">
        <FaArrowLeft onClick={() => navigate('/account')} />
        <span>Delete Account</span>
      </div>

      <div className="warning-content">
        <div className="warning-icon">
          <FaExclamationTriangle />
        </div>
        
        <h3>Delete Your Account</h3>
        
        <p className="warning-text">
          <strong>Warning:</strong> This action is permanent and cannot be undone.
        </p>
        
        <div className="consequences-list">
          <p>All your data will be deleted including:</p>
          <ul>
            <li>Your profile information</li>
            <li>Game progress and history</li>
            <li>Subscription information</li>
            <li>Payment history</li>
            <li>All other account data</li>
          </ul>
        </div>
        
        <Button
          variant="contained"
          fullWidth
          onClick={() => setConfirmOpen(true)}
          sx={{
            mt: 3,
            py: 1.5,
            backgroundColor: '#dc3545',
            '&:hover': {
              backgroundColor: '#c82333'
            }
          }}
        >
          DELETE MY ACCOUNT
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '15px',
            padding: '10px'
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', color: '#333', fontWeight: 600 }}>
          Confirm
        </DialogTitle>
        
        <DialogContent sx={{ textAlign: 'center' }}>
          <p style={{ margin: '10px 0 20px', color: '#666', lineHeight: 1.5 }}>
            Do you want to completely delete your Dare to Connect Games Account? 
            This action will delete all your records and is not reversible.
          </p>
        </DialogContent>
        
        <DialogActions sx={{ justifyContent: 'center', gap: '15px', padding: '20px' }}>
          <Button
            variant="outlined"
            onClick={() => setConfirmOpen(false)}
            sx={{
              minWidth: '100px',
              borderColor: '#6c757d',
              color: '#6c757d',
              '&:hover': {
                borderColor: '#545b62',
                backgroundColor: 'rgba(108, 117, 125, 0.04)'
              }
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          
          <Button
            variant="contained"
            onClick={handleDeleteAccount}
            sx={{
              minWidth: '100px',
              backgroundColor: '#dc3545',
              '&:hover': {
                backgroundColor: '#c82333'
              }
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Message */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default DeleteAccount;