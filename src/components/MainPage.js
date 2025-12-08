import React, { useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import './MainPage.css';
import SideBar from './common/SideBar';
import profileImage from '../assets/Vector Icons/Job interview Icon.png';

const MainPage = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const handleSidebarItemClick = (item) => {
        const routeMap = {
            'home': '/main/library',
            'games': '/main/library',
            'subscription': '/main/subscription',
            'account': '/main/account',
            'help': '/main/help',
            'referral': '/main/referral',
            'logout': '/'
        };

        if (item.id === 'logout') {
            // Handle logout logic
            navigate('/');
        } else if (routeMap[item.id]) {
            navigate(routeMap[item.id]);
            // Close sidebar on mobile after selecting item
            if (window.innerWidth <= 768) {
                setSidebarOpen(false);
            }
        }
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="main-page">
            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            
            {/* Sidebar */}
            <SideBar 
                onItemClick={handleSidebarItemClick}
                isOpen={sidebarOpen}
                profileImage={profileImage}
                onClose={() => setSidebarOpen(false)}
            />
            
            {/* Main Content */}
            <div className="main-content">
                {/* Sidebar Toggle Button - Always visible at top left */}
                <button 
                    className="sidebar-toggle"
                    onClick={toggleSidebar}
                    aria-label={sidebarOpen ? "Close menu" : "Open menu"}
                >
                    <span className="toggle-icon">☰</span>
                </button>
                
                {/* Child route content */}
                <Outlet />
            </div>
        </div>
    );
};

export default MainPage;