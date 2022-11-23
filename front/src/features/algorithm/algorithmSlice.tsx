import { createSlice } from '@reduxjs/toolkit';
import { Action } from '../../models/algo';
import { AlgoRoomInterface, RecordSendInterface } from '../../models/algo';

type AlgoGameState = {
  isLoading: boolean;
  needReload: boolean;
  InGameInfo: AlgoRoomInterface | null;
  solve: boolean;
  gameResultMsg: string;
  loadingMsg: string;
};

const initialState: AlgoGameState = {
  isLoading: false,
  InGameInfo: null,
  needReload: false,
  solve: false,
  gameResultMsg: '',
  loadingMsg: '',
};

const algoSlice = createSlice({
  name: 'algo',
  initialState,
  reducers: {
    loadingEnd(state) {
      state.isLoading = false;
    },
    setLoadingMsg(state, action: Action<string>) {
      // console.log('로딩메세지 변경', action.payload);
      state.loadingMsg = action.payload;
    },
    setNeedReload(state, action: Action<boolean>) {
      state.needReload = action.payload;
    },
    creatAlgoRoom(state, action: Action<AlgoRoomInterface>) {},
    enterAlgoRoom(state, action: Action<AlgoRoomInterface>) {},
    enterAlgoRoomSuccess(state, action: Action<AlgoRoomInterface>) {
      state.InGameInfo = action.payload;
    },
    exitAlgoRoom(state) {
      state.InGameInfo = null;
    },
    checkMyAnswerRequestStart(
      state,
      action: Action<{
        roomCode: string;
        problemId: number;
        userBjId: string;
        lanId: number;
      }>,
    ) {
      state.loadingMsg = 'SUBMIT';
      state.isLoading = true;
    },
    solveSuccess(state, action: Action<boolean>) {
      state.solve = action.payload;
    },
    sendMyRank(state, action: Action<RecordSendInterface>) {},
    setGameResult(state, action: Action<string>) {
      // console.log('게임결과 메세지 변경', action.payload);
      state.gameResultMsg = action.payload;
    },
    bjConnectRequestStart(state, action: Action<string>) {
      state.loadingMsg = 'BJCONNECT';
    },
    bjConnectRequestEnd(state) {
      state.loadingMsg = '';
    },
  },
});

export const algoActions = algoSlice.actions;

export default algoSlice.reducer;
