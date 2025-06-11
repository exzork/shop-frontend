import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Account, ApiResult, Game, Response, Roller, Transaction } from "./types";
import axios, { AxiosResponse } from 'axios';
import { RootState } from '../store';

const baseQuery = fetchBaseQuery({ 
    baseUrl: "https://shop.exzork.me/api",
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState).auth.token;
        if (token) {
            headers.set('authorization', `Bearer ${token}`);
        }
        return headers;
    },
});

export const api = createApi({
    reducerPath: "api",
    baseQuery,
    tagTypes: ["Account","Game"],
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
    useUpdateEmailMutation
} = api;