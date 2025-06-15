import { useState, useEffect, useRef } from 'react';
import { useGetSubRollerEmailsQuery, useGetSubRollerEmailByIdQuery, useGetSubRollerAccessInfoQuery } from '../services/api';
import { useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setToken } from '../store/slices/authSlice';
import Pusher from 'pusher-js';

export default function EmailViewerPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const dispatch = useDispatch();
    const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [listWidth, setListWidth] = useState(400); // Default width in pixels
    const isDragging = useRef(false);
    const startX = useRef(0);
    const startWidth = useRef(0);
    // Theme state for dark mode toggle
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

    // Set token in auth state
    useEffect(() => {
        if (token) {
            dispatch(setToken(token));
        }
    }, [token, dispatch]);

    const { data: subRollerInfo } = useGetSubRollerAccessInfoQuery(
        { token: token || '' },
        { skip: !token }
    );

    // Debug logging
    useEffect(() => {
        console.log('Token from URL:', token);
        console.log('Current page:', currentPage);
    }, [token, currentPage]);

    const { data: emailData, isLoading: isEmailsLoading, error, refetch } = useGetSubRollerEmailsQuery(
        { page: currentPage, token: token || '' },
        { 
            skip: !token,
            refetchOnMountOrArgChange: true
        }
    );

    // Debug logging
    useEffect(() => {
        console.log('Email Data:', emailData);
        console.log('Error:', error);
        console.log('Loading:', isEmailsLoading);
        if (error) {
            console.log('Error details:', error);
        }
    }, [emailData, error, isEmailsLoading]);

    // Force refetch when token changes
    useEffect(() => {
        if (token) {
            console.log('Refetching with token:', token);
            refetch();
        }
    }, [token, refetch]);

    // Setup Pusher connection for real-time email updates
    useEffect(() => {
        if (!token || !subRollerInfo?.data) return;

        const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
            cluster: import.meta.env.VITE_PUSHER_CLUSTER,
            authEndpoint: '/api/pusher/auth',
            auth: {
                headers: {
                    'X-Sub-Roller-Token': token
                }
            }
        });

        // Use roller_code and sub_code from the API response
        const { roller_code, sub_code } = subRollerInfo.data;
        const channelName = `private-${roller_code}-${sub_code}`;
        console.log('Sub-roller info:', subRollerInfo.data); // Debug log
        console.log('Subscribing to channel:', channelName); // Debug log
        const channel = pusher.subscribe(channelName);

        channel.bind('new-email', () => {
            console.log('Received new email notification'); // Debug log
            refetch();
        });

        return () => {
            channel.unbind_all();
            channel.unsubscribe();
            pusher.disconnect();
        };
    }, [token, subRollerInfo, refetch]);

    const { data: selectedEmailData, isLoading: isEmailLoading } = useGetSubRollerEmailByIdQuery(
        { id: selectedEmailId!, token: token || '' },
        { 
            skip: selectedEmailId === null || !token,
            refetchOnMountOrArgChange: true
        }
    );

    const selectedEmail = selectedEmailData?.data || null;

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

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        startX.current = e.clientX;
        startWidth.current = listWidth;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return;
        const delta = e.clientX - startX.current;
        const newWidth = Math.max(300, Math.min(800, startWidth.current + delta));
        setListWidth(newWidth);
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    };

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    if (!token) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Access</h2>
                        <p className="text-gray-600">No token provided. Please use a valid email viewer link.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <div className="container mx-auto px-4 py-8">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden transition-colors">
                    <div className="flex h-[calc(100vh-4rem)]">
                        {/* Email List */}
                        <div 
                            className="border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-white dark:bg-gray-800 transition-colors"
                            style={{ width: `${listWidth}px`, minWidth: '300px', maxWidth: '800px' }}
                        >
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-colors">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-wide transition-colors">
                                        Inbox
                                    </h3>
                                    <button
                                        onClick={toggleTheme}
                                        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                                        className="ml-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        {theme === 'dark' ? (
                                            <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5 text-yellow-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.05l-.71-.71M12 7a5 5 0 100 10 5 5 0 000-10z' />
                                            </svg>
                                        ) : (
                                            <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5 text-gray-600 dark:text-gray-200' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z' />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                            {/* Top Pagination */}
                            {emailData?.data?.emails && Array.isArray(emailData.data.emails) && emailData.data.emails.length > 0 && (
                                <div className="flex justify-center items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-colors">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-gray-600 dark:text-gray-300 transition-colors">
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
                            <div className="divide-y divide-gray-200 dark:divide-gray-800">
                                {isEmailsLoading ? (
                                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 transition-colors">Loading emails...</div>
                                ) : !emailData?.data?.emails || emailData.data.emails.length === 0 ? (
                                    <div className="p-8 flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 transition-colors">
                                        <svg className="w-12 h-12 mb-2 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12H8m8 0a4 4 0 11-8 0 4 4 0 018 0zm-8 0V8a4 4 0 018 0v4" />
                                        </svg>
                                        <span>No emails found</span>
                                    </div>
                                ) :
                                    emailData.data.emails.map((email) => (
                                        <div
                                            key={email.id}
                                            className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${selectedEmail?.id === email.id ? 'bg-gray-100 dark:bg-gray-700' : ''} ${!email.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
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
                                }
                            </div>
                            {/* Bottom Pagination */}
                            {emailData?.data?.emails && Array.isArray(emailData.data.emails) && emailData.data.emails.length > 0 && (
                                <div className="flex justify-center items-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-colors">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-gray-600 dark:text-gray-300 transition-colors">
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

                        {/* Resize Handle */}
                        <div
                            className="w-2 cursor-col-resize bg-gray-200 dark:bg-gray-700 hover:bg-indigo-200 dark:hover:bg-indigo-700 active:bg-indigo-400 dark:active:bg-indigo-600 flex items-center justify-center transition-colors"
                            onMouseDown={handleMouseDown}
                        >
                            <div className="w-1 h-8 bg-indigo-400 dark:bg-indigo-600 rounded-full"></div>
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
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
                                    <svg className="w-16 h-16 mb-2 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12H8m8 0a4 4 0 11-8 0 4 4 0 018 0zm-8 0V8a4 4 0 018 0v4" />
                                    </svg>
                                    <span className="text-lg">Select an email to view its content</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 