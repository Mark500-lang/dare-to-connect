import React from 'react';
import { useNavigate } from "react-router-dom";import './Splash.css';
import AppLogo from "../assets/Logos/Logo - white.png";
const Splash = () => {

    const navigate = useNavigate();  

    const handleContinue = async () => {
        navigate("/library");
    };
    return (
        <div className="splash-container">
            <img src={AppLogo} alt="App Logo" className="splash-logo" />
            <div className="splash-content">
                <button onClick={handleContinue} className="splash-button">Play Now</button>
                <a className='promo-link' target='blank' href='https://daretoconnectgames.com/'>www.daretoconnectgames.com</a>
            </div>
        </div>
    );
};

export default Splash;