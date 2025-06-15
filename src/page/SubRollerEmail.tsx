import { useState, useEffect } from 'react';
import { useGenerateSubRollerTokenMutation, useGetSubRollerEmailsQuery, useGetSubRollerEmailByIdQuery, useGetSubRollerListQuery, useRemoveSubRollerMutation } from '../services/api';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Navigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Pusher from 'pusher-js';

interface SubRoller {
    id: number;
    sub_code: string;
    token: string;
    email_pattern: string;
    created_at: string;
    expires_at: string;
    roller_code: string;
}

export default function SubRollerEmailPage() {
    const [subCode, setSubCode] = useState('');
    const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedSubRoller, setSelectedSubRoller] = useState<SubRoller | null>(null);
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const [generateToken] = useGenerateSubRollerTokenMutation();
    const [removeSubRoller] = useRemoveSubRollerMutation();
    const { data: subRollersData, isLoading: isSubRollersLoading } = useGetSubRollerListQuery();
    const { data: emailData, refetch: refetchEmails, isLoading: isEmailsLoading } = useGetSubRollerEmailsQuery(
        { page: currentPage, token: selectedSubRoller?.token || '' }, 
        { skip: !selectedSubRoller?.token }
    );
    const { data: selectedEmailData, isLoading: isEmailLoading } = useGetSubRollerEmailByIdQuery(
        { id: selectedEmailId!, token: selectedSubRoller?.token || '' }, 
        { skip: selectedEmailId === null || !selectedSubRoller?.token }
    );
    const selectedEmail = selectedEmailData?.data || null;

    useEffect(() => {
        if (selectedSubRoller) {
            localStorage.setItem('sub_roller_token', selectedSubRoller.token);
            refetchEmails();
        }
    }, [selectedSubRoller, refetchEmails]);

    // Setup Pusher connection for sub-roller emails
    useEffect(() => {
        if (!selectedSubRoller?.token || !selectedSubRoller?.sub_code) return;

        const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
            cluster: import.meta.env.VITE_PUSHER_CLUSTER,
            authEndpoint: '/api/pusher/auth',
        });

        // New channel format: private-<roller>-<subroller>
        const channelName = `private-${selectedSubRoller.roller_code}-${selectedSubRoller.sub_code}`;
        const channel = pusher.subscribe(channelName);

        channel.bind('new-email', () => {
            refetchEmails();
        });

        return () => {
            channel.unbind_all();
            channel.unsubscribe();
            pusher.disconnect();
        };
    }, [selectedSubRoller?.token, selectedSubRoller?.sub_code, selectedSubRoller?.roller_code, refetchEmails]);

    // Debug logging
    useEffect(() => {
        console.log('Email Data:', emailData);
    }, [emailData]);

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    const handleGenerateToken = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const result = await generateToken({ sub_code: subCode }).unwrap();
            if (result.status === 'success') {
                setSubCode('');
                Swal.fire({
                    title: 'Success',
                    text: `Token generated successfully. You can now receive emails at ${result.data.email_pattern}`,
                    icon: 'success',
                    confirmButtonText: 'Ok'
                });
            }
        } catch (error: any) {
            let errorMessage = 'Failed to generate token';
            if (error.data?.message) {
                errorMessage = error.data.message;
            }
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                confirmButtonText: 'Ok'
            });
        }
    };

    const handleRemoveSubRoller = async (code: string) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This will remove the sub-roller and its token. You won't be able to access its emails anymore.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, remove it!'
        });

        if (result.isConfirmed) {
            try {
                const response = await removeSubRoller({ sub_code: code }).unwrap();
                if (response.status === 'success') {
                    if (selectedSubRoller?.sub_code === code) {
                        setSelectedSubRoller(null);
                        setSelectedEmailId(null);
                        localStorage.removeItem('sub_roller_token');
                        refetchEmails();
                    }
                    Swal.fire({
                        title: 'Success',
                        text: response.message || 'Sub-roller removed successfully',
                        icon: 'success',
                        confirmButtonText: 'Ok'
                    });
                }
            } catch (error: any) {
                let errorMessage = 'Failed to remove sub-roller';
                if (error.data?.message) {
                    errorMessage = error.data.message;
                }
                Swal.fire({
                    title: 'Error',
                    text: errorMessage,
                    icon: 'error',
                    confirmButtonText: 'Ok'
                });
            }
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const stripHtml = (html: string) => {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    const isHtmlContent = (content: string): boolean => {
        const htmlTagRegex = /<[a-z][\s\S]*>/i;
        return htmlTagRegex.test(content);
    };

    const totalPages = emailData?.data?.total ? Math.ceil(emailData.data.total / emailData.data.limit) : 1;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Sub-Roller Email Management</h2>
                    
                    <form onSubmit={handleGenerateToken} className="space-y-4 mb-8">
                        <div>
                            <label htmlFor="subCode" className="block text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                Add New Sub-Roller
                            </label>
                            <input
                                type="text"
                                id="subCode"
                                value={subCode}
                                onChange={(e) => setSubCode(e.target.value)}
                                className="mt-1 block w-full px-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-gray-500 focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                placeholder="Enter sub-roller code (e.g., sub1)"
                                required
                            />
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                This code will be used to create your unique email pattern
                            </p>
                        </div>
                        <button
                            type="submit"
                            className="w-full inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-lg font-medium rounded-lg text-white bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                        >
                            Generate Token
                        </button>
                    </form>

                    {isSubRollersLoading ? (
                        <div className="text-center text-gray-500 dark:text-gray-400">Loading sub-rollers...</div>
                    ) : subRollersData?.data && subRollersData.data.length > 0 ? (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Active Sub-Rollers</h3>
                            <div className="grid gap-4">
                                {subRollersData.data.map((subRoller) => (
                                    <div
                                        key={subRoller.id}
                                        className={`p-4 rounded-lg border-2 ${
                                            selectedSubRoller?.id === subRoller.id
                                                ? 'border-gray-900 dark:border-gray-500 bg-gray-50 dark:bg-gray-700'
                                                : 'border-gray-200 dark:border-gray-600'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                                    Code: {subRoller.sub_code}
                                                </h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                    Pattern: {subRoller.email_pattern}
                                                </p>
                                            </div>
                                            <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                                                <button
                                                    onClick={() => {
                                                        const url = `${window.location.origin}/email-viewer?token=${subRoller.token}`;
                                                        navigator.clipboard.writeText(url);
                                                        // Show a temporary success message
                                                        const button = document.createElement('div');
                                                        button.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg';
                                                        button.textContent = 'Link copied to clipboard!';
                                                        document.body.appendChild(button);
                                                        setTimeout(() => button.remove(), 2000);
                                                    }}
                                                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                                >
                                                    Copy Link
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveSubRoller(subRoller.sub_code)}
                                                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400">No active sub-rollers found</div>
                    )}
                </div>

                {selectedSubRoller && (
                    <div className="flex h-[calc(100vh-24rem)]">
                        {/* Email List */}
                        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-white dark:bg-gray-800">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Emails for {selectedSubRoller.sub_code}
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {isEmailsLoading ? (
                                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading emails...</div>
                                ) : emailData?.data?.emails && emailData.data.emails.length > 0 ? (
                                    emailData.data.emails.map((email) => (
                                        <div
                                            key={email.id}
                                            className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                                selectedEmail?.id === email.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                                            } ${!email.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                            onClick={() => setSelectedEmailId(email.id)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                        {email.from}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">
                                                        To: {email.to}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-300 truncate mt-1">
                                                        {email.subject}
                                                    </p>
                                                    <p className="text-sm text-gray-400 dark:text-gray-500 truncate mt-1">
                                                        {stripHtml(email.body)}
                                                    </p>
                                                </div>
                                                <div className="ml-4 flex-shrink-0">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {formatDate(email.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                        No emails found
                                    </div>
                                )}
                            </div>
                            {/* Pagination */}
                            {emailData?.data?.emails && Array.isArray(emailData.data.emails) && emailData.data.emails.length > 0 && (
                                <div className="flex justify-center items-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-gray-600 dark:text-gray-300">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Email Content */}
                        <div className="flex-1 p-6 overflow-y-auto bg-white">
                            {isEmailLoading ? (
                                <div className="flex items-center justify-center h-full text-gray-500">Loading...</div>
                            ) : selectedEmail ? (
                                <div>
                                    <div className="mb-6">
                                        <h2 className="text-2xl font-bold mb-2 text-gray-900">{selectedEmail.subject}</h2>
                                        <div className="text-gray-600 mb-4">
                                            <div>From: {selectedEmail.from}</div>
                                            <div>To: {selectedEmail.to}</div>
                                            <div>Date: {formatDate(selectedEmail.created_at)}</div>
                                        </div>
                                    </div>
                                    <div className="prose max-w-none">
                                        {isHtmlContent(selectedEmail.body) ? (
                                            <div 
                                                className="prose max-w-none"
                                                dangerouslySetInnerHTML={{ 
                                                    __html: selectedEmail.body
                                                }} 
                                            />
                                        ) : (
                                            <pre className="whitespace-pre-wrap">{selectedEmail.body}</pre>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    Select an email to view its content
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 