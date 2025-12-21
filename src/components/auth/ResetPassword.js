import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { IoIosArrowBack } from "react-icons/io";
import TextField from '@mui/material/TextField';
import { Alert, Snackbar, CircularProgress } from '@mui/material';
import './Auth.css';
import logo from '../../assets/Logos/Logo blue.png';

const ResetPassword = () => {
    const navigate = useNavigate();
    const { forgotPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!email.trim()) {
            setError('Please enter your email address');
            return;
        }
        
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address');
            return;
        }
        
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        try {
            await forgotPassword(email.trim());
            setSuccess('Reset instructions sent to your email. Please check your inbox and spam folder.');
            
            // Clear email field
            setEmail('');
            
            // Redirect to login after delay
            setTimeout(() => {
                navigate('/login');
            }, 3000);
            
        } catch (err) {
            console.error('Reset password error:', err);
            
            // Provide user-friendly error messages
            if (err.message.includes('Network error') || err.message.includes('Failed to fetch')) {
                setError('Network error. Please check your internet connection.');
            } else if (err.message.includes('Server error')) {
                setError('Server error. Please try again later.');
            } else if (err.message.includes('Email address not found')) {
                setError('Email not found. Please check the email address or sign up.');
            } else if (err.message.includes('account is not verified')) {
                setError('Account not verified. Please check your email for verification link.');
            } else {
                setError(err.message || 'Failed to send reset instructions. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };
    
    const handleBack = () => {
        navigate('/library');
    };
    
    const muiInputSx = {
        '& label.Mui-focused': {
            color: '#1674a2'
        },
        '& .MuiInput-underline:after': {
            borderBottomColor: '#1674a2'
        }
    };

    return (
        <div className="auth-page">
            <div className="game-details-header">
                <IoIosArrowBack 
                    className="back-button" 
                    onClick={handleBack} 
                    aria-label="Go back" 
                    size={24} 
                    color="#000000ff" 
                />
                <h1 className='game-details-title'>Reset Password</h1>
            </div>
            
            <img src={logo} alt="Dare To Connect" className="auth-logo" />
                
            <form className="auth-form" onSubmit={handleSubmit}>
                <TextField
                    label="Email Address*"
                    variant="standard"
                    type="email"
                    fullWidth
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                    }}
                    sx={muiInputSx}
                    disabled={loading}
                    error={!!error && error.includes('email')}
                    helperText={error && error.includes('email') ? error : ''}
                />

                <button 
                    className="primary-btn" 
                    type="submit"
                    disabled={loading}
                >
                    {loading ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <CircularProgress size={16} color="inherit" />
                            SENDING...
                        </span>
                    ) : 'Send Reset Link'}
                </button>
            </form>

            {/* Error Snackbar */}
            <Snackbar 
                open={!!error} 
                autoHideDuration={6000} 
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    severity="error" 
                    onClose={() => setError(null)}
                    sx={{ width: '100%' }}
                >
                    {error}
                </Alert>
            </Snackbar>

            {/* Success Snackbar */}
            <Snackbar 
                open={!!success} 
                autoHideDuration={3000} 
                onClose={() => setSuccess(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    severity="success" 
                    onClose={() => setSuccess(null)}
                    sx={{ width: '100%' }}
                >
                    {success}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default ResetPassword;