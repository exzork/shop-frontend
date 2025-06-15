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
    const [listWidth, setListWidth] = useState(300); // Default width in pixels
    const isDragging = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { data: emailData } = useGetEmailsQuery({ page: currentPage });
    const { data: selectedEmailData, isLoading: isEmailLoading } = useGetEmailByIdQuery(selectedEmailId!, { skip: selectedEmailId === null });
    const selectedEmail = selectedEmailData?.data || null;
    const [markEmailAsRead] = useMarkEmailAsReadMutation();

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

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

    // Read initial width from localStorage
    useEffect(() => {
        const savedWidth = localStorage.getItem('emailListWidth');
        if (savedWidth) {
            setListWidth(Number(savedWidth));
        }
    }, []);

    const handleMouseDown = () => {
        isDragging.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = e.clientX - containerRect.left;
        if (newWidth >= 200 && newWidth <= containerRect.width - 400) {
            setListWidth(newWidth);
            localStorage.setItem('emailListWidth', String(newWidth));
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div 
                    ref={containerRef}
                    className="flex h-[calc(100vh-12rem)]"
                >
                    {/* Email List */}
                    <div 
                        className="border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex flex-col bg-white dark:bg-gray-800"
                        style={{ width: `${listWidth}px`, minWidth: '200px' }}
                    >
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Inbox</h2>
                        </div>
                        {/* Top Pagination */}
                        <div className="flex justify-center items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
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
                        <div className="flex-1 overflow-y-auto">
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {emailData?.data?.emails.map((email) => (
                                    <div
                                        key={email.id}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${selectedEmail?.id === email.id ? 'bg-gray-100 dark:bg-gray-700' : ''} ${!email.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                        onClick={async () => {
                                            if (!email.is_read) {
                                                await markEmailAsRead(email.id);
                                            }
                                            setSelectedEmailId(email.id);
                                        }}
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
                        {/* Bottom Pagination */}
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
                    </div>

                    {/* Resizer */}
                    <div
                        className="w-2 md:w-4 flex items-center justify-center cursor-col-resize bg-gray-200 dark:bg-gray-700 hover:bg-blue-400 dark:hover:bg-blue-600 active:bg-blue-600 dark:active:bg-blue-700 transition-colors relative z-10"
                        style={{ width: '8px', minWidth: '8px' }}
                        onMouseDown={handleMouseDown}
                    >
                        <span className="pointer-events-none select-none">
                            {/* Vertical dots icon */}
                            <svg width="16" height="32" viewBox="0 0 16 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="8" cy="8" r="2" fill="currentColor" className="text-gray-500 dark:text-gray-400" />
                                <circle cx="8" cy="16" r="2" fill="currentColor" className="text-gray-500 dark:text-gray-400" />
                                <circle cx="8" cy="24" r="2" fill="currentColor" className="text-gray-500 dark:text-gray-400" />
                            </svg>
                        </span>
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
    );
} 