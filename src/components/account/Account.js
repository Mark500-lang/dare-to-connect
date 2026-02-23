import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { useAuth } from '../../context/AuthContext';
import './Account.css';
import packageJson from '../../../package.json';

const Account = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/library');
  };

  return (
    <div className="account-page">
      {/* Header */}
      <div className="account-header">
        <IoIosArrowBack onClick={() => navigate('/library')} />
        <h2>My Account</h2>
      </div>

      {/* User Info Card */}
      <div className="user-info-card">
        <div className="user-avatar">
          <img 
            src={user?.profilePic || 'https://admin.daretoconnectgames.com/public/profiles/profile.png'} 
            alt="Profile"
            onError={(e) => {
              e.target.src = 'https://admin.daretoconnectgames.com/public/profiles/profile.png';
            }}
          />
        </div>
        <div className="user-details">
          <h3>{user?.firstName} {user?.lastName}</h3>
          <p>{user?.email}</p>
          {user?.mobileNo && <p className="phone">{user.mobileNo}</p>}
        </div>
      </div>

      {/* List */}
      <div className="account-list">
        <div className="account-item" onClick={() => navigate('/account/edit')}>
          <div>
            <h4>Edit Profile</h4>
            <p>Update your personal details</p>
          </div>
          <IoIosArrowForward />
        </div>

        <div className="account-item" onClick={() => navigate('/account/password')}>
          <div>
            <h4>Change Password</h4>
            <p>Secure your account</p>
          </div>
          <IoIosArrowForward />
        </div>

        <div className="account-item" onClick={handleLogout}>
          <div>
            <h4>Logout</h4>
            <p>Logout of your account</p>
          </div>
          <IoIosArrowForward />
        </div>

        <div className="account-item danger" onClick={() => navigate('/account/delete')}>
          <div>
            <h4>Delete Account</h4>
            <p>Delete your account and all records</p>
          </div>
          <div className="delete-version-container">
            <span className="version">v {packageJson.version} </span>
            <IoIosArrowForward />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;