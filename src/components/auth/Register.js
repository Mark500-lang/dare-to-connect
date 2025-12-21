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

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        countryId: '',
        cityId: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const [formErrors, setFormErrors] = useState({
        firstName: '',
        lastName: '',
        countryId: '',
        cityId: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        loadCountries();
    }, []);

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
            const countriesData = await geoService.getCountries();
            setCountries(countriesData);

            console.log(countriesData);
        } catch (err) {
            console.error('Error loading countries:', err);
            setError('Failed to load countries. Please try again.');
        } finally {
            setLoadingCountries(false);
        }
    };

    const loadCities = async (countryId) => {
        setLoadingCities(true);
        try {
            const citiesData = await geoService.getCities(countryId);
            setCities(citiesData);
        } catch (err) {
            console.error('Error loading cities:', err);
            setError('Failed to load cities. Please try again.');
        } finally {
            setLoadingCities(false);
        }
    };

    const validateForm = () => {
        const errors = {};
        let isValid = true;

        if (!formData.firstName.trim()) {
            errors.firstName = 'First name is required';
            isValid = false;
        } else if (formData.firstName.trim().length < 3) {
            errors.firstName = 'First name must be at least 3 characters';
            isValid = false;
        }

        if (!formData.lastName.trim()) {
            errors.lastName = 'Last name is required';
            isValid = false;
        } else if (formData.lastName.trim().length < 3) {
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

        if (!formData.phone.trim()) {
            errors.phone = 'Phone number is required';
            isValid = false;
        } else if (!/^\d+$/.test(formData.phone)) {
            errors.phone = 'Phone number must contain only digits';
            isValid = false;
        }

        if (!formData.countryId) {
            errors.countryId = 'Country selection is required';
            isValid = false;
        }

        if (!formData.cityId) {
            errors.cityId = 'City selection is required';
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
        
        // Clear error for this field when user starts typing
        if (formErrors[name]) {
            setFormErrors({ ...formErrors, [name]: '' });
        }
        
        // Clear general error
        if (error) setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        try {
            const registrationData = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                password: formData.password,
                countryId: parseInt(formData.countryId),
                cityId: parseInt(formData.cityId)
            };
            
            await register(registrationData);
            
            setSuccess('Registration successful! Please check your email for verification link.');
            
            // Clear form
            setFormData({
                firstName: '',
                lastName: '',
                countryId: '',
                cityId: '',
                email: '',
                phone: '',
                password: '',
                confirmPassword: ''
            });
            
            // Redirect to login after delay
            setTimeout(() => {
                navigate('/login');
            }, 3000);
            
        } catch (err) {
            console.error('Registration error:', err);
            
            // Handle specific error messages
            if (err.message.includes('already registered')) {
                setError('This email is already registered. Please try a different email or login.');
            } else if (err.message.includes('network')) {
                setError('Network error. Please check your internet connection.');
            } else if (err.message.includes('server')) {
                setError('Server error. Please try again later.');
            } else {
                setError(err.message || 'Registration failed. Please try again.');
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
                <h1 className='game-details-title'>Register</h1>
            </div>

            <p className="auth-title">Fill in your details to continue!</p>

            <form className="auth-form" onSubmit={handleSubmit}>
                {/* ROW 1 */}
                <div className="row">
                    <TextField
                        label="First Name*"
                        variant="standard"
                        name="firstName"
                        fullWidth
                        value={formData.firstName}
                        onChange={handleChange}
                        sx={muiInputSx}
                        disabled={loading}
                        error={!!formErrors.firstName}
                        helperText={formErrors.firstName}
                    />
                    <TextField
                        label="Last Name*"
                        variant="standard"
                        name="lastName"
                        fullWidth
                        value={formData.lastName}
                        onChange={handleChange}
                        sx={muiInputSx}
                        disabled={loading}
                        error={!!formErrors.lastName}
                        helperText={formErrors.lastName}
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
                />

                {/* Country and City Selection */}
                <div className="row">
                    <FormControl fullWidth variant="standard" sx={muiInputSx} disabled={loading || loadingCountries}>
                        <InputLabel>Country*</InputLabel>
                        <Select
                            name="countryId"
                            value={formData.countryId}
                            onChange={handleChange}
                            label="Country*"
                            error={!!formErrors.countryId}
                        >
                            <MenuItem value="">
                                <em>Select Country</em>
                            </MenuItem>
                            {countries.map((country) => (
                                <MenuItem key={country.id} value={country.id}>
                                    {country.name}
                                </MenuItem>
                            ))}
                        </Select>
                        {formErrors.countryId && (
                            <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px' }}>
                                {formErrors.countryId}
                            </div>
                        )}
                    </FormControl>

                    <FormControl fullWidth variant="standard" sx={muiInputSx} disabled={loading || loadingCities || !formData.countryId}>
                        <InputLabel>City*</InputLabel>
                        <Select
                            name="cityId"
                            value={formData.cityId}
                            onChange={handleChange}
                            label="City*"
                            error={!!formErrors.cityId}
                        >
                            <MenuItem value="">
                                <em>Select City</em>
                            </MenuItem>
                            {cities.map((city) => (
                                <MenuItem key={city.id} value={city.id}>
                                    {city.name}
                                </MenuItem>
                            ))}
                        </Select>
                        {formErrors.cityId && (
                            <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px' }}>
                                {formErrors.cityId}
                            </div>
                        )}
                    </FormControl>
                </div>

                <TextField
                    label="Mobile No.*"
                    variant="standard"
                    name="phone"
                    fullWidth
                    value={formData.phone}
                    onChange={handleChange}
                    sx={muiInputSx}
                    disabled={loading}
                    error={!!formErrors.phone}
                    helperText={formErrors.phone}
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
                />

                <div className="auth-privacy-text">
                    <p>By creating an account you agree to our <span><a href="https://www.privacypolicies.com/live/396845b8-e470-4bed-8cbb-5432ab867986"
                    className="privacy-link"
                    target="_blank"
                    rel="noopener noreferrer">Terms of Use</a></span>  and <span><a href="https://www.privacypolicies.com/live/396845b8-e470-4bed-8cbb-5432ab867986"
                    className="privacy-link"
                    target="_blank"
                    rel="noopener noreferrer">Privacy Policy</a></span></p>
                </div>
                
                <button 
                    className="primary-btn" 
                    type="submit"
                    disabled={loading}
                >
                    {loading ? (
                        <span stylibraryle={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <CircularProgress size={16} color="inherit" />
                            SIGNING UP...
                        </span>
                    ) : 'Sign Up'}
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

export default Register;