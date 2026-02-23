import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaCamera } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import geoService from '../../services/geoService';
import { 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Button, 
  Alert, 
  Snackbar,
  CircularProgress 
} from '@mui/material';
import './EditProfile.css';

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user ? user.profilePic : null);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingGeo, setLoadingGeo] = useState({ countries: false, cities: false });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNo: '',
    countryId: '',
    cityId: ''
  });

  const [formErrors, setFormErrors] = useState({});

  // Load user data and countries on mount
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        mobileNo: user.mobileNo || '',
        countryId: user.countryId || '',
        cityId: user.cityId || ''
      });
      if (user.profilePhoto) {
        setPhotoPreview(user.profilePic);
      }
    }
    
    loadCountries();
  }, [user]);

  // Load cities when country changes
  useEffect(() => {
    if (formData.countryId) {
      loadCities(formData.countryId);
    }
  }, [formData.countryId]);

  const loadCountries = async () => {
    setLoadingGeo(prev => ({ ...prev, countries: true }));
    try {
      const countriesData = await geoService.getCountries();
      setCountries(countriesData);
    } catch (err) {
      console.error('Error loading countries:', err);
    } finally {
      setLoadingGeo(prev => ({ ...prev, countries: false }));
    }
  };

  const loadCities = async (countryId) => {
    setLoadingGeo(prev => ({ ...prev, cities: true }));
    try {
      const citiesData = await geoService.getCities(countryId);
      setCities(citiesData);
    } catch (err) {
      console.error('Error loading cities:', err);
    } finally {
      setLoadingGeo(prev => ({ ...prev, cities: false }));
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!formData.mobileNo.trim()) {
      errors.mobileNo = 'Phone number is required';
      isValid = false;
    } else if (!/^\d+$/.test(formData.mobileNo)) {
      errors.mobileNo = 'Phone number must contain only digits';
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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        // In a real app, you would upload this to your server
      };
      reader.readAsDataURL(file);
    }
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
      const profileData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        mobileNo: formData.mobileNo.trim(),
        countryId: parseInt(formData.countryId),
        cityId: parseInt(formData.cityId)
      };
      
      await updateProfile(profileData);
      
      setSuccess('Profile updated successfully!');
      
    } catch (err) {
      console.error('Profile update error:', err);
      
      if (err.message.includes('already registered')) {
        setError('This email is already registered. Please use a different email.');
      } else if (err.message.includes('network')) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.message || 'Failed to update profile. Please try again.');
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
    <div className="edit-profile-page">
      <div className="edit-profile-header">
        <FaArrowLeft onClick={() => navigate('/account')} />
        <span>Edit Profile</span>
      </div>

      {/* TOP SECTION */}
      <div className="profile-top">
        <div className="profile-image-wrapper">
          <img
            src={photoPreview || 'https://admin.daretoconnectgames.com/public/profiles/profile.png'}
            alt="Profile"
            className="profile-image"
            onError={(e) => {
              e.target.src = 'https://admin.daretoconnectgames.com/public/profiles/profile.png';
            }}
          />
          <label className="camera-icon">
            <FaCamera />
            <input 
              type="file" 
              accept="image/*" 
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div className="profile-phone">
          <TextField
            label="Mobile No."
            variant="outlined"
            name="mobileNo"
            fullWidth
            value={formData.mobileNo}
            onChange={handleChange}
            sx={muiInputSx}
            disabled={loading}
            error={!!formErrors.mobileNo}
            helperText={formErrors.mobileNo}
            required
          />
        </div>
      </div>

      {/* FORM */}
      <form className="edit-profile-form" onSubmit={handleSubmit}>
        <div className="row">
          <TextField
            label="First Name"
            variant="outlined"
            name="firstName"
            fullWidth
            value={formData.firstName}
            onChange={handleChange}
            sx={muiInputSx}
            disabled={loading}
            error={!!formErrors.firstName}
            helperText={formErrors.firstName}
            required
          />
          <TextField
            label="Last Name"
            variant="outlined"
            name="lastName"
            fullWidth
            value={formData.lastName}
            onChange={handleChange}
            sx={muiInputSx}
            disabled={loading}
            error={!!formErrors.lastName}
            helperText={formErrors.lastName}
            required
          />
        </div>

        <TextField
          label="Email Address"
          variant="outlined"
          name="email"
          fullWidth
          value={formData.email}
          onChange={handleChange}
          sx={{ ...muiInputSx, mb: 2 }}
          disabled={loading}
          error={!!formErrors.email}
          helperText={formErrors.email}
          required
        />

        <div className="row">
          <FormControl fullWidth variant="outlined" sx={muiInputSx} disabled={loading || loadingGeo.countries}>
            <InputLabel>Country</InputLabel>
            <Select
              name="countryId"
              value={formData.countryId}
              onChange={handleChange}
              label="Country"
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
              <div className="error-text">{formErrors.countryId}</div>
            )}
          </FormControl>

          <FormControl fullWidth variant="outlined" sx={muiInputSx} disabled={loading || loadingGeo.cities || !formData.countryId}>
            <InputLabel>City</InputLabel>
            <Select
              name="cityId"
              value={formData.cityId}
              onChange={handleChange}
              label="City"
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
              <div className="error-text">{formErrors.cityId}</div>
            )}
          </FormControl>
        </div>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{
            mt: 3,
            py: 1.5,
            backgroundColor: '#1674a2',
            '&:hover': {
              backgroundColor: '#0d5a7d'
            }
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'SAVE CHANGES'}
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

export default EditProfile;