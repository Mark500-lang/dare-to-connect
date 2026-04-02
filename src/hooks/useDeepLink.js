import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';

const useDeepLink = () => {
  const navigate = useNavigate();

  const handleUrl = (url) => {
    if (!url) return;
    console.log('Deep link received:', url);

    if (url.includes('daretoconnect://activated')) {
      const queryString = url.split('?')[1] || '';
      const params = new URLSearchParams(queryString);
      const status = params.get('status');
      const email = params.get('email') || '';

      if (status === 'success') {
        navigate('/login', {
          state: {
            activationSuccess: true,
            message: 'Your account has been activated! Please log in.',
            email
          }
        });
      } else {
        navigate('/login', {
          state: {
            activationSuccess: true,
            message: 'Your account is already activated. Please log in.'
          }
        });
      }
    }
  };

  useEffect(() => {
    // Cold start — app launched via deep link
    App.getLaunchUrl().then((result) => {
      if (result?.url) handleUrl(result.url);
    });

    // Warm start — app already open, deep link received
    const listenerPromise = App.addListener('appUrlOpen', (event) => {
      handleUrl(event.url);
    });

    return () => {
      listenerPromise.then(listener => listener.remove());
    };
  }, []);
};

export default useDeepLink;