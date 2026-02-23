import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoIosArrowBack } from "react-icons/io";
import { FaWhatsapp,  } from 'react-icons/fa';
import { IoMailOutline } from 'react-icons/io5';

import { 
  TextField, 
  Button, 
  Alert, 
  Snackbar,
  CircularProgress,
  Box,
  Typography,
  Grid,
  Paper
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import supportService from '../services/supportService';
import './NeedHelp.css';

const NeedHelp = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
    mobileNumber: user?.mobileNo || '',
    message: ''
  });

  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
      isValid = false;
    }

    if (!formData.mobileNumber.trim()) {
      errors.mobileNumber = 'Mobile number is required';
      isValid = false;
    } else if (!/^[\d\s\-+()]+$/.test(formData.mobileNumber)) {
      errors.mobileNumber = 'Please enter a valid mobile number';
      isValid = false;
    }

    if (!formData.message.trim()) {
      errors.message = 'Message is required';
      isValid = false;
    } else if (formData.message.length < 10) {
      errors.message = 'Message must be at least 10 characters';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
    
    if (success) setSuccess(null);
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
      await supportService.submitSupportRequest(formData);
      
      setSuccess('Support request submitted successfully! We\'ll get back to you soon.');
      
      // Clear form message only
      setFormData({
        ...formData,
        message: ''
      });
      
    } catch (err) {
      console.error('Support request error:', err);
      
      if (err.message.includes('network')) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.message || 'Failed to submit support request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsappClick = () => {
    const phoneNumber = '+254700000000'; // Replace with your support number
    const message = encodeURIComponent(`Hello, I need help with Dare to Connect.`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const handleMailClick = () => {
    window.location.href = 'mailto:support@daretoconnectgames.com?subject=Support Request - Dare to Connect';
  };

  const muiInputSx = {
    '& label.Mui-focused': {
      color: '#1674a2'
    },
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: '#1674a2',
      }
    }
  };

  return (
    <div className="need-help-page">
      <div className="game-details-header">
        <IoIosArrowBack 
            className="back-button" 
            onClick={() => navigate(-1)} 
            aria-label="Go back" 
            size={24} 
            color="#000000ff" 
        />
        <h1 className='game-details-title'>Need Help</h1>
      </div>

      <Paper className="need-help-content" elevation={0}>
        <Typography variant="p" className="welcome-text" gutterBottom>
          We are happy to hear from you. let us know your queries and feedback
        </Typography>

        {/* Quick Action Buttons */}
        <Grid container spacing={2} className="quick-actions">
          <Grid size={6}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<FaWhatsapp />}
              onClick={handleWhatsappClick}
              sx={{
                py: 1.5,
                borderColor: '#25D366',
                color: '#25D366',
                '&:hover': {
                  borderColor: '#128C7E',
                  backgroundColor: 'rgba(37, 211, 102, 0.04)'
                }
              }}
            >
              WhatsApp
            </Button>
          </Grid>
          <Grid size={6}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<IoMailOutline />}
              onClick={handleMailClick}
              sx={{
                py: 1.5,
                borderColor: '#1674a2',
                color: '#1674a2',
                '&:hover': {
                  borderColor: '#0d5a7d',
                  backgroundColor: 'rgba(22, 116, 162, 0.04)'
                }
              }}
            >
              Mail Us
            </Button>
          </Grid>
        </Grid>

        {/* Support Form */}
        <form className="support-form" onSubmit={handleSubmit}>
          <Box className="form-fields">
            <TextField
              label="Full Name"
              variant="outlined"
              name="fullName"
              fullWidth
              value={formData.fullName}
              onChange={handleChange}
              sx={muiInputSx}
              disabled={loading}
              error={!!formErrors.fullName}
              helperText={formErrors.fullName}
              required
            />
            
            <TextField
              label="Mobile Number"
              variant="outlined"
              name="mobileNumber"
              fullWidth
              value={formData.mobileNumber}
              onChange={handleChange}
              sx={muiInputSx}
              disabled={loading}
              error={!!formErrors.mobileNumber}
              helperText={formErrors.mobileNumber}
              required
              margin="normal"
            />
            
            <TextField
              label="Your Message"
              variant="outlined"
              name="message"
              fullWidth
              multiline
              rows={4}
              value={formData.message}
              onChange={handleChange}
              sx={muiInputSx}
              disabled={loading}
              error={!!formErrors.message}
              helperText={formErrors.message}
              required
              margin="normal"
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              mt: 2,
              py: 1.5,
              backgroundColor: '#1674a2',
              '&:hover': {
                backgroundColor: '#0d5a7d'
              }
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'SUBMIT NOW'}
          </Button>
        </form>
      </Paper>

      {/* Success/Error Messages */}
      <Snackbar 
        open={!!success} 
        autoHideDuration={5000} 
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>

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

export default NeedHelp;