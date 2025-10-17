import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Reading } from '../models/Reading';

interface ReadingsState {
  readings: Reading[];
  isLoading: boolean;
  error: string | null;
  lastSync: string | null;
}

const initialState: ReadingsState = {
  readings: [],
  isLoading: false,
  error: null,
  lastSync: null,
};

const readingsSlice = createSlice({
  name: 'readings',
  initialState,
  reducers: {
    fetchReadingsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchReadingsSuccess: (state, action: PayloadAction<Reading[]>) => {
      state.isLoading = false;
      state.readings = action.payload;
      state.lastSync = new Date().toISOString();
      state.error = null;
    },
    fetchReadingsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    addReading: (state, action: PayloadAction<Reading>) => {
      state.readings.unshift(action.payload);
    },
    updateReading: (state, action: PayloadAction<Reading>) => {
      const index = state.readings.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.readings[index] = action.payload;
      }
    },
    deleteReading: (state, action: PayloadAction<number>) => {
      state.readings = state.readings.filter((r) => r.id !== action.payload);
    },
    clearReadings: (state) => {
      state.readings = [];
      state.lastSync = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchReadingsStart,
  fetchReadingsSuccess,
  fetchReadingsFailure,
  addReading,
  updateReading,
  deleteReading,
  clearReadings,
  clearError,
} = readingsSlice.actions;

export default readingsSlice.reducer;
