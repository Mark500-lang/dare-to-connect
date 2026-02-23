import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaShareAlt, FaCopy, FaWhatsapp, FaFacebook, FaTwitter, FaLink } from 'react-icons/fa';
import { 
  Button, 
  Alert, 
  Snackbar,
  Box,
  Typography,
  Paper,
  Grid,
  IconButton,
  TextField
} from '@mui/material';
import './TellAFriend.css';

const TellAFriend = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState(null);

  const appLink = 'https://play.google.com/store/apps/details?id=com.daretoconnect.games';
  const shareMessage = `Check out Dare to Connect Games! An amazing collection of interactive games to challenge your mind and have fun. Download now: ${appLink}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appLink)
      .then(() => {
        setCopied(true);
        setSuccess('Link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        setSuccess('Failed to copy link. Please try again.');
      });
  };

  const handleShare = async (platform) => {
    const shareData = {
      title: 'Dare to Connect Games',
      text: shareMessage,
      url: appLink
    };

    try {
      switch (platform) {
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank');
          break;
          
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appLink)}`, '_blank');
          break;
          
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`, '_blank');
          break;
          
        default:
          if (navigator.share) {
            await navigator.share(shareData);
            setSuccess('Shared successfully!');
          } else {
            handleCopyLink();
          }
      }
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const shareOptions = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: <FaWhatsapp />,
      color: '#25D366'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <FaFacebook />,
      color: '#1877F2'
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: <FaTwitter />,
      color: '#1DA1F2'
    }
  ];

  return (
    <div className="tell-friend-page">
      <div className="tell-friend-header">
        <FaArrowLeft onClick={() => navigate(-1)} />
        <span>Tell a Friend</span>
      </div>

      <Paper className="tell-friend-content" elevation={0}>
        <Box className="share-intro">
          <FaShareAlt className="share-icon" />
          <Typography variant="h6" className="share-title">
            Share the Fun!
          </Typography>
          <Typography variant="body2" color="text.secondary" className="share-description">
            Spread the joy of Dare to Connect Games with your friends. Share the app link and let them join the excitement!
          </Typography>
        </Box>

        {/* Link Display */}
        <Paper className="link-container" elevation={0}>
          <Grid container alignItems="center" spacing={1}>
            <Grid item>
              <FaLink className="link-icon" />
            </Grid>
            <Grid item xs>
              <TextField
                value={appLink}
                fullWidth
                size="small"
                variant="standard"
                InputProps={{
                  readOnly: true,
                  disableUnderline: true
                }}
              />
            </Grid>
            <Grid item>
              <IconButton
                onClick={handleCopyLink}
                className={copied ? 'copied' : ''}
                size="small"
              >
                <FaCopy />
              </IconButton>
            </Grid>
          </Grid>
        </Paper>

        {/* Share Options */}
        <Typography variant="subtitle1" className="share-options-title">
          Share via
        </Typography>
        
        <Grid container spacing={2} className="share-options">
          {shareOptions.map((option) => (
            <Grid item xs={4} key={option.id}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={option.icon}
                onClick={() => handleShare(option.id)}
                sx={{
                  py: 2,
                  borderColor: option.color,
                  color: option.color,
                  '&:hover': {
                    borderColor: option.color,
                    backgroundColor: `${option.color}10`
                  }
                }}
              >
                {option.name}
              </Button>
            </Grid>
          ))}
        </Grid>

        {/* Share Button */}
        <Button
          variant="contained"
          fullWidth
          size="large"
          startIcon={<FaShareAlt />}
          onClick={() => handleShare('native')}
          sx={{
            mt: 3,
            py: 1.5,
            backgroundColor: '#1674a2',
            '&:hover': {
              backgroundColor: '#0d5a7d'
            }
          }}
        >
          SHARE NOW
        </Button>

        {/* Incentive Section */}
        <Box className="incentive-section">
          <Typography variant="body2" color="text.secondary" className="incentive-text">
            💎 Share with 5 friends and get 1 week free subscription!
          </Typography>
          <Typography variant="caption" color="text.secondary" className="incentive-note">
            *Offer valid for first-time users only
          </Typography>
        </Box>
      </Paper>

      {/* Success Message */}
      <Snackbar 
        open={!!success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default TellAFriend;