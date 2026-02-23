import React, { useState, useEffect, useRef } from 'react';
import './SideBar.css';
import { useLocation, useNavigate } from 'react-router-dom';
import packageJson from '../../../package.json';
import { IoHomeOutline, IoGameControllerOutline, IoList, IoMailOutline, IoShareSocial, IoPower } from "react-icons/io5";
import { FaRegUser } from "react-icons/fa6";
import { useAuth } from '../../context/AuthContext';
import shareService from '../../services/shareService'; // Import share service

const SideBar = ({ onItemClick, isOpen = true, profileImage, onClose, enableGestures = true }) => {
    const [activeItem, setActiveItem] = useState('home');
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

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
        
        if (path.includes('/library')) {
            setActiveItem('games');
        } else if (path.includes('/subscription')) {
            setActiveItem('subscription');
        } else if (path.includes('/account')) {
            setActiveItem('account');
        } else if (path.includes('/help')) {
            setActiveItem('help');
        }
    }, [location.pathname]);

    const handleItemClick = async (item) => {
        setActiveItem(item.id);
        onItemClick?.(item);
        
        // Handle navigation based on item id
        switch (item.id) {
            case 'home':
                navigate('/library');
                break;
            case 'games':
                navigate('/library');
                break;
            case 'subscription':
                navigate('/subscriptions');
                break;
            case 'account':
                navigate('/account');
                break;
            case 'help':
                navigate('/help');
                break;
            case 'referral':
                // Use share service for native sharing
                await shareService.shareApp();
                setActiveItem(prev => prev); // Don't change active item for share
                break;
            case 'logout':
                logout();
                navigate('/'); // Redirect to splash screen
                break;
            default:
                navigate('/library');
        }
        
        // Close sidebar on mobile after click
        if (window.innerWidth <= 768) {
            onClose?.();
        }
    };

    const handleCloseClick = (e) => {
        e.stopPropagation();
        onClose?.();
    };

    return (
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
                {profileImage && <img src={profileImage} alt="Profile" className="sidebar-user-icon" />}
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
    );
};

export default SideBar;