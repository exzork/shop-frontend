import { useState, useEffect, useRef } from 'react';
import { useGetEmailsQuery, useGetEmailByIdQuery, useMarkEmailAsReadMutation } from '../services/api';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Navigate } from 'react-router-dom';

interface EmailPageProps {
    refetchEmails: () => void;
}

export default function EmailPage({  }: EmailPageProps) {
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [listWidth, setListWidth] = useState(() => {
        const savedWidth = localStorage.getItem('emailListWidth');
        return savedWidth ? parseInt(savedWidth, 10) : 300;
    });
    const isDragging = useRef(false);
    const startX = useRef(0);
    const startWidth = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
    const [showEmailContent, setShowEmailContent] = useState(false);
    const [touchStartX, setTouchStartX] = useState(0);
    const [touchEndX, setTouchEndX] = useState(0);
    
    const { data: emailData } = useGetEmailsQuery({ page: currentPage });
    const { data: selectedEmailData, isLoading: isEmailLoading } = useGetEmailByIdQuery(selectedEmailId!, { skip: selectedEmailId === null });
    const selectedEmail = selectedEmailData?.data || null;
    const [markEmailAsRead] = useMarkEmailAsReadMutation();

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Lock body scroll on mobile to prevent scrolling beyond the page
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
            setShowEmailContent(false);
            setSelectedEmailId(null);
        }
        setTouchStartX(0);
        setTouchEndX(0);
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
        // Check for common HTML tags
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
        const newWidth = Math.max(200, Math.min(800, startWidth.current + delta));
        setListWidth(newWidth);
        localStorage.setItem('emailListWidth', newWidth.toString());
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

    // Update the email selection handler
    const handleEmailSelect = async (email: any) => {
        if (!email.is_read) {
            await markEmailAsRead(email.id);
        }
        setSelectedEmailId(email.id);
        if (isMobileView) {
            setShowEmailContent(true);
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

    return (
        <div className={`${isMobileView ? 'fixed top-16 left-0 right-0 bottom-0 overflow-hidden' : 'fixed top-16 left-0 right-0 bottom-0 overflow-hidden'}`}>
            <div className={`h-full ${!isMobileView ? 'max-w-screen-2xl mx-auto px-6 lg:px-8 py-8' : ''}`}>
                <div className={`${!isMobileView ? 'h-[calc(100%-4rem)]' : 'h-full'} bg-white dark:bg-gray-800 transition-colors overflow-hidden ${!isMobileView ? 'rounded-lg shadow-lg' : ''}`}>
                    <div 
                        ref={containerRef}
                        className="flex h-full"
                    >
                        {/* Email List */}
                        <div 
                            className={`border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800 transition-colors ${isMobileView && showEmailContent ? 'hidden' : 'block'}`}
                            style={{ width: isMobileView ? '100%' : `${listWidth}px`, minWidth: isMobileView ? '100%' : '200px', maxWidth: isMobileView ? '100%' : '800px' }}
                        >
                            {/* Fixed Header */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Inbox</h2>
                            </div>
                            
                            {/* Fixed Top Pagination */}
                            <div className="flex justify-center items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
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
                            
                            {/* Scrollable Email List */}
                            <div className="flex-1 overflow-y-auto">
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {emailData?.data?.emails.map((email) => (
                                        <div
                                            key={email.id}
                                            className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${selectedEmail?.id === email.id ? 'bg-gray-100 dark:bg-gray-700' : ''} ${!email.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                            onClick={() => handleEmailSelect(email)}
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
                                    ))}
                                </div>
                            </div>
                            
                            {/* Fixed Bottom Pagination */}
                            <div className="flex justify-center items-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
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
                                        <button
                                            onClick={() => {
                                                setShowEmailContent(false);
                                                setSelectedEmailId(null);
                                            }}
                                            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                            Back to Inbox
                                        </button>
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
                                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">Loading...</div>
                                ) : selectedEmail ? (
                                    <div className="h-full flex flex-col">
                                        <div className="mb-6">
                                            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">{selectedEmail.subject}</h2>
                                            <div className="text-gray-600 dark:text-gray-400 mb-4">
                                                <div>From: {selectedEmail.from}</div>
                                                <div>To: {selectedEmail.to}</div>
                                                <div>Date: {formatDate(selectedEmail.created_at)}</div>
                                            </div>
                                        </div>
                                        <div className="flex-1 p-4 rounded-lg overflow-y-auto">
                                            <div className="bg-white dark:bg-gray-800 p-0 m-0 rounded-lg">
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
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 gap-4">
                                        <svg className="w-16 h-16 mb-2 text-gray-200 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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