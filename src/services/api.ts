import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Account, ApiResult, Game, Response, Roller, Transaction, SalesStats } from "./types";
import axios, { AxiosResponse } from 'axios';
import { RootState } from '../store';
import { store } from '../store';

// List of protected endpoints that require authentication
const PROTECTED_ENDPOINTS = [
    'roller',
    'email',
    'email/sub-roller/token',
    'email/sub-roller/list',
    'email/sub-roller'  // for DELETE operation
];

// Custom base query that checks authentication for protected endpoints
const baseQuery = fetchBaseQuery({ 
    baseUrl: "https://shop.exzork.me/api",
    prepareHeaders: (headers, { getState, endpoint }) => {
        // Handle sub-roller token for access endpoints
        if (endpoint === 'getSubRollerEmails' || endpoint === 'getSubRollerEmailById') {
            const state = getState() as RootState;
            const token = state.auth.token;
            if (token) {
                headers.set('X-Sub-Roller-Token', token);
            }
            return headers;
        }

        // Handle regular authentication
        const token = (getState() as RootState).auth.token;
        if (token) {
            headers.set('authorization', `Bearer ${token}`);
        }
        return headers;
    },
});

const customBaseQuery = async (args: any, api: any, extraOptions: any) => {
    const state = api.getState() as RootState;
    const isAuthenticated = state.auth.isAuthenticated;
    
    // Check if the endpoint requires authentication
    const url = typeof args === 'string' ? args : args.url;
    const requiresAuth = PROTECTED_ENDPOINTS.some(endpoint => 
        url.includes(endpoint) && !url.includes('roller/login')
    );
    
    if (requiresAuth && !isAuthenticated) {
        // Return a silent error that won't trigger the error middleware
        return {
            error: {
                status: 404,
                data: { message: 'Not found' }
            }
        };
    }
    
    return baseQuery(args, api, extraOptions);
};

export const api = createApi({
    reducerPath: "api",
    baseQuery: customBaseQuery,
    tagTypes: ["Account","Game","Email","SubRoller"],
    endpoints: (build) => ({
        login: build.mutation<{token: string}, {code: string, password: string}>({
            query: (credentials) => ({
                url: 'roller/login',
                method: 'POST',
                body: credentials,
            }),
        }),
        changePassword: build.mutation<void, {current_password: string, new_password: string}>({
            query: (passwords) => ({
                url: 'roller/change-password',
                method: 'POST',
                body: passwords,
            }),
        }),
        getAccounts: build.query<Account[], {gameId: number, query: {}}>({
            query: (params) => `games/${params.gameId}/accounts?${new URLSearchParams(params.query).toString()}`,
            transformResponse: (response: Response) => {
                if(response.status === "success"){
                    return response.data
                }
            },
            providesTags: ["Account"],
        }),
        getAccount: build.query<Account, {gameId: number, accountId: number}>({
            query: (params) => `games/${params.gameId}/accounts/${params.accountId}`,
            transformResponse: (response: Response) => {
                if(response.status === "success"){
                    return response.data
                }
            },
        }),
        addAccount: build.mutation<Account,{account: Account}>({
            query: (params) => ({
                url: `games/${params.account.game_id}/accounts`,
                method: "POST",
                body: params.account
            }),
            transformResponse: (response: Response) => {
                if(response.status === "success"){
                    return response.data
                }
            },
            invalidatesTags: ["Account"],
        }),
        deleteAccount: build.mutation<void, {account: Account}>({
            query: (params) => ({
                url: `games/${params.account.game_id}/accounts/${params.account.id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Account"],
        }),
        getGames: build.query<Game[], void>({
            query: () => `games`,
            transformResponse: (response: Response) => {
                if(response.status === "success"){
                    return response.data
                }
            },
            providesTags: ["Game"],
        }),
        getGame: build.query<Game, {gameId: number}>({
            query: (params) => `games/${params.gameId}`,
            transformResponse: (response: Response) => {
                if(response.status === "success"){
                    return response.data
                }
            },
            providesTags: ["Game"],
        }),
        createTransaction: build.mutation<Transaction, Transaction>({
            query: (params) => ({
                url: `transaction`,
                method: "POST",
                body: params
            }),
            transformResponse: (response: Response) => {
                if(response.status === "success"){
                    return response.data
                }
            },
        }),
        getRoller: build.query<Roller, void>({
            query: () => `roller`,
            transformResponse: (response: Response) => {
                if(response.status === "success"){
                    return response.data
                }
            },
        }),
        getIncome: build.query<ApiResult<{
            game_id: number;
            game_name: string;
            total_sold: number;
            total_income: number;
        }[]>, void>({
            query: () => ({
                url: '/roller/income',
                method: 'GET',
            }),
        }),
        updateEmail: build.mutation<void, {email: string}>({
            query: (data) => ({
                url: '/roller/email',
                method: 'PUT',
                body: data,
            }),
        }),
        getSalesStats: build.query<SalesStats[], void>({
            query: () => 'games/sales-stats',
            transformResponse: (response: Response) => {
                if(response.status === "success"){
                    return response.data
                }
            },
        }),
        logoutApi: build.mutation<void, void>({
            query: () => ({
                url: 'roller/logout',
                method: 'POST',
            }),
        }),
        getEmails: build.query<{
            data: {
                emails: Array<{
                    id: number;
                    to: string;
                    from: string;
                    subject: string;
                    body: string;
                    is_html: boolean;
                    created_at: string;
                    is_read: boolean;
                }>;
                limit: number;
                page: number;
                total: number;
            };
            message: string;
            status: string;
        }, { page: number }>({
            query: (params) => `email?page=${params.page}`,
            providesTags: (result) =>
                result?.data?.emails
                    ? [
                        ...result.data.emails.map(email => ({ type: 'Email' as const, id: email.id })),
                        { type: 'Email' as const, id: 'LIST' }
                    ]
                    : [{ type: 'Email' as const, id: 'LIST' }],
        }),
        getEmailById: build.query<{
            data: {
                id: number;
                to: string;
                from: string;
                subject: string;
                body: string;
                is_html: boolean;
                created_at: string;
                is_read: boolean;
            };
            message: string;
            status: string;
        }, number>({
            query: (id) => `email/${id}`,
            providesTags: (_, __, id) => [{ type: 'Email', id }],
        }),
        markEmailAsRead: build.mutation<any, number>({
            query: (id) => ({
                url: `email/${id}/read`,
                method: 'PUT',
            }),
            invalidatesTags: (_, __, id) => [
                { type: 'Email', id },
                { type: 'Email', id: 'LIST' }
            ],
        }),
        generateSubRollerToken: build.mutation<{
            data: {
                token: string;
                email_pattern: string;
            };
            message: string;
            status: string;
        }, { sub_code: string }>({
            query: (data) => ({
                url: 'email/sub-roller/token',
                method: 'POST',
                body: {
                    sub_code: data.sub_code.toLowerCase()
                },
            }),
            invalidatesTags: ['SubRoller'],
        }),
        removeSubRoller: build.mutation<{
            message: string;
            status: string;
        }, { sub_code: string }>({
            query: (data) => ({
                url: 'email/sub-roller',
                method: 'DELETE',
                body: {
                    sub_code: data.sub_code.toLowerCase()
                },
            }),
            invalidatesTags: ['SubRoller'],
        }),
        getSubRollerEmails: build.query<{
            data: {
                emails: Array<{
                    id: number;
                    to: string;
                    from: string;
                    subject: string;
                    body: string;
                    is_html: boolean;
                    created_at: string;
                    is_read: boolean;
                }>;
                limit: number;
                page: number;
                total: number;
            };
            message: string;
            status: string;
        }, { page: number, token: string }>({
            query: (params) => ({
                url: `email/sub-roller/access?page=${params.page}`,
                headers: {
                    'X-Sub-Roller-Token': params.token
                }
            }),
            providesTags: (result) =>
                result?.data?.emails
                    ? [
                        ...result.data.emails.map(email => ({ type: 'Email' as const, id: email.id })),
                        { type: 'Email' as const, id: 'LIST' }
                    ]
                    : [{ type: 'Email' as const, id: 'LIST' }],
        }),
        getSubRollerEmailById: build.query<{
            data: {
                id: number;
                to: string;
                from: string;
                subject: string;
                body: string;
                is_html: boolean;
                created_at: string;
                is_read: boolean;
            };
            message: string;
            status: string;
        }, { id: number, token: string }>({
            query: (params) => ({
                url: `email/sub-roller/access/${params.id}`,
                headers: {
                    'X-Sub-Roller-Token': params.token
                }
            }),
            providesTags: (_, __, { id }) => [{ type: 'Email', id }],
        }),
        getSubRollerList: build.query<{
            data: Array<{
                id: number;
                sub_code: string;
                token: string;
                email_pattern: string;
                created_at: string;
                expires_at: string;
            }>;
            message: string;
            status: string;
        }, void>({
            query: () => 'email/sub-roller/list',
            providesTags: ['SubRoller'],
        }),
        getSubRollerAccessInfo: build.query<ApiResponse<{
            id: number;
            roller_code: string;
            sub_code: string;
            token: string;
            email_pattern: string;
            created_at: string;
            expires_at: string;
        }>, { token: string }>({
            query: ({ token }) => ({
                url: '/email/sub-roller/access/info',
                method: 'GET',
                headers: {
                    'X-Sub-Roller-Token': token
                }
            }),
            providesTags: ['SubRoller'],
        }),
    }),
});

// Create a custom axios instance with the token
const axiosInstance = axios.create({
    baseURL: 'https://shop.exzork.me/api',
});

// Add a request interceptor to include the token
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export async function uploadImage(image: File): Promise<string> {
    try {
        const formData = new FormData();
        formData.append('image', image);

        const response: AxiosResponse<Response> = await axiosInstance.post(
            '/upload',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            }
        );

        const imageUrl: string = response.data.data.link;
        return imageUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

export const { 
    useLazyGetAccountsQuery, 
    useGetAccountsQuery, 
    useLazyGetAccountQuery, 
    useGetAccountQuery, 
    useGetGamesQuery, 
    useGetGameQuery, 
    useAddAccountMutation, 
    useCreateTransactionMutation, 
    useGetRollerQuery, 
    useDeleteAccountMutation,
    useLoginMutation,
    useChangePasswordMutation,
    useGetIncomeQuery,
    useUpdateEmailMutation,
    useGetSalesStatsQuery,
    useLogoutApiMutation,
    useGetEmailsQuery,
    useGetEmailByIdQuery,
    useMarkEmailAsReadMutation,
    useGenerateSubRollerTokenMutation,
    useGetSubRollerEmailsQuery,
    useGetSubRollerEmailByIdQuery,
    useGetSubRollerListQuery,
    useRemoveSubRollerMutation,
    useGetSubRollerAccessInfoQuery,
} = api;

// Add ApiResponse type
interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}