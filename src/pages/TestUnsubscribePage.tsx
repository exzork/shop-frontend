import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaBug } from 'react-icons/fa';
import { useLazyUnsubscribeFromNotificationsQuery } from '../services/emailNotifications';

const TestUnsubscribePage: React.FC = () => {
  const navigate = useNavigate();
  const [testToken, setTestToken] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const [triggerUnsubscribe] = useLazyUnsubscribeFromNotificationsQuery();

  const handleTestUnsubscribe = async () => {
    if (!testToken.trim()) {
      alert('Please enter a token to test');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await triggerUnsubscribe({ token: testToken });
      console.log('Full response:', response);
      setResult({
        type: 'response',
        data: response
      });
    } catch (error) {
      console.error('Exception:', error);
      setResult({
        type: 'exception',
        data: error
      });
    } finally {
      setLoading(false);
    }
  };

  const testWithInvalidToken = () => {
    setTestToken('invalid-token-123');
  };

  const testWithEmptyToken = () => {
    setTestToken('');
  };

  const goToRealUnsubscribe = () => {
    if (testToken.trim()) {
      navigate(`/unsubscribe?token=${encodeURIComponent(testToken)}`);
    } else {
      navigate('/unsubscribe');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <FaBug className="mx-auto h-16 w-16 text-blue-600 dark:text-blue-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
              Test Unsubscribe Functionality
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              Debug the unsubscribe API endpoint
            </p>
          </div>

          <div className="space-y-6">
            {/* Token Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Test Token
              </label>
              <input
                type="text"
                value={testToken}
                onChange={(e) => setTestToken(e.target.value)}
                placeholder="Enter unsubscribe token to test"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {/* Test Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleTestUnsubscribe}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors duration-200"
              >
                {loading ? 'Testing...' : 'Test Unsubscribe API'}
              </button>
              
              <button
                onClick={testWithInvalidToken}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md font-medium transition-colors duration-200"
              >
                Test Invalid Token
              </button>
              
              <button
                onClick={testWithEmptyToken}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors duration-200"
              >
                Test Empty Token
              </button>
              
              <button
                onClick={goToRealUnsubscribe}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors duration-200"
              >
                Go to Real Unsubscribe Page
              </button>
            </div>

            {/* Results */}
            {result && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Test Result ({result.type}):
                </h3>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-4 overflow-auto">
                  <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                How to Test:
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>1. <strong>Create a real subscription</strong> first via /notifications page</li>
                <li>2. <strong>Check your backend logs</strong> for the actual unsubscribe token</li>
                <li>3. <strong>Test with that real token</strong> using the input above</li>
                <li>4. <strong>Test invalid tokens</strong> to see error handling</li>
                <li>5. <strong>Check browser console</strong> for detailed logs</li>
              </ul>
            </div>

            {/* Backend Status */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Expected Backend Response:
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Success:</strong> <code>{`{"status": "success", "message": "Successfully unsubscribed", "data": null}`}</code></p>
                <p><strong>Error:</strong> <code>{`{"status": "error", "message": "Error message", "data": null}`}</code></p>
                <p><strong>Invalid Token:</strong> HTTP 404 or 400 status</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-center pt-6">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors duration-200 flex items-center"
              >
                <FaEnvelope className="mr-2" />
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestUnsubscribePage; 