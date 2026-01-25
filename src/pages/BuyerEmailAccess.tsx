import React, { useState } from 'react';
import { useRequestBuyerEmailAccessMutation, useGetBuyerEmailsQuery } from '../services/api';
import Swal from 'sweetalert2';

const BuyerEmailAccess: React.FC = () => {
    const [email, setEmail] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [showAccessForm, setShowAccessForm] = useState(true);
    const [selectedEmail, setSelectedEmail] = useState<any>(null);
    const [requestAccess, { isLoading: isRequesting, error: requestError }] = useRequestBuyerEmailAccessMutation();
    
    // Parse token from URL if present
    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
            setAccessToken(token);
            setShowAccessForm(false);
        }
    }, []);

    const { data: buyerEmails, isLoading: isLoadingEmails, error: emailsError } = useGetBuyerEmailsQuery(
        { token: accessToken },
        { skip: !accessToken }
    );

    const handleRequestAccess = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        try {
            await requestAccess({ email }).unwrap();
            Swal.fire({
                title: 'Access Request Sent!',
                text: 'Please check your email for the access link.',
                icon: 'success',
                confirmButtonText: 'OK'
            });
            setEmail('');
        } catch (error) {
            console.error('Failed to request access:', error);
        }
    };


    const handleTokenSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (accessToken) {
            setShowAccessForm(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getEmailPreview = (body: string) => {
        // Remove HTML tags and get first 150 characters
        const textContent = body.replace(/<[^>]*>/g, '');
        return textContent.length > 150 ? textContent.substring(0, 150) + '...' : textContent;
    };

    // Utility to check if email body contains color styling
    const emailBodyHasColor = (body: string) => {
        // Check for inline color style or class with text-color
        return /style\s*=\s*"[^"]*color\s*:/i.test(body) || /class\s*=\s*"[^"]*text-\w+/i.test(body);
    };

    // Utility to wrap email body with theme-aware color if needed
    const getThemedEmailBody = (body: string) => {
        const cleanBody = body.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        if (emailBodyHasColor(cleanBody)) {
            return cleanBody;
        }
        // Detect dark mode
        const isDark = document.documentElement.classList.contains('dark');
        const color = isDark ? '#e5e7eb' : '#111827'; // Tailwind gray-200 or gray-900
        return `<div style=\"color: ${color};\">${cleanBody}</div>`;
    };

    if (showAccessForm && !accessToken) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
                <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                        Access Your Purchased Account Emails
                    </h1>
                    
                    <form onSubmit={handleRequestAccess} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Enter your email address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="buyer@example.com"
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        
                        <button
                            type="submit"
                            disabled={isRequesting || !email}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-md transition-colors"
                        >
                            {isRequesting ? 'Sending...' : 'Request Access'}
                        </button>
                    </form>

                    {requestError && (
                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md">
                            <p className="text-red-600 dark:text-red-400 text-sm">
                                {('data' in requestError && requestError.data && typeof requestError.data === 'object' && 'message' in requestError.data) 
                                    ? String(requestError.data.message)
                                    : 'Failed to request access. Please try again.'}
                            </p>
                        </div>
                    )}

                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md">
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">How it works:</h3>
                        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                            <li>• Enter the email address you used to purchase accounts</li>
                            <li>• We'll verify your purchase history</li>
                            <li>• You'll receive a secure link to access your account emails</li>
                            <li>• Access links expire in 24 hours for security</li>
                        </ul>
                    </div>

                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Already have an access token?{' '}
                            <button
                                onClick={() => setShowAccessForm(false)}
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Enter it here
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!accessToken) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
                <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                        Enter Access Token
                    </h1>
                    
                    <form onSubmit={handleTokenSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="token" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Access Token
                            </label>
                            <input
                                type="text"
                                id="token"
                                value={accessToken}
                                onChange={(e) => setAccessToken(e.target.value)}
                                required
                                placeholder="Enter your access token"
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        
                        <button
                            type="submit"
                            disabled={!accessToken}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-md transition-colors"
                        >
                            Access Emails
                        </button>
                    </form>

                    <div className="mt-4 text-center">
                        <button
                            onClick={() => setShowAccessForm(true)}
                            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                            ← Back to email request
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoadingEmails) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your emails...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (emailsError) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
                <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="text-center">
                        <div className="text-red-600 dark:text-red-400 mb-4">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Error</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {('data' in emailsError && emailsError.data && typeof emailsError.data === 'object' && 'message' in emailsError.data) 
                                ? String(emailsError.data.message)
                                : 'Failed to access emails. Your token may have expired or is invalid.'}
                        </p>
                        <button
                            onClick={() => {
                                setAccessToken('');
                                setShowAccessForm(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                        >
                            Request New Access
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const data = buyerEmails?.data;

    // Email Modal
    if (selectedEmail) {
        return (
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50"
                onClick={() => setSelectedEmail(null)}
            >
                <div 
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0 pr-4">
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    {selectedEmail.subject || 'No Subject'}
                                </h2>
                                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    <p><strong>From:</strong> {selectedEmail.from}</p>
                                    <p><strong>To:</strong> {selectedEmail.to}</p>
                                    <p><strong>Date:</strong> {formatDate(selectedEmail.email_created_at)}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedEmail(null)}
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 -m-2 flex-shrink-0"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-140px)] bg-white dark:bg-gray-800">
                        <div 
                            className="prose prose-sm max-w-none overflow-x-auto dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-white prose-a:text-blue-600 dark:prose-a:text-blue-400"
                            style={{ 
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word'
                            }}
                            dangerouslySetInnerHTML={{ 
                                __html: getThemedEmailBody(selectedEmail.body)
                            }} 
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 sm:py-12 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                    Your Purchased Account Emails
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
                                    Buyer: {data?.buyer_email}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1">
                                    {data?.total_accounts} account{data?.total_accounts !== 1 ? 's' : ''} • 
                                    Access expires: {data?.access_expires_at ? formatDate(data.access_expires_at) : 'Unknown'}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setAccessToken('');
                                    setShowAccessForm(true);
                                }}
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 -m-2"
                            >
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6">
                        {data?.accounts && data.accounts.length > 0 ? (
                            <div className="space-y-4 sm:space-y-6">
                                {data.accounts.map((account, index) => (
                                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-2 sm:space-y-0">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                                                    {account.game_name} - {account.server_name}
                                                </h3>
                                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                                    Account: {account.account_email}
                                                </p>
                                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                                                    Code: {account.account_code} • 
                                                    Purchased: {formatDate(account.purchase_date)}
                                                </p>
                                            </div>
                                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs sm:text-sm font-medium px-2 py-1 rounded self-start">
                                                {account.email_count} emails
                                            </span>
                                        </div>

                                        {account.emails && account.emails.length > 0 ? (
                                            <div className="space-y-2 sm:space-y-3">
                                                {account.emails.map((email) => (
                                                    <div 
                                                        key={email.id} 
                                                        className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded border-l-4 border-blue-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors active:bg-gray-200 dark:active:bg-gray-500"
                                                        onClick={() => setSelectedEmail(email)}
                                                    >
                                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 sm:mb-3 space-y-1 sm:space-y-0">
                                                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                                                {email.subject || 'No Subject'}
                                                            </h4>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                {formatDate(email.email_created_at)}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">
                                                            From: {email.from} → To: {email.to}
                                                        </div>
                                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                                            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-headings:text-gray-900 dark:prose-headings:text-white">
                                                                {getEmailPreview(email.body)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                                No emails found for this account.
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 sm:py-12">
                                <div className="text-gray-400 dark:text-gray-600 mb-4">
                                    <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    No Purchased Accounts Found
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                                    We couldn't find any purchased accounts associated with your email address.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BuyerEmailAccess; 