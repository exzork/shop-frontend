import { useState, useEffect, useRef } from 'react';
import { useGetSubRollerEmailsQuery, useGetSubRollerEmailByIdQuery, useGetSubRollerAccessInfoQuery } from '../services/api';
import { useSearchParams, useNavigate, useParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setToken } from '../store/slices/authSlice';
import Pusher from 'pusher-js';

export default function EmailViewerPage() {
    const [searchParams] = useSearchParams();
    const { emailId } = useParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const dispatch = useDispatch();
    const [selectedEmailId, setSelectedEmailId] = useState<number | null>(emailId ? parseInt(emailId) : null);
    const [currentPage, setCurrentPage] = useState(1);
    const [listWidth, setListWidth] = useState(() => {
        const savedWidth = localStorage.getItem('emailViewerListWidth');
        return savedWidth ? parseInt(savedWidth, 10) : 400;
    });
    const isDragging = useRef(false);
    const startX = useRef(0);
    const startWidth = useRef(0);
    // Theme state for dark mode toggle
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const notificationSound = useRef<HTMLAudioElement | null>(null);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
    const [showEmailContent, setShowEmailContent] = useState(!!emailId);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullStart, setPullStart] = useState(0);
    const [pullDistance, setPullDistance] = useState(0);
    const emailListRef = useRef<HTMLDivElement>(null);
    const [touchStartX, setTouchStartX] = useState(0);
    const [touchEndX, setTouchEndX] = useState(0);

    // Update URL when email is selected (only for desktop)
    useEffect(() => {
        if (selectedEmailId && !isMobileView) {
            navigate(`/email-viewer/${selectedEmailId}?token=${token}`, { replace: true });
        }
    }, [selectedEmailId, token, navigate, isMobileView]);

    // Sync state with URL parameters
    useEffect(() => {
        if (emailId) {
            const id = parseInt(emailId);
            setSelectedEmailId(id);
            setShowEmailContent(true);
        } else {
            setSelectedEmailId(null);
            setShowEmailContent(false);
        }
    }, [emailId]);

    // Handle browser back button
    useEffect(() => {
        const handlePopState = () => {
            setSelectedEmailId(null);
            setShowEmailContent(false);
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Lock body scroll on mobile
    useEffect(() => {
        if (isMobileView) {
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.height = '100%';
        } else {
            // Restore body scroll
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.height = '';
        }

        // Cleanup on unmount
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.height = '';
        };
    }, [isMobileView]);

    // Back gesture handlers
    const handleBackGestureStart = (e: React.TouchEvent) => {
        if (!isMobileView || !showEmailContent) return;
        setTouchStartX(e.touches[0].clientX);
    };

    const handleBackGestureMove = (e: React.TouchEvent) => {
        if (!isMobileView || !showEmailContent) return;
        e.preventDefault(); // Prevent default scroll behavior
        setTouchEndX(e.touches[0].clientX);
    };

    const handleBackGestureEnd = (e: React.TouchEvent) => {
        if (!isMobileView || !showEmailContent) return;
        e.preventDefault();
        const swipeDistance = touchEndX - touchStartX;
        if (swipeDistance > 100) {
            window.history.back();
        }
        setTouchStartX(0);
        setTouchEndX(0);
    };

    // Pull to refresh handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        if (!isMobileView || showEmailContent) return;
        const touch = e.touches[0];
        setPullStart(touch.clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isMobileView || showEmailContent) return;
        const touch = e.touches[0];
        const pull = touch.clientY - pullStart;
        if (pull > 0) {
            setPullDistance(pull);
        }
    };

    const handleTouchEnd = async () => {
        if (!isMobileView || showEmailContent) return;
        if (pullDistance > 100) {
            setIsRefreshing(true);
            await refetch();
            setIsRefreshing(false);
        }
        setPullDistance(0);
        setPullStart(0);
    };

    // Set token in auth state
    useEffect(() => {
        if (token) {
            dispatch(setToken(token));
        }
    }, [token, dispatch]);

    // Initialize notification sound
    useEffect(() => {
        const audio = new Audio('/notification.mp3');
        audio.preload = 'auto';
        audio.volume = 0.5; // Set volume to 50%
        notificationSound.current = audio;
    }, []);

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
        const channel = pusher.subscribe(channelName);

        channel.bind('new-email', () => {
            if (notificationSound.current) {
                // Reset the audio to the beginning
                notificationSound.current.currentTime = 0;
                // Play the sound
                notificationSound.current.play().catch(error => {
                    console.log('Error playing notification sound:', error);
                });
            }
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
        localStorage.setItem('emailViewerListWidth', newWidth.toString());
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

    // Update the email selection handler (only for desktop)
    const handleEmailSelect = (emailId: number) => {
        if (!isMobileView) {
            setSelectedEmailId(emailId);
        }
    };

    // Utility to check if email body contains color styling
    const emailBodyHasColor = (body: string) => {
        return /style\s*=\s*"[^"]*color\s*:/i.test(body) || /class\s*=\s*"[^"]*text-\w+/i.test(body);
    };

    // Utility to wrap email body with theme-aware color if needed
    const getThemedEmailBody = (body: string) => {
        const cleanBody = body.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        if (emailBodyHasColor(cleanBody)) {
            return cleanBody;
        }
        const isDark = document.documentElement.classList.contains('dark');
        const color = isDark ? '#e5e7eb' : '#111827';
        return `<div style=\"color: ${color};\">${cleanBody}</div>`;
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Invalid Access</h2>
                        <p className="text-gray-600 dark:text-gray-400">No token provided. Please use a valid email viewer link.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Invalid Access</h2>
                        <p className="text-gray-600 dark:text-gray-400">The provided token is invalid or has expired. Please request a new link.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${isMobileView ? 'fixed inset-0 overflow-hidden' : 'fixed top-0 left-0 right-0 bottom-0 overflow-hidden'} bg-gray-50 dark:bg-gray-900 transition-colors`}>
            <div className={`h-full ${!isMobileView ? 'max-w-screen-2xl mx-auto px-6 lg:px-8 py-8' : ''}`}>
                <div className={`${!isMobileView ? 'h-[calc(100%-4rem)]' : 'h-full'} bg-white dark:bg-gray-800 transition-colors overflow-hidden ${!isMobileView ? 'rounded-lg shadow-lg' : ''}`}>
                    <div className="flex h-full">
                        {/* Email List */}
                        <div 
                            ref={emailListRef}
                            className={`border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors flex flex-col ${isMobileView && showEmailContent ? 'hidden' : 'block'}`}
                            style={{ width: isMobileView ? '100%' : `${listWidth}px`, minWidth: isMobileView ? '100%' : '300px', maxWidth: isMobileView ? '100%' : '800px' }}
                        >
                            {/* Pull to refresh indicator - only show when not showing email content */}
                            {isMobileView && !showEmailContent && (
                                <div 
                                    className="w-full flex items-center justify-center transition-all duration-200"
                                    style={{ 
                                        height: `${Math.min(pullDistance, 100)}px`,
                                        opacity: pullDistance > 0 ? 1 : 0,
                                        transform: `translateY(${Math.min(pullDistance, 100)}px)`
                                    }}
                                    onTouchStart={handleTouchStart}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={handleTouchEnd}
                                >
                                    <div className="flex items-center text-gray-500">
                                        {isRefreshing ? (
                                            <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        )}
                                        {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
                                    </div>
                                </div>
                            )}
                            
                            {/* Fixed Header */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-colors flex-shrink-0">
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
                            
                            {/* Fixed Top Pagination */}
                            {emailData?.data?.emails && Array.isArray(emailData.data.emails) && emailData.data.emails.length > 0 && (
                                <div className="flex justify-center items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-colors flex-shrink-0">
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
                            
                            {/* Scrollable Email List */}
                            <div 
                                className="flex-1 overflow-y-auto"
                                onTouchStart={!isMobileView ? handleTouchStart : undefined}
                                onTouchMove={!isMobileView ? handleTouchMove : undefined}
                                onTouchEnd={!isMobileView ? handleTouchEnd : undefined}
                            >
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
                                            isMobileView ? (
                                                <Link
                                                    key={email.id}
                                                    to={`/email-viewer/${email.id}?token=${token}`}
                                                    className={`block p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors no-underline ${selectedEmail?.id === email.id ? 'bg-gray-100 dark:bg-gray-700' : ''} ${!email.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                                    style={{ textDecoration: 'none', color: 'inherit' }}
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
                                                </Link>
                                            ) : (
                                                <div
                                                    key={email.id}
                                                    className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${selectedEmail?.id === email.id ? 'bg-gray-100 dark:bg-gray-700' : ''} ${!email.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                                    onClick={() => handleEmailSelect(email.id)}
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
                                            )
                                        ))
                                    }
                                </div>
                            </div>
                            
                            {/* Fixed Bottom Pagination */}
                            {emailData?.data?.emails && Array.isArray(emailData.data.emails) && emailData.data.emails.length > 0 && (
                                <div className="flex justify-center items-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-colors flex-shrink-0">
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

                        {/* Resize Handle - Only show on desktop */}
                        {!isMobileView && (
                            <div
                                className="w-2 cursor-col-resize bg-gray-200 dark:bg-gray-700 hover:bg-indigo-200 dark:hover:bg-indigo-700 active:bg-indigo-400 dark:active:bg-indigo-600 flex items-center justify-center transition-colors"
                                onMouseDown={handleMouseDown}
                            >
                                <div className="w-1 h-8 bg-indigo-400 dark:bg-indigo-600 rounded-full"></div>
                            </div>
                        )}

                        {/* Email Content */}
                        <div className={`flex-1 flex flex-col bg-white dark:bg-gray-800 ${isMobileView && !showEmailContent ? 'hidden' : 'block'}`}>
                            {isMobileView && (
                                <div className="p-6 pb-0 flex-shrink-0">
                                    <div className="flex items-center mb-4">
                                        <Link
                                            to={`/email-viewer?token=${token}`}
                                            className="flex items-center transition-colors no-underline"
                                            style={{ textDecoration: 'none', color: 'inherit' }}
                                        >
                                            <svg className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                            <span className="text-gray-600 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white">Back to Inbox</span>
                                        </Link>
                                    </div>
                                </div>
                            )}
                            <div 
                                className="flex-1 p-6 overflow-y-auto"
                                onTouchStart={isMobileView ? handleBackGestureStart : undefined}
                                onTouchMove={isMobileView ? handleBackGestureMove : undefined}
                                onTouchEnd={isMobileView ? handleBackGestureEnd : undefined}
                                style={{
                                    transform: isMobileView && showEmailContent ? 
                                        `translateX(${Math.max(0, touchEndX - touchStartX)}px)` : 
                                        'translateX(0)',
                                    transition: touchEndX === 0 ? 'transform 0.3s ease-out' : 'none',
                                    touchAction: isMobileView ? 'pan-y' : 'auto'
                                }}
                            >
                                {isEmailLoading ? (
                                    <div className="flex items-center justify-center h-full text-gray-500">Loading...</div>
                                ) : selectedEmail ? (
                                    <div className="h-full">
                                        <div className="mb-6">
                                            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">{selectedEmail.subject}</h2>
                                            <div className="text-gray-600 dark:text-gray-400 mb-4">
                                                <div>From: {selectedEmail.from}</div>
                                                <div>To: {selectedEmail.to}</div>
                                                <div>Date: {formatDate(selectedEmail.created_at)}</div>
                                            </div>
                                        </div>
                                        <div className="prose max-w-none flex-1">
                                            {isHtmlContent(selectedEmail.body) ? (
                                                <div 
                                                    className="prose max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-white prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-pre:bg-gray-100 prose-pre:text-gray-900 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:bg-gray-900 dark:prose-pre:text-gray-100 dark:prose-pre:border dark:prose-pre:border-gray-700 prose-code:bg-gray-100 prose-code:text-gray-900 dark:prose-code:bg-gray-900 dark:prose-code:text-gray-100"
                                                    dangerouslySetInnerHTML={{ 
                                                        __html: getThemedEmailBody(selectedEmail.body)
                                                    }} 
                                                />
                                            ) : (
                                                <pre className="whitespace-pre-wrap p-4 rounded-lg bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 overflow-x-auto">{selectedEmail.body}</pre>
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
        </div>
    );
} 