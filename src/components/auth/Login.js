import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { IoIosArrowBack } from "react-icons/io";
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { Alert, Snackbar, CircularProgress } from '@mui/material';
import './Auth.css';
import logo from '../../assets/Logos/Logo blue.png';
import { useStatusBar } from '../../hooks/useStatusBar';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    // Set status bar style
    useStatusBar('dark', '#ffffff');


    // Read activation message passed by useDeepLink hook
    const activationMessage = location.state?.message || null;

    const [formData, setFormData] = useState({
        email: location.state?.email || '', // Pre-fill email if passed from deep link
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(activationMessage); // Show activation message immediately
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            setError('Please fill in all required fields');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await login(formData.email, formData.password);
            setSuccess('Login successful! Redirecting...');
            setTimeout(() => navigate('/library'), 1500);
        } catch (err) {
            console.error('Login error:', err);

            if (err.message.includes('Network error') || err.message.includes('Failed to fetch')) {
                setError('Network error. Please check your internet connection and try again.');
            } else if (err.message.includes('Server error')) {
                setError('Server error. Please try again in a few minutes.');
            } else if (err.message.includes('Wrong email address or password')) {
                setError('Invalid email or password. Please try again.');
            } else if (err.message.includes('Email address not found')) {
                setError('Email not found. Please sign up first.');
            } else if (err.message.includes('account is not verified')) {
                setError('Account not verified. Please check your email for the verification link.');
            } else {
                setError(err.message || 'Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const muiInputSx = {
        '& label.Mui-focused': { color: '#1674a2' },
        '& .MuiInput-underline:after': { borderBottomColor: '#1674a2' }
    };

    return (
        <div className="standalone-page">
            <div className="game-details-header">
                <IoIosArrowBack
                    className="back-button"
                    onClick={() => navigate('/library')}
                    aria-label="Go back"
                    color="#000000ff"
                />
                <h1 className='game-details-title'>Sign In</h1>
            </div>

            <img src={logo} alt="Dare To Connect" className="auth-logo" />

            {/* Activation success banner — shown inline at top, not as a snackbar */}
            {activationMessage && (
                <Alert
                    severity="success"
                    sx={{ mx: 2, mb: 1, borderRadius: 2 }}
                    onClose={() => {}}
                >
                    {activationMessage}
                </Alert>
            )}
            <div className="auth-content">
                <p className="auth-title">Sign in to your account</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <TextField
                        label="Email Address"
                        variant="standard"
                        name="email"
                        type="email"
                        fullWidth
                        value={formData.email}
                        onChange={handleChange}
                        sx={muiInputSx}
                        required
                        disabled={loading}
                    />

                    <TextField
                        label="Password*"
                        variant="standard"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        fullWidth
                        value={formData.password}
                        onChange={handleChange}
                        sx={muiInputSx}
                        required
                        disabled={loading}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    {showPassword ? (
                                        <FaEyeSlash
                                            className="eye-icon"
                                            onClick={() => !loading && setShowPassword(false)}
                                            style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
                                        />
                                    ) : (
                                        <FaEye
                                            className="eye-icon"
                                            onClick={() => !loading && setShowPassword(true)}
                                            style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
                                        />
                                    )}
                                </InputAdornment>
                            )
                        }}
                    />

                    <div
                        className="auth-link"
                        onClick={() => !loading && navigate('/reset-password')}
                        style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
                    >
                        Forgot password?
                    </div>

                    <button className="primary-btn" disabled={loading} type="submit">
                        {loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <CircularProgress size={16} color="inherit" />
                                SIGNING IN...
                            </span>
                        ) : 'SIGN IN'}
                    </button>

                    <p className="auth-footer-text">New here? Sign up below;</p>

                    <button
                        type="button"
                        onClick={() => !loading && navigate('/register')}
                        className="secondary-btn"
                        disabled={loading}
                    >
                        SIGN UP
                    </button>
                </form>
                
            </div>

            {/* Error Snackbar */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="error" onClose={() => setError(null)} sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>

            {/* Login success Snackbar */}
            <Snackbar
                open={!!success && !activationMessage}
                autoHideDuration={3000}
                onClose={() => setSuccess(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setSuccess(null)} sx={{ width: '100%' }}>
                    {success}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default Login;