import { createSlice } from '@reduxjs/toolkit';

interface Result {
  correct: boolean;
  patten: number;
  point: number;
  winningStreak: number;
}

interface Coin {
  result: Result | null;
  ranking: any;
}

const initialState: Coin = {
  result: null,
  ranking: null,
};

const coinSlice = createSlice({
  name: 'coin',
  initialState,
  reducers: {
    requestCoinFlipStart(state, action) {},
    requestCoinFlipSuccess(state, action) {
      state.result = action.payload;
    },
    requestCoinFlipError(state, action) {},
    // 결과 리셋
    resetResult(state) {
      state.result = null;
    },
    // 기록 조회
    fetchSsafyRecordStart(state) {},
    fetchSsafyRecordSuccess(state, action) {
      state.ranking = action.payload;
    },
    fetchSsafyRecordError(state, action) {
      // console.log(action.payload);
    },
  },
});

export const coinActions = coinSlice.actions;

export default coinSlice.reducer;
