import React, { useState, useEffect } from 'react';
import './SideBar.css';
import { useLocation } from 'react-router-dom';
import packageJson from '../../../package.json';
import { IoHomeOutline, IoGameControllerOutline, IoList, IoMailOutline, IoShareSocial, IoPower } from "react-icons/io5";
import { FaRegUser } from "react-icons/fa6";
import UserIcon from '../../assets/User Icon.png';

const SideBar = ({ onItemClick, isOpen = true, profileImage, onClose }) => {
    const [activeItem, setActiveItem] = useState('home');
    const location = useLocation();

    const items = [
        { id: 'home', label: 'Home', icon: <IoHomeOutline /> },
        { id: 'games', label: 'Games', icon: <IoGameControllerOutline /> },
        { id: 'subscription', label: 'My Subscription', icon: <IoList /> },
        { id: 'account', label: 'My Account', icon: <FaRegUser /> },
        { id: 'help', label: 'Need Help', icon: <IoMailOutline /> },
        { id: 'referral', label: 'Tell a Friend', icon: <IoShareSocial /> },
        { id: 'logout', label: 'Logout', icon: <IoPower /> },
    ];

    // Update active item based on current route
    useEffect(() => {
        const path = location.pathname;
        
        if (path.includes('/main/library')) {
            setActiveItem('games');
        } else if (path.includes('/main/subscription')) {
            setActiveItem('subscription');
        } else if (path.includes('/main/account')) {
            setActiveItem('account');
        } else if (path.includes('/main/help')) {
            setActiveItem('help');
        } else if (path.includes('/main/referral')) {
            setActiveItem('referral');
        }
    }, [location.pathname]);

    const handleItemClick = (item) => {
        setActiveItem(item.id);
        onItemClick?.(item);
    };

    const handleCloseClick = (e) => {
        e.stopPropagation();
        onClose?.();
    };

    return (
        <>
            <div className={`SideBar-container ${isOpen ? 'open' : 'closed'}`}>
                {/* Close button for mobile */}
                <button 
                    className="sidebar-close-btn"
                    onClick={handleCloseClick}
                    aria-label="Close menu"
                >
                    ✕
                </button>
                
                <div className="sidebar-header">
                    {profileImage && <img src={profileImage} alt="Profile" className="profile-image" />}
                    <span className="version-text">Version: {packageJson.version}</span>
                </div>
                
                <nav className="sidebar-nav">
                    {items.map((item) => (
                        <button
                            key={item.id}
                            className={`sidebar-item ${activeItem === item.id ? 'active' : ''}`}
                            onClick={() => handleItemClick(item)}
                            aria-label={item.label}
                        >
                            {item.icon && <span className="sidebar-icon">{item.icon}</span>}
                            <span className="sidebar-label">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </div>
        </>
    );
};

export default SideBar;