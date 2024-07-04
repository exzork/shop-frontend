import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Account, Game, Response, Roller, Transaction } from "./types";
import axios, { AxiosResponse } from 'axios';

export const api = createApi({
    reducerPath: "api",
    baseQuery: fetchBaseQuery({ baseUrl: "https://shop.exzork.me/api" }),
    tagTypes: ["Account","Game"],
    endpoints: (build) => ({
        getAccounts: build.query<Account[], {gameId: number, query: {}}>({
            query: (params) => `games/${params.gameId}/accounts?${new URLSearchParams(params.query).toString()}`,
            transformResponse: (response: Response) => {
                if(response.status === "success"){
                    return response.data
                }
            },
            providesTags: ["Account"],
        }),
        getAccount: build.query<Account, {gameId: number, accountId: number, token?: string}>({
            query: (params) => `games/${params.gameId}/accounts/${params.accountId}${params.token ? `?token=${params.token}` : ""}`,
            transformResponse: (response: Response) => {
                if(response.status === "success"){
                    return response.data
                }
            },
        }),
        addAccount: build.mutation<Account,{account: Account, token: string}>({
            query: (params) => ({
                url: `games/${params.account.game_id}/accounts?token=${params.token}`,
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
        deleteAccount: build.mutation<void, {account: Account, token: string}>({
            query: (params) => ({
                url: `games/${params.account.game_id}/accounts/${params.account.id}?token=${params.token}`,
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
        getRoller: build.query<Roller, {token: string}>({
            query: (params) => `roller?token=${params.token}`,
            transformResponse: (response: Response) => {
                if(response.status === "success"){
                    return response.data
                }
            },
        }),
    }),
});


export async function uploadImage(image: File, token: string): Promise<string> {
    try {
        // Create FormData object to send the file
        const formData = new FormData();
        formData.append('image', image);

        // Make a POST request to upload the image
        const response: AxiosResponse<Response> = await axios.post(
            'https://shop.exzork.me/api/upload',
            formData,
            {
                params: {
                    token: token
                },
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );

        // Assuming the server responds with the URL of the uploaded image
        const imageUrl: string = response.data.data.link;
        
        return imageUrl;
    } catch (error) {
        // Handle error
        console.error('Error uploading image:', error);
        throw error;
    }
}


export const { useLazyGetAccountsQuery, useGetAccountsQuery, useLazyGetAccountQuery, useGetAccountQuery, useGetGamesQuery, useGetGameQuery, useAddAccountMutation, useCreateTransactionMutation, useGetRollerQuery, useDeleteAccountMutation } = api;