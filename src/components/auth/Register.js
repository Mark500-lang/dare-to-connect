import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa';
import { IoIosArrowBack } from "react-icons/io";
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import './Auth.css';

const Register = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        country: '',
        city: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await fetch('https://dummy-endpoint.com/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
        });
    };
    const handleBack = () => {
        navigate('/main/library');
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
            <IoIosArrowBack className="back-button" onClick={handleBack} aria-label="Go back" size={24} color="#000000ff" />
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
            />
            <TextField
                label="Last Name*"
                variant="standard"
                name="lastName"
                fullWidth
                value={formData.lastName}
                onChange={handleChange}
                sx={muiInputSx}
            />
            </div>

            <TextField
            label="Email Address"
            variant="standard"
            name="email"
            fullWidth
            value={formData.email}
            onChange={handleChange}
            sx={muiInputSx}
            />

            {/* ROW 2 */}
            <div className="row">
            <TextField
                label="Country*"
                variant="standard"
                name="country"
                fullWidth
                value={formData.country}
                onChange={handleChange}
                sx={muiInputSx}
            />
            <TextField
                label="City*"
                variant="standard"
                name="city"
                fullWidth
                value={formData.city}
                onChange={handleChange}
                sx={muiInputSx}
            />
            </div>

            <TextField
            label="Mobile No."
            variant="standard"
            name="phone"
            fullWidth
            value={formData.phone}
            onChange={handleChange}
            sx={muiInputSx}
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
                InputProps={{
                    endAdornment: (
                    <InputAdornment position="end">
                        {showPassword ? (
                        <FaEyeSlash
                            className="eye-icon"
                            onClick={() => setShowPassword(false)}
                        />
                        ) : (
                        <FaEye
                            className="eye-icon"
                            onClick={() => setShowPassword(true)}
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
                InputProps={{
                    endAdornment: (
                    <InputAdornment position="end">
                        {showPassword ? (
                        <FaEyeSlash
                            className="eye-icon"
                            onClick={() => setShowPassword(false)}
                        />
                        ) : (
                        <FaEye
                            className="eye-icon"
                            onClick={() => setShowPassword(true)}
                        />
                        )}
                    </InputAdornment>
                    )
                }}
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
            <button className="primary-btn">Sign Up</button>
        </form>
    </div>
  );
};

export default Register;
