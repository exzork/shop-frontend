import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { FaEnvelope, FaCheckCircle, FaExclamationCircle, FaSpinner } from 'react-icons/fa';
import { useLazyUnsubscribeFromNotificationsQuery, useLazyUnsubscribeFromSingleNotificationQuery } from '../services/emailNotifications';

const UnsubscribePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
  const [message, setMessage] = useState<string>('');
  
  const [triggerUnsubscribeAll] = useLazyUnsubscribeFromNotificationsQuery();
  const [triggerUnsubscribeSingle] = useLazyUnsubscribeFromSingleNotificationQuery();
  
  const token = searchParams.get('token');
  const isSingleUnsubscribe = location.pathname.includes('unsubscribe-single');

  useEffect(() => {
    const handleUnsubscribe = async () => {
      if (!token) {
        setStatus('invalid');
        setMessage('Invalid unsubscribe link. No token provided.');
        return;
      }

      try {
        const triggerFunction = isSingleUnsubscribe ? triggerUnsubscribeSingle : triggerUnsubscribeAll;
        const result = await triggerFunction({ token });
        
        console.log('Unsubscribe result:', result);
        
        // Handle the result properly - check if it's successful
        if (result.data && result.data.status === 'success') {
          setStatus('success');
          setMessage(result.data.message || `You have been successfully unsubscribed from ${isSingleUnsubscribe ? 'this subscription' : 'all email notifications'}.`);
        } else if (result.error) {
          // Handle error case
          console.error('Unsubscribe error:', result.error);
          setStatus('error');
          
          const error = result.error as any;
          if (error.status === 404) {
            setMessage('This unsubscribe link is invalid or has already been used.');
          } else if (error.status === 400) {
            setMessage('Invalid unsubscribe token. Please check your email link.');
          } else if (error.data?.message) {
            setMessage(error.data.message);
          } else {
            setMessage('An error occurred while unsubscribing. Please try again later.');
          }
        } else {
          // Unexpected response format
          setStatus('error');
          setMessage('Unexpected response from server. Please try again later.');
        }
      } catch (error: any) {
        console.error('Unsubscribe exception:', error);
        setStatus('error');
        
        if (error.status === 404) {
          setMessage('This unsubscribe link is invalid or has already been used.');
        } else if (error.status === 400) {
          setMessage('Invalid unsubscribe token. Please check your email link.');
        } else if (error.data?.message) {
          setMessage(error.data.message);
        } else {
          setMessage('An error occurred while unsubscribing. Please try again later.');
        }
      }
    };

    handleUnsubscribe();
  }, [token, triggerUnsubscribeAll, triggerUnsubscribeSingle, isSingleUnsubscribe]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleManageSubscriptions = () => {
    navigate('/notifications');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          {/* Header */}
          <div className="mb-6">
            <FaEnvelope className="mx-auto h-16 w-16 text-blue-600 dark:text-blue-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Email Notifications
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isSingleUnsubscribe ? 'Unsubscribe from this subscription' : 'Unsubscribe from all notifications'}
            </p>
          </div>

          {/* Status Content */}
          <div className="mb-8">
            {status === 'loading' && (
              <div className="space-y-4">
                <FaSpinner className="mx-auto h-12 w-12 text-blue-600 dark:text-blue-400 animate-spin" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Processing Unsubscribe Request
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Please wait while we process your unsubscribe request...
                  </p>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <FaCheckCircle className="mx-auto h-12 w-12 text-green-600 dark:text-green-400" />
                <div>
                  <h2 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                    Successfully Unsubscribed
                  </h2>
                  <p className="text-green-700 dark:text-green-300">
                    {message}
                  </p>
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      {isSingleUnsubscribe 
                        ? 'You have been unsubscribed from this specific notification. Your other subscriptions remain active.' 
                        : 'You will no longer receive any email notifications for game account availability.'
                      } You can always subscribe again by visiting our website and entering your email address.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <FaExclamationCircle className="mx-auto h-12 w-12 text-red-600 dark:text-red-400" />
                <div>
                  <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                    Unsubscribe Failed
                  </h2>
                  <p className="text-red-700 dark:text-red-300">
                    {message}
                  </p>
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      If you continue to have issues, please contact our support team or try using a different unsubscribe link from a recent email.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {status === 'invalid' && (
              <div className="space-y-4">
                <FaExclamationCircle className="mx-auto h-12 w-12 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <h2 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                    Invalid Unsubscribe Link
                  </h2>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    {message}
                  </p>
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Please use the unsubscribe link from a recent email notification. 
                      Each link is unique and can only be used once.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleGoHome}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors duration-200 flex items-center justify-center"
              >
                <FaEnvelope className="mr-2" />
                Return to Website
              </button>
              
              {(status === 'success' || status === 'error') && (
                <button
                  onClick={handleManageSubscriptions}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors duration-200"
                >
                  Manage Subscriptions
                </button>
              )}
            </div>
            
            {status === 'success' && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Thank you for using our notification service. You can always resubscribe if you change your mind!
              </p>
            )}
            
            {(status === 'error' || status === 'invalid') && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Need help? Contact our support team for assistance.
              </p>
            )}
          </div>

          {/* Privacy Notice */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              🔒 Your privacy is important to us. We only use your email for account notifications and never share your information with third parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnsubscribePage; 