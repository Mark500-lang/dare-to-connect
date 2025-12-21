import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './Layout.css';
import SideBar from './common/SideBar';
import profileImage from '../assets/User Icon.png';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [touchStartX, setTouchStartX] = useState(null);
    const [touchEndX, setTouchEndX] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Determine if we should show hamburger based on current page
    const shouldShowHamburger = !['/', '/login', '/register', '/reset-password'].includes(location.pathname);

    const handleSidebarItemClick = (item) => {
        const routeMap = {
            'home': '/library',
            'games': '/library',
            'subscription': '/subscription',
            'account': '/account',
            'help': '/help',
            'referral': '/referral',
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

    // Handle swipe gestures for sidebar
    useEffect(() => {
        const minSwipeDistance = 50;
        
        const handleTouchStart = (e) => {
            setTouchStartX(e.touches[0].clientX);
        };

        const handleTouchMove = (e) => {
            setTouchEndX(e.touches[0].clientX);
        };

        const handleTouchEnd = () => {
            if (!touchStartX || !touchEndX) return;
            
            const distance = touchStartX - touchEndX;
            const swipeDistance = Math.abs(distance);
            
            if (swipeDistance > minSwipeDistance) {
                if (distance > 0 && sidebarOpen) {
                    // Left swipe - close sidebar
                    setSidebarOpen(false);
                } else if (distance < 0 && !sidebarOpen) {
                    // Right swipe - open sidebar
                    // Only open from edge swipes (first 20px of screen)
                    if (touchStartX < 20) {
                        setSidebarOpen(true);
                    }
                }
            }
            
            // Reset touch coordinates
            setTouchStartX(null);
            setTouchEndX(null);
        };

        // Only enable swipe gestures on mobile
        if (window.innerWidth <= 768) {
            document.addEventListener('touchstart', handleTouchStart);
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', handleTouchEnd);
        }

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [touchStartX, touchEndX, sidebarOpen]);

    return (
        <div className="app-layout">
            {/* Sidebar Overlay - closes sidebar when clicked */}
            {sidebarOpen && (
                <div 
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                    onTouchStart={(e) => e.stopPropagation()}
                />
            )}
            
            {/* Sidebar with swipe to close enabled */}
            <SideBar 
                onItemClick={handleSidebarItemClick}
                isOpen={sidebarOpen}
                profileImage={profileImage}
                onClose={() => setSidebarOpen(false)}
                enableGestures={true}
            />
            
            {/* Main Content Area */}
            <main 
                className="main-content"
                onTouchStart={(e) => {
                    // Only track touches near the left edge for opening sidebar
                    if (e.touches[0].clientX < 20 && !sidebarOpen) {
                        setTouchStartX(e.touches[0].clientX);
                    }
                }}
                onTouchMove={(e) => {
                    if (touchStartX !== null && touchStartX < 20) {
                        setTouchEndX(e.touches[0].clientX);
                    }
                }}
            >
                {/* Hamburger toggle button - shown on all pages except splash/auth */}
                {/* {shouldShowHamburger && (
                    <button 
                        className="global-sidebar-toggle"
                        onClick={toggleSidebar}
                        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
                    >
                        <span className="toggle-icon">☰</span>
                    </button>
                )} */}
                
                {/* Outlet will render the current page */}
                <Outlet context={{ toggleSidebar }} />
            </main>
        </div>
    );
};

export default Layout;