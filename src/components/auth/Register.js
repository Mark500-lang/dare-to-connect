import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import geoService from '../../services/geoService';
import { IoIosArrowBack } from "react-icons/io";
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { Alert, Snackbar, CircularProgress, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import './Auth.css';
import { useStatusBar } from '../../hooks/useStatusBar';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    useStatusBar('light', '#ffffff');

    const [showPassword,     setShowPassword]     = useState(false);
    const [loading,          setLoading]          = useState(false);
    const [error,            setError]            = useState(null);
    const [success,          setSuccess]          = useState(null);
    const [countries,        setCountries]        = useState([]);
    const [cities,           setCities]           = useState([]);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [loadingCities,    setLoadingCities]    = useState(false);

    const [formData, setFormData] = useState({
        firstName:       '',
        lastName:        '',
        countryId:       '',
        cityId:          '',
        email:           '',
        phone:           '',
        password:        '',
        confirmPassword: ''
    });

    const [formErrors, setFormErrors] = useState({});

    useEffect(() => { loadCountries(); }, []);

    useEffect(() => {
        if (formData.countryId) {
            loadCities(formData.countryId);
        } else {
            setCities([]);
            setFormData(prev => ({ ...prev, cityId: '' }));
        }
    }, [formData.countryId]);

    const loadCountries = async () => {
        setLoadingCountries(true);
        try {
            const data = await geoService.getCountries();
            setCountries(data);
        } catch (err) {
            setError('Failed to load countries. Please try again.');
        } finally {
            setLoadingCountries(false);
        }
    };

    const loadCities = async (countryId) => {
        setLoadingCities(true);
        try {
            const data = await geoService.getCities(countryId);
            setCities(data);
        } catch (err) {
            setError('Failed to load cities. Please try again.');
        } finally {
            setLoadingCities(false);
        }
    };

    const validateForm = () => {
        const errors = {};
        let isValid  = true;

        if (formData.firstName && formData.firstName.trim().length < 3) {
            errors.firstName = 'First name must be at least 3 characters';
            isValid = false;
        }
        if (formData.lastName && formData.lastName.trim().length < 3) {
            errors.lastName = 'Last name must be at least 3 characters';
            isValid = false;
        }
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
            isValid = false;
        }
        if (formData.phone.trim() && !/^\d+$/.test(formData.phone)) {
            errors.phone = 'Phone number must contain only digits';
            isValid = false;
        }
        if (!formData.password) {
            errors.password = 'Password is required';
            isValid = false;
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
            isValid = false;
        }
        if (!formData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
            isValid = false;
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (formErrors[name]) setFormErrors({ ...formErrors, [name]: '' });
        if (error) setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await register({
                firstName: formData.firstName.trim(),
                lastName:  formData.lastName.trim(),
                email:     formData.email.trim(),
                phone:     formData.phone.trim(),
                password:  formData.password,
                countryId: parseInt(formData.countryId) || 0,
                cityId:    parseInt(formData.cityId)    || 0,
            });

            setSuccess('Registration successful! Please check your email for a verification link.');
            setFormData({ firstName: '', lastName: '', countryId: '', cityId: '', email: '', phone: '', password: '', confirmPassword: '' });
            setTimeout(() => navigate('/login'), 3000);

        } catch (err) {
            if (err.message.includes('already registered')) {
                setError('This email is already registered. Please login instead.');
            } else if (err.message.includes('network')) {
                setError('Network error. Please check your internet connection.');
            } else {
                setError(err.message || 'Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const muiInputSx = {
        '& label.Mui-focused':         { color: '#1674a2' },
        '& .MuiInput-underline:after': { borderBottomColor: '#1674a2' },
    };

    return (
        <div className="standalone-page">
            <div className="game-details-header">
                <IoIosArrowBack className="back-button" onClick={() => navigate('/login')}
                    aria-label="Go back" color="#000000ff" />
                <h1 className="game-details-title">Register</h1>
            </div>

            <div className="auth-content">
                <p className="auth-title">Fill in your details to continue!</p>

                {/* autocomplete="on" + unique field ids = Android keyboard suggestions
                    and password manager autofill across the whole form              */}
                <form className="auth-form" onSubmit={handleSubmit} autoComplete="on">

                    <div className="row">
                        <TextField
                            label="First Name"
                            variant="standard"
                            name="firstName"
                            fullWidth
                            value={formData.firstName}
                            onChange={handleChange}
                            sx={muiInputSx}
                            disabled={loading}
                            error={!!formErrors.firstName}
                            helperText={formErrors.firstName}
                            inputProps={{
                                id:             'reg-first-name',
                                autoComplete:   'given-name',
                                autoCorrect:    'off',
                                autoCapitalize: 'words',
                            }}
                        />
                        <TextField
                            label="Last Name"
                            variant="standard"
                            name="lastName"
                            fullWidth
                            value={formData.lastName}
                            onChange={handleChange}
                            sx={muiInputSx}
                            disabled={loading}
                            error={!!formErrors.lastName}
                            helperText={formErrors.lastName}
                            inputProps={{
                                id:             'reg-last-name',
                                autoComplete:   'family-name',
                                autoCorrect:    'off',
                                autoCapitalize: 'words',
                            }}
                        />
                    </div>

                    <TextField
                        label="Email Address*"
                        variant="standard"
                        name="email"
                        type="email"
                        fullWidth
                        value={formData.email}
                        onChange={handleChange}
                        sx={muiInputSx}
                        disabled={loading}
                        error={!!formErrors.email}
                        helperText={formErrors.email}
                        inputProps={{
                            id:             'reg-email',
                            autoComplete:   'email',        // ← keyboard shows email suggestions
                            autoCorrect:    'off',
                            autoCapitalize: 'off',
                            spellCheck:     false,
                        }}
                    />

                    <div className="row">
                        <FormControl fullWidth variant="standard" sx={muiInputSx}
                            disabled={loading || loadingCountries}>
                            <InputLabel htmlFor="reg-country">Country</InputLabel>
                            <Select
                                inputProps={{ id: 'reg-country' }}
                                name="countryId"
                                value={formData.countryId}
                                onChange={handleChange}
                                error={!!formErrors.countryId}
                            >
                                <MenuItem value=""><em>Select Country</em></MenuItem>
                                {countries.map(c => (
                                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                ))}
                            </Select>
                            {formErrors.countryId && (
                                <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: 4 }}>
                                    {formErrors.countryId}
                                </div>
                            )}
                        </FormControl>

                        <FormControl fullWidth variant="standard" sx={muiInputSx}
                            disabled={loading || loadingCities || !formData.countryId}>
                            <InputLabel htmlFor="reg-city">City</InputLabel>
                            <Select
                                inputProps={{ id: 'reg-city' }}
                                name="cityId"
                                value={formData.cityId}
                                onChange={handleChange}
                                error={!!formErrors.cityId}
                            >
                                <MenuItem value=""><em>Select City</em></MenuItem>
                                {cities.map(c => (
                                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                ))}
                            </Select>
                            {formErrors.cityId && (
                                <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: 4 }}>
                                    {formErrors.cityId}
                                </div>
                            )}
                        </FormControl>
                    </div>

                    <TextField
                        label="Mobile No."
                        variant="standard"
                        name="phone"
                        type="tel"
                        fullWidth
                        value={formData.phone}
                        onChange={handleChange}
                        sx={muiInputSx}
                        disabled={loading}
                        error={!!formErrors.phone}
                        helperText={formErrors.phone}
                        inputProps={{
                            id:           'reg-phone',
                            autoComplete: 'tel',
                        }}
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
                        disabled={loading}
                        error={!!formErrors.password}
                        helperText={formErrors.password}
                        inputProps={{
                            id:             'reg-password',
                            autoComplete:   'new-password',   // tells password manager: offer to save
                            autoCorrect:    'off',
                            autoCapitalize: 'off',
                            spellCheck:     false,
                        }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    {showPassword
                                        ? <FaEyeSlash className="eye-icon"
                                            onClick={() => !loading && setShowPassword(false)}
                                            style={{ cursor: loading ? 'not-allowed' : 'pointer' }} />
                                        : <FaEye className="eye-icon"
                                            onClick={() => !loading && setShowPassword(true)}
                                            style={{ cursor: loading ? 'not-allowed' : 'pointer' }} />
                                    }
                                </InputAdornment>
                            )
                        }}
                    />

                    <TextField
                        label="Confirm Password*"
                        variant="standard"
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        fullWidth
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        sx={muiInputSx}
                        disabled={loading}
                        error={!!formErrors.confirmPassword}
                        helperText={formErrors.confirmPassword}
                        inputProps={{
                            id:             'reg-confirm-password',
                            autoComplete:   'new-password',
                            autoCorrect:    'off',
                            autoCapitalize: 'off',
                            spellCheck:     false,
                        }}
                    />

                    <div className="auth-privacy-text">
                        <p>By creating an account you agree to our{' '}
                            <a href="https://daretoconnectgames.com/privacy-policy"
                                className="privacy-link" target="_blank" rel="noopener noreferrer">
                                Privacy Policy
                            </a>
                        </p>
                    </div>

                    <button className="primary-btn" type="submit" disabled={loading}>
                        {loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <CircularProgress size={16} color="inherit" />
                                SIGNING UP...
                            </span>
                        ) : 'Sign Up'}
                    </button>
                </form>
            </div>

            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity="error" onClose={() => setError(null)} sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity="success" onClose={() => setSuccess(null)} sx={{ width: '100%' }}>
                    {success}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default Register;