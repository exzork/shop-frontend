import React from 'react';
import BuyerNotifications from '../components/BuyerNotifications';
import { useGetGamesQuery } from '../services/api';
import { FaSpinner } from 'react-icons/fa';

const NotificationsPage: React.FC = () => {
  const { data: games, isLoading } = useGetGamesQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <FaSpinner className="animate-spin h-6 w-6 text-blue-600" />
          <span className="text-gray-600 dark:text-gray-400">Loading games...</span>
        </div>
      </div>
    );
  }

  if (!games) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Unable to Load Games
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please try refreshing the page or contact support if the problem persists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Account Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Get notified by email when game accounts matching your criteria become available.
            No registration required - just provide your email address.
          </p>
        </div>
        
        <BuyerNotifications games={games} />
      </div>
    </div>
  );
};

export default NotificationsPage; 