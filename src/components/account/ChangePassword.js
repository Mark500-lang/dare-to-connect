import React, { useState } from 'react';
import { FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  TextField, 
  Button, 
  Alert, 
  Snackbar,
  CircularProgress,
  InputAdornment,
  IconButton 
} from '@mui/material';
import './ChangePassword.css';

const ChangePassword = () => {
  const navigate = useNavigate();
  const { changePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!formData.currentPassword) {
      errors.currentPassword = 'Current password is required';
      isValid = false;
    }

    if (!formData.newPassword) {
      errors.newPassword = 'New password is required';
      isValid = false;
    } else if (formData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
      isValid = false;
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field]
    });
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
      await changePassword(formData.currentPassword, formData.newPassword);
      
      setSuccess('Password changed successfully!');
      
      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
    } catch (err) {
      console.error('Password change error:', err);
      
      if (err.message.includes('current password') || err.message.includes('incorrect')) {
        setError('Current password is incorrect. Please try again.');
      } else if (err.message.includes('network')) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.message || 'Failed to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
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
    <div className="change-password-page">
      <div className="change-password-header">
        <FaArrowLeft onClick={() => navigate('/account')} />
        <span>Change Password</span>
      </div>

      <form className="change-password-form" onSubmit={handleSubmit}>
        {[
          { name: 'currentPassword', label: 'Current Password', field: 'current' },
          { name: 'newPassword', label: 'New Password', field: 'new' },
          { name: 'confirmPassword', label: 'Confirm Password', field: 'confirm' }
        ].map(({ name, label, field }) => (
          <div className="password-field" key={name}>
            <TextField
              label={label}
              variant="outlined"
              type={showPasswords[field] ? 'text' : 'password'}
              name={name}
              fullWidth
              value={formData[name]}
              onChange={handleChange}
              sx={muiInputSx}
              disabled={loading}
              error={!!formErrors[name]}
              helperText={formErrors[name]}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility(field)}
                      edge="end"
                    >
                      {showPasswords[field] ? <FaEyeSlash /> : <FaEye />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </div>
        ))}

        <div className="password-strength">
          <p className="strength-text">Password Requirements:</p>
          <ul className="requirements-list">
            <li className={formData.newPassword.length >= 6 ? 'valid' : ''}>
              At least 6 characters
            </li>
            <li className={/[A-Z]/.test(formData.newPassword) ? 'valid' : ''}>
              One uppercase letter
            </li>
            <li className={/\d/.test(formData.newPassword) ? 'valid' : ''}>
              One number
            </li>
          </ul>
        </div>

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
          {loading ? <CircularProgress size={24} color="inherit" /> : 'UPDATE PASSWORD'}
        </Button>
      </form>

      {/* Success/Error Messages */}
      <Snackbar 
        open={!!success} 
        autoHideDuration={3000} 
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

export default ChangePassword;