import React, { useState, useEffect } from 'react';
import { FaBell, FaEnvelope, FaEdit } from 'react-icons/fa';
import {
  isValidEmail,
  getUserEmail,
  setUserEmail,
  showNotificationMessage,
  generateSubscriptionCriteria,
  useCreateEmailNotificationSubscriptionMutation
} from '../services/emailNotifications';

interface Character {
  value: string;
  name: string;
  image: string;
}

interface Game {
  id: number;
  name: string;
  characters: Character[];
  weapons: { value: string; name: string }[];
  servers: { value: string; name: string }[];
}

interface SearchParams {
  characters?: string;
  weapons?: string;
  servers?: string;
  gender?: string;
}

interface NoAccountsNotificationProps {
  game: Game;
  searchParams: SearchParams;
  hasSearchCriteria: boolean;
}

const NoAccountsNotification: React.FC<NoAccountsNotificationProps> = ({ 
  game, 
  searchParams, 
  hasSearchCriteria 
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmailState] = useState<string>('');
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState<string>('');

  // RTK Query hook
  const [createEmailNotificationSubscription] = useCreateEmailNotificationSubscriptionMutation();

  useEffect(() => {
    // Check if notifications are already enabled
    const email = getUserEmail();
    if (email) {
      setUserEmailState(email);
      setNotificationsEnabled(true);
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
    setNotificationsEnabled(true);
    setShowSubscriptionForm(true);
    showNotificationMessage('Email saved! Now you can create subscriptions.');
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
    
    showNotificationMessage('Email address updated successfully!');
  };

  const createSubscription = async () => {
    if (!notificationsEnabled || !userEmail) {
      showNotificationMessage('Please enable notifications first', 'error');
      return;
    }

    setLoading(true);
    try {
      // Generate subscription criteria from current search
      const criteria = generateSubscriptionCriteria(searchParams, game);

      // Create subscription using RTK Query
      await createEmailNotificationSubscription({
        email: userEmail,
        game_id: game.id,
        server_name: criteria.serverName || undefined,
        gender: criteria.gender || undefined,
        max_price: maxPrice > 0 ? maxPrice : undefined,
        characters: criteria.characters,
        weapons: criteria.weapons
      }).unwrap();

      setShowSubscriptionForm(false);
      showNotificationMessage('Subscription created successfully! You will receive email notifications when matching accounts become available.');
    } catch (error) {
      console.error('Error creating subscription:', error);
      showNotificationMessage('Failed to create subscription. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getSearchSummary = () => {
    const parts = [];
    
    // Characters
    if (searchParams.characters) {
      const charactersList = searchParams.characters.split(',').filter(Boolean);
      const characterCounts: { [key: string]: number } = {};
      charactersList.forEach(char => {
        characterCounts[char] = (characterCounts[char] || 0) + 1;
      });
      
      const charNames = Object.entries(characterCounts).map(([charValue, count]) => {
        const character = game.characters.find(c => c.value === charValue);
        if (character) {
          return count > 1 ? `${character.name} (C${count - 1})` : character.name;
        }
        return charValue;
      });
      
      if (charNames.length > 0) {
        parts.push(`Characters: ${charNames.join(', ')}`);
      }
    }
    
    // Weapons
    if (searchParams.weapons) {
      const weaponsList = searchParams.weapons.split(',').filter(Boolean);
      const weaponCounts: { [key: string]: number } = {};
      weaponsList.forEach(weapon => {
        weaponCounts[weapon] = (weaponCounts[weapon] || 0) + 1;
      });
      
      const weaponNames = Object.entries(weaponCounts).map(([weaponValue, count]) => {
        const weapon = game.weapons.find(w => w.value === weaponValue);
        if (weapon) {
          return count > 1 ? `${weapon.name} (C${count - 1})` : weapon.name;
        }
        return weaponValue;
      });
      
      if (weaponNames.length > 0) {
        parts.push(`Weapons: ${weaponNames.join(', ')}`);
      }
    }
    
    // Servers
    if (searchParams.servers) {
      const serversList = searchParams.servers.split(',').filter(Boolean);
      const serverNames = serversList.map(serverValue => {
        const server = game.servers.find(s => s.value === serverValue);
        return server ? server.name : serverValue;
      });
      
      if (serverNames.length > 0) {
        parts.push(`Servers: ${serverNames.join(', ')}`);
      }
    }
    
    // Gender
    if (searchParams.gender) {
      parts.push(`Gender: ${searchParams.gender}`);
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'Any criteria';
  };

  if (!hasSearchCriteria) {
    return null;
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-shrink-0 self-center sm:self-start">
          <FaBell className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2">
            No accounts found for your search
          </h3>
          <p className="text-blue-700 dark:text-blue-300 mb-4 text-sm sm:text-base">
            We couldn't find any {game.name} accounts matching your criteria right now.
          </p>
          
          <div className="bg-white dark:bg-gray-800 rounded-md p-3 mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your search criteria:
            </p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">
              {getSearchSummary()}
            </p>
          </div>

          {!notificationsEnabled ? (
            <div className="space-y-4">
              <p className="text-blue-700 dark:text-blue-300 text-sm sm:text-base flex items-start sm:items-center gap-2">
                <FaEnvelope className="mt-0.5 sm:mt-0 flex-shrink-0" />
                <span>Get notified by email when accounts matching your criteria become available!</span>
              </p>
              <div className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={userEmail}
                  onChange={handleEmailChange}
                  className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                />
                <button
                  onClick={enableNotifications}
                  disabled={loading || !userEmail}
                  className="w-full sm:w-auto px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <FaBell />
                  Enable Notifications
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">
                No registration required. Your email is only used for account notifications and can be unsubscribed anytime.
              </p>
            </div>
          ) : showSubscriptionForm ? (
            <div className="space-y-4">
              {!isChangingEmail ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <p className="text-green-700 dark:text-green-300 flex items-center gap-2 text-sm sm:text-base">
                    <FaEnvelope className="flex-shrink-0" />
                    <span>Notifications enabled for:</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <strong className="text-green-800 dark:text-green-200 break-all text-sm sm:text-base">{userEmail}</strong>
                    <button
                      onClick={startChangingEmail}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded"
                      title="Change email address"
                    >
                      <FaEdit className="text-xs" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <h4 className="text-base font-semibold text-blue-900 dark:text-blue-100">
                      Change Email Address
                    </h4>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      placeholder="Enter new email address"
                      value={newEmail}
                      onChange={handleNewEmailChange}
                      className="flex-1 px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveNewEmail}
                        disabled={!newEmail || !isValidEmail(newEmail)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors duration-200 text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelChangingEmail}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md font-medium transition-colors duration-200 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 sm:p-4">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  <strong>Create subscription for your current search?</strong>
                </p>
                <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                  You'll be notified when accounts matching these criteria become available:
                </p>
                <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 mb-3 italic break-words">
                  {getSearchSummary()}
                </p>
                <div className="flex flex-col gap-3">
                  <input
                    type="number"
                    placeholder="Max price (optional)"
                    value={maxPrice || ''}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-yellow-300 dark:border-yellow-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-base"
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={createSubscription}
                      disabled={loading}
                      className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <FaBell className="flex-shrink-0" />
                      {loading ? 'Creating...' : 'Create Subscription'}
                    </button>
                    <button
                      onClick={() => setShowSubscriptionForm(false)}
                      className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {!isChangingEmail ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <p className="text-green-700 dark:text-green-300 flex items-center gap-2 text-sm sm:text-base">
                    <FaEnvelope className="flex-shrink-0" />
                    <span>Notifications enabled for:</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <strong className="text-green-800 dark:text-green-200 break-all text-sm sm:text-base">{userEmail}</strong>
                    <button
                      onClick={startChangingEmail}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded"
                      title="Change email address"
                    >
                      <FaEdit className="text-xs" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <h4 className="text-base font-semibold text-blue-900 dark:text-blue-100">
                      Change Email Address
                    </h4>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      placeholder="Enter new email address"
                      value={newEmail}
                      onChange={handleNewEmailChange}
                      className="flex-1 px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveNewEmail}
                        disabled={!newEmail || !isValidEmail(newEmail)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors duration-200 text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelChangingEmail}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md font-medium transition-colors duration-200 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => setShowSubscriptionForm(true)}
                className="w-full sm:w-auto px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <FaBell />
                Create Subscription for This Search
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoAccountsNotification; 