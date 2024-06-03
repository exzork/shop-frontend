import {configureStore} from "@reduxjs/toolkit";
import { api } from "../services/api";
import { rtkQueryErrorLogger } from "../services/error-middleware";
import {setupListeners} from "@reduxjs/toolkit/query";

const store = configureStore({
    reducer:{
        [api.reducerPath]:api.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    }).concat(api.middleware).concat(rtkQueryErrorLogger)
})
setupListeners(store.dispatch)
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch;
export default store;