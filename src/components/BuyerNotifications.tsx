import React, { useState, useEffect } from 'react';
import { FaBell, FaTrash, FaGamepad, FaEnvelope, FaExclamationTriangle } from 'react-icons/fa';
import {
  isValidEmail,
  getUserEmail,
  setUserEmail,
  clearUserEmail,
  showNotificationMessage,
  formatSubscriptionSummary,
  useGetEmailNotificationSubscriptionsQuery,
  useDeleteEmailNotificationSubscriptionMutation,
  useUnsubscribeAllForEmailMutation
} from '../services/emailNotifications';


interface Game {
  id: number;
  name: string;
}

interface BuyerNotificationsProps {
  games: Game[];
}

const BuyerNotifications: React.FC<BuyerNotificationsProps> = ({  }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmailState] = useState<string>('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState<string>('');

  // RTK Query hooks
  const [deleteEmailNotificationSubscription] = useDeleteEmailNotificationSubscriptionMutation();
  const [unsubscribeAllForEmail] = useUnsubscribeAllForEmailMutation();

  // Get subscriptions query - only enabled when user email is available
  const { data: subscriptionsData, refetch: refetchSubscriptions } = useGetEmailNotificationSubscriptionsQuery(
    { email: userEmail },
    { skip: !userEmail || !isValidEmail(userEmail) }
  );

  // Debug logging
  useEffect(() => {
    console.log('BuyerNotifications Debug:', {
      userEmail,
      isValidEmail: isValidEmail(userEmail),
      skip: !userEmail || !isValidEmail(userEmail),
      isLoading: false,
      error: null,
      subscriptionsData
    });
  }, [userEmail, subscriptionsData]);

  useEffect(() => {
    // Check if notifications are already enabled
    const email = getUserEmail();
    if (email) {
      setUserEmailState(email);
      setIsEnabled(true);
    }
  }, []);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserEmailState(e.target.value);
  };

  const handleNewEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewEmail(e.target.value);
  };

  const enableNotifications = () => {
    if (!isValidEmail(userEmail)) {
      showNotificationMessage('Please enter a valid email address', 'error');
      return;
    }

    setUserEmail(userEmail);
    setIsEnabled(true);
    showNotificationMessage('Email saved! Now you can create subscriptions.');
  };

  const disableNotifications = () => {
    clearUserEmail();
    setUserEmailState('');
    setIsEnabled(false);
    setIsChangingEmail(false);
    setNewEmail('');
    showNotificationMessage('Notifications disabled. Your email has been removed.');
  };

  const startChangingEmail = () => {
    setNewEmail(userEmail);
    setIsChangingEmail(true);
  };

  const cancelChangingEmail = () => {
    setNewEmail('');
    setIsChangingEmail(false);
  };

  const saveNewEmail = () => {
    if (!isValidEmail(newEmail)) {
      showNotificationMessage('Please enter a valid email address', 'error');
      return;
    }

    if (newEmail === userEmail) {
      setIsChangingEmail(false);
      setNewEmail('');
      return;
    }

    // Update the email
    setUserEmail(newEmail);
    setUserEmailState(newEmail);
    setIsChangingEmail(false);
    setNewEmail('');
    
    // Refetch subscriptions with new email
    refetchSubscriptions();
    
    showNotificationMessage('Email address updated successfully!');
  };

  const handleDeleteSubscription = async (subscriptionId: number) => {
    if (!confirm('Are you sure you want to delete this subscription?')) return;

    setLoading(true);
    try {
      await deleteEmailNotificationSubscription({
        id: subscriptionId,
        email: userEmail
      }).unwrap();
      
      refetchSubscriptions();
      showNotificationMessage('Subscription deleted successfully!');
    } catch (error) {
      console.error('Error deleting subscription:', error);
      showNotificationMessage('Failed to delete subscription. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribeAll = async () => {
    if (!confirm('Are you sure you want to unsubscribe from ALL email notifications? This action cannot be undone.')) return;

    setLoading(true);
    try {
      await unsubscribeAllForEmail({
        email: userEmail
      }).unwrap();
      
      // Clear local state and disable notifications
      clearUserEmail();
      setUserEmailState('');
      setIsEnabled(false);
      setIsChangingEmail(false);
      setNewEmail('');
      
      showNotificationMessage('Successfully unsubscribed from all email notifications.');
    } catch (error) {
      console.error('Error unsubscribing from all notifications:', error);
      showNotificationMessage('Failed to unsubscribe from all notifications. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const subscriptions = subscriptionsData?.data || [];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <FaEnvelope className="text-blue-600 flex-shrink-0" />
          <span>Email Notifications for Game Accounts</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          Get notified by email when accounts matching your criteria become available. 
          No registration required - just provide your email address.
        </p>
      </div>

      {!isEnabled ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center mb-4 gap-2 sm:gap-3">
            <FaBell className="text-blue-600 dark:text-blue-400 text-xl flex-shrink-0" />
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              Enable Email Notifications
            </h3>
          </div>
          <p className="text-blue-700 dark:text-blue-300 mb-4 text-sm sm:text-base">
            Enter your email address to receive notifications when perfect game accounts become available.
          </p>
          <div className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Enter your email address"
              value={userEmail}
              onChange={handleEmailChange}
              className="w-full px-4 py-3 border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            />
            <button
              onClick={enableNotifications}
              disabled={!userEmail}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <FaBell />
              Enable Notifications
            </button>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 text-center sm:text-left">
            ✅ 100% Anonymous • ✅ No Registration • ✅ Easy Unsubscribe • ✅ GDPR Compliant
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status Bar */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            {!isChangingEmail ? (
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <FaEnvelope className="text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div>
                    <span className="text-green-800 dark:text-green-200 font-medium text-sm sm:text-base">
                      Notifications Enabled
                    </span>
                    <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 break-all sm:break-normal">
                      Email: {userEmail} • {subscriptions.length} active subscription{subscriptions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={startChangingEmail}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 px-3 py-2 rounded text-sm border border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-center"
                  >
                    Change Email
                  </button>
                  <button
                    onClick={disableNotifications}
                    className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 px-3 py-2 rounded text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-center"
                  >
                    Disable
                  </button>
                  {subscriptions.length > 0 && (
                    <button
                      onClick={handleUnsubscribeAll}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-3 py-2 rounded text-sm border border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      title="Permanently unsubscribe from all email notifications"
                    >
                      <FaExclamationTriangle className="text-xs" />
                      Unsubscribe All
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <FaEnvelope className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    Change Email Address
                  </h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Enter new email address"
                    value={newEmail}
                    onChange={handleNewEmailChange}
                    className="flex-1 px-4 py-2 border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveNewEmail}
                      disabled={!newEmail || !isValidEmail(newEmail)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors duration-200 text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelChangingEmail}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md font-medium transition-colors duration-200 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Note: Changing your email will update all existing subscriptions to use the new email address.
                </p>
              </div>
            )}
          </div>

          {/* Subscriptions List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Your Subscriptions
            </h3>

            {subscriptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FaGamepad className="mx-auto text-4xl mb-4 opacity-50" />
                <p className="mb-2 text-sm sm:text-base">No subscriptions yet.</p>
                <p className="text-xs sm:text-sm px-4">Search for game accounts to create notification subscriptions when no results are found!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {subscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm sm:text-base">
                          {subscription.game.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 break-words">
                          {formatSubscriptionSummary(subscription)}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-500 dark:text-gray-400 gap-1 sm:gap-2">
                          <div className="flex items-center">
                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                              subscription.is_active 
                                ? 'bg-green-500' 
                                : 'bg-red-500'
                            }`} />
                            {subscription.is_active ? 'Active' : 'Inactive'}
                          </div>
                          <span className="hidden sm:inline">•</span>
                          <span>Created {new Date(subscription.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex justify-end sm:ml-4">
                        <button
                          onClick={() => handleDeleteSubscription(subscription.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors duration-200"
                          title="Delete subscription"
                          disabled={loading}
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerNotifications; 