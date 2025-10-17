import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import readingsReducer from './readingsSlice';
import deviceReducer from './deviceSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    readings: readingsReducer,
    device: deviceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in the state for serializability checks
        ignoredActions: ['device/setDevice'],
        ignoredPaths: ['device.currentDevice'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
