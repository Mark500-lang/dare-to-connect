import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoIosArrowBack } from "react-icons/io";
import { 
  Button, 
  Alert, 
  Snackbar,
  CircularProgress,
  Box,
  Typography,
  Container,
  Paper,
  Link
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import subscriptionService from '../services/subscriptionService';
import './Subscriptions.css';

const Subscriptions = () => {
  const navigate = useNavigate();
  const { user, subscription: userSubscription, refreshUserData, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [revenueCatAvailable, setRevenueCatAvailable] = useState(true);

  // AUTHENTICATION CHECK - Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Only fetch data if authenticated
    if (isAuthenticated) {
      initializeRevenueCat();
      fetchPaymentPackages();
    }
  }, [isAuthenticated]);

  const initializeRevenueCat = async () => {
    try {
      const initialized = await subscriptionService.initializeRevenueCat();
      setRevenueCatAvailable(initialized);
      
      if (initialized) {
        const customerInfo = await subscriptionService.getCustomerInfo();
        if (customerInfo?.entitlements?.active) {
          console.log('User has active RevenueCat entitlements');
        }
      }
    } catch (err) {
      console.warn('RevenueCat initialization warning:', err.message);
      setRevenueCatAvailable(false);
    }
  };

  const fetchPaymentPackages = async () => {
    setLoadingPackages(true);
    try {
      const packagesData = await subscriptionService.getPaymentPackages();
      
      // Transform the data to match App Store design
      const transformedPackages = packagesData.map(pkg => ({
        id: pkg.id,
        name: pkg.packageName,
        description: pkg.description,
        price: pkg.amount,
        months: pkg.months,
        pricePerMonth: pkg.amount / pkg.months,
        isMostPopular: pkg.id === 3,
        isBestValue: pkg.id === 4,
      }));
      
      setPackages(transformedPackages);
      
      const defaultPackage = transformedPackages.find(p => p.id === 3) || transformedPackages[0];
      setSelectedPackage(defaultPackage);
      
    } catch (err) {
      console.error('Error fetching packages:', err);
      setError('Failed to load subscription packages. Please try again.');
    } finally {
      setLoadingPackages(false);
    }
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPricePerMonth = (price, months) => {
    const pricePerMonth = price / months;
    return `${formatPrice(pricePerMonth)}/month`;
  };

  const getDurationText = (months) => {
    if (months < 1) return 'Week';
    if (months === 1) return 'Month';
    if (months === 12) return 'Year';
    return `${months} Months`;
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
        const purchaseResult = await subscriptionService.purchasePackage(selectedPackage.id);
        
        if (purchaseResult.success) {
            setSuccess(`Purchase successful! You now have access to ${selectedPackage.name}.`);
            
            await refreshUserData();
            
            setTimeout(() => {
                navigate('/library');
            }, 2000);
        }
        
    } catch (err) {
        console.error('Purchase error:', err);
        
        let errorMessage = err.message || 'Failed to complete purchase. Please try again.';
        
        if (err.message.includes('cancelled')) {
            errorMessage = 'Purchase was cancelled.';
        } else if (err.message.includes('already own')) {
            errorMessage = 'You already have this subscription.';
        } else if (err.message.includes('Network error')) {
            errorMessage = 'Network error. Please check your internet connection.';
        } else if (err.message.includes('not available')) {
            errorMessage = 'In-app purchases are not available on this platform.';
        }
        
        setError(errorMessage);
    } finally {
        setLoading(false);
    }
};

const handleRestorePurchases = async () => {
    setLoading(true);
    setError(null);
    
    try {
        const restoreResult = await subscriptionService.restorePurchases();
        
        if (restoreResult.success) {
            setSuccess(restoreResult.message);
            await refreshUserData();
        } else {
            setError(restoreResult.message);
        }
    } catch (err) {
        console.error('Restore error:', err);
        setError('Failed to restore purchases. Please try again.');
    } finally {
        setLoading(false);
    }
  };

  const isCurrentPlan = selectedPackage && userSubscription?.packageId === selectedPackage.id;

  // Show loading while checking auth
  if (!isAuthenticated) {
    return (
      <div className="subscriptions-page">
        <div className="loading-container">
          <CircularProgress />
        </div>
      </div>
    );
  }

  return (
    <div className="subscriptions-page">
      <div className="subscriptions-header">
        <IoIosArrowBack 
          aria-label="Go back" 
          size={24} 
          color="#000000ff" 
          onClick={() => navigate("/library")} 
          className="back-icon" />
        <span className="header-title">My Subscription</span>
      </div>

      <Container maxWidth="sm" className="subscriptions-container">
        {/* App Store Style Header */}
        <Box className="app-store-header">
          <Typography variant="h6" className="main-title" gutterBottom>
            Subscribe to Unlock Premium Content
          </Typography>
        </Box>

        {/* VERTICAL Package Cards - No Scroll */}
        <Box className="packages-vertical-container">
          {loadingPackages ? (
            <Box className="loading-packages">
              <CircularProgress size={40} />
              <Typography variant="body2" className="loading-text">
                Loading packages...
              </Typography>
            </Box>
          ) : packages.length > 0 ? (
            <div className="packages-vertical-grid">
              {packages.map((pkg) => (
                <Paper 
                  key={pkg.id}
                  className={`package-card-vertical ${selectedPackage?.id === pkg.id ? 'selected' : ''} ${pkg.isMostPopular ? 'popular' : ''} ${pkg.isBestValue ? 'best-value' : ''}`}
                  elevation={selectedPackage?.id === pkg.id ? 3 : 1}
                  onClick={() => handlePackageSelect(pkg)}
                >
                  {/* Badges */}
                  {pkg.isMostPopular && (
                    <div className="package-badge popular-badge">MOST POPULAR</div>
                  )}
                  {pkg.isBestValue && (
                    <div className="package-badge value-badge">BEST VALUE</div>
                  )}
                  
                  <Box className="package-content-vertical">
                    <Box className="package-header-vertical">
                      <Typography variant="h6" className="package-name-vertical">
                        {pkg.name}
                      </Typography>
                      <Typography variant="body2" className="package-description-vertical" color="text.secondary">
                        {pkg.description}
                      </Typography>
                    </Box>
                    
                    <Box className="price-section-vertical">
                      <Typography variant="h4" className="package-price-vertical">
                        {formatPrice(pkg.price)}
                      </Typography>
                      <Box className="price-details-vertical">
                        <Typography variant="body2" className="price-period-vertical">
                          {getDurationText(pkg.months)}
                        </Typography>
                        <Typography variant="caption" className="price-per-month-vertical">
                          {formatPricePerMonth(pkg.price, pkg.months)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Selection indicator */}
                    <Box className="selection-indicator-vertical">
                      <div className={`selection-dot-vertical ${selectedPackage?.id === pkg.id ? 'selected' : ''}`} />
                    </Box>
                  </Box>
                </Paper>
              ))}
            </div>
          ) : (
            <Box className="no-packages">
              <Typography variant="body1" color="text.secondary">
                No subscription packages available at the moment.
              </Typography>
            </Box>
          )}
        </Box>

        {/* Current Plan (if any) */}
        {userSubscription && (
          <Paper className="current-plan-card" elevation={0}>
            <Box className="current-plan-content">
              <Typography variant="subtitle1" className="current-plan-title">
                Your Current Plan
              </Typography>
              <Typography variant="h6" className="current-plan-name">
                {userSubscription.packageName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expires: {new Date(userSubscription.expiryDate).toLocaleDateString()}
              </Typography>
            </Box>
          </Paper>
        )}

        {/* Subscribe Button */}
        {selectedPackage && !loadingPackages && packages.length > 0 && (
          <Box className="subscribe-section">
            <Button
              fullWidth
              variant="contained"
              size="large"
              className="subscribe-button"
              onClick={handlePurchase}
              disabled={loading || isCurrentPlan}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {loading ? 'Processing...' : isCurrentPlan ? 'Current Plan' : `Subscribe Now - ${formatPrice(selectedPackage.price)}`}
            </Button>
            
            {isCurrentPlan && (
              <Typography variant="caption" color="text.secondary" className="current-plan-note">
                You are currently subscribed to this plan
              </Typography>
            )}
            
            {/* Restore Purchases */}
            <Box className="restore-section">
              <Button
                variant="text"
                size="small"
                onClick={handleRestorePurchases}
                disabled={loading}
              >
                Restore Purchases
              </Button>
            </Box>

            {/* Legal Footer with Privacy Policy and Terms of Service Links - Apple Compliance */}
            <Box className="legal-footer">
              <Typography variant="caption" color="text.secondary" align="center" className="legal-text">
                By subscribing, you agree to our{' '}
                <Link 
                  href="https://daretoconnectgames.com/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="legal-link"
                  underline="hover"
                >
                  Privacy Policy
                </Link>
                {' '}and{' '}
                <Link 
                  href="https://daretoconnectgames.com/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="legal-link"
                  underline="hover"
                >
                  Terms of Service
                </Link>
              </Typography>
              <Typography variant="caption" color="text.secondary" align="center" className="renewal-text">
                Subscription automatically renews unless auto-renew is turned off at least 24-hours before the end of the current period.
              </Typography>
              <Typography variant="caption" color="text.secondary" align="center" className="manage-text">
                You can manage your subscriptions in your Account Settings after purchase.
              </Typography>
            </Box>
          </Box>
        )}
      </Container>

      {/* Success/Error Messages */}
      <Snackbar 
        open={!!success} 
        autoHideDuration={5000} 
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

export default Subscriptions;