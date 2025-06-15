import { configureStore } from '@reduxjs/toolkit';
import { api } from '../services/api';
import authReducer from './slices/authSlice';
import { rtkQueryErrorLogger } from '../services/error-middleware';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware).concat(rtkQueryErrorLogger),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 