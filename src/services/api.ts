import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Account, Game, Response, Transaction } from "./types";

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
        getAccount: build.query<Account, {gameId: number, accountId: number}>({
            query: (params) => `games/${params.gameId}/accounts/${params.accountId}`,
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
    }),
});

export const { useLazyGetAccountsQuery, useGetAccountsQuery, useLazyGetAccountQuery, useGetAccountQuery, useGetGamesQuery, useGetGameQuery, useAddAccountMutation, useCreateTransactionMutation } = api;