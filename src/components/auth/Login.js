import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa';
import { IoIosArrowBack } from "react-icons/io";
import './Auth.css';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import logo from '../../assets/Logos/Logo blue.png';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await fetch('https://dummy-endpoint.com/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
    };

    const handleSignUpPage = () => {
        navigate('/register');
    }
    const handleForgotPassword = () => {
        navigate('/reset-password');
    }
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
                <h1 className='game-details-title'>Sign In</h1>
            </div>

            <img src={logo} alt="Dare To Connect" className="auth-logo" />

            <p className="auth-title">Sign in to your account</p>

            <form className="auth-form" onSubmit={handleSubmit}>
                <TextField
                    label="Email Address"
                    variant="standard"
                    name="email"
                    fullWidth
                    value={formData.email}
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

                <div className="auth-link" onClick={handleForgotPassword}>Forgot password?</div>

                <button className="primary-btn">SIGN IN</button>

                <p className="auth-footer-text">New here? Sign up below;</p>

                <button type="button" onClick={handleSignUpPage} className="secondary-btn">SIGN UP</button>
            </form>
        </div>
    );
};

export default Login;
