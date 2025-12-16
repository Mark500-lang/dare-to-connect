import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { IoIosArrowBack } from "react-icons/io";
import TextField from '@mui/material/TextField';
import './Auth.css';
import logo from '../../assets/Logos/Logo blue.png';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        await fetch('https://dummy-endpoint.com/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
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
                <h1 className='game-details-title'>Reset Password</h1>
            </div>
        <img src={logo} alt="Dare To Connect" className="auth-logo" />
                
        <form className="auth-form" onSubmit={handleSubmit}>
            <TextField
            label="Email Address"
            variant="standard"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={muiInputSx}
            />

            <button className="primary-btn">Send Reset Link</button>
        </form>
        </div>
    );
};

export default ResetPassword;
