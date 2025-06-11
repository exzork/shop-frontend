import { useState } from 'react';
import { useUpdateEmailMutation, useGetRollerQuery } from '../services/api';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Navigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function UpdateEmailPage() {
    const [email, setEmail] = useState('');
    const [updateEmail, { isLoading }] = useUpdateEmailMutation();
    const { data: roller } = useGetRollerQuery();
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateEmail({ email }).unwrap();
            Swal.fire({
                title: 'Success',
                text: 'Email updated successfully',
                icon: 'success',
                confirmButtonText: 'Ok'
            });
            setEmail('');
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'Failed to update email',
                icon: 'error',
                confirmButtonText: 'Ok'
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <div className='bg-gray-900 h-[10vh] flex items-center px-12'>
                <div className="text-xl md:text-3xl font-semibold text-white">
                    ExZork Shop | Update Email
                </div>
            </div>
            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
                    <div>
                        <h2 className="text-center text-3xl font-extrabold text-gray-900">
                            Update Email
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Enter your new email address below
                        </p>
                        {roller?.email && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-md">
                                <p className="text-sm text-gray-600">Current Email:</p>
                                <p className="text-lg font-medium text-gray-900">{roller.email}</p>
                            </div>
                        )}
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="email" className="sr-only">Email address</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
                                    placeholder="New email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${
                                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                {isLoading ? 'Updating...' : 'Update Email'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
} 