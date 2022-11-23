import {
  all,
  takeEvery,
  takeLatest,
  put,
  call,
  take,
  fork,
  delay,
} from 'redux-saga/effects';
import { AxiosResponse } from 'axios';
import {
  Action,
  AlgoRoomInterface,
  RecordSendInterface,
} from '../../models/algo';
import { algoActions } from './algorithmSlice';
import {
  confirmAlgoRoom,
  makeAlgoRoom,
  checkMyAnswerRequest,
  roomMakePlaying,
  endGame,
  BjConnectCheck,
} from '../../api/algoApi';
import { authActions } from '../auth/authSlice';
import Swal from 'sweetalert2';

function* enterAlgoRoomSaga(action: Action<AlgoRoomInterface>) {
  try {
    const ok: AxiosResponse = yield call(
      confirmAlgoRoom,
      action.payload.roomCode,
    );
    if (ok.data.result === true) {
      yield put(algoActions.enterAlgoRoomSuccess(action.payload));
    } else {
      Swal.fire({
        icon: 'warning',
        text: ok.data.msg,
      });
      yield put(algoActions.setNeedReload(true));
    }
  } catch (error) {
    Swal.fire({
      icon: 'warning',
      text: '방이 사라진 것 같아요.\n목록을 새로고침 할게요',
    });
    yield put(algoActions.setNeedReload(true));
  }
}

function* creatAlgoRoomSaga(action: Action<AlgoRoomInterface>) {
  try {
    const res1: AxiosResponse = yield call(roomMakePlaying);
    if (res1.data) {
      const res: AxiosResponse = yield call(makeAlgoRoom, action.payload);
      if (res.status === 200) {
        yield put(algoActions.enterAlgoRoom(res.data));
      }
    } else {
      Swal.fire({
        icon: 'warning',
        text: '이미 다른 게임을 진행중인 것 아닌가요?',
      });
    }
  } catch (error) {
    // console.log(error);
  }
}

function* checkMyAnswerRequestSaga(
  action: Action<{
    roomCode: string;
    problemId: number;
    userBjId: string;
    lanId: number;
  }>,
) {
  try {
    const res: AxiosResponse = yield call(checkMyAnswerRequest, action.payload);
    if (res.status === 200) {
      if (res.data.result === 1) {
        // console.log('정답체크 함', res.data.msg);
        yield put(algoActions.solveSuccess(true));
        yield Swal.fire({ icon: 'success', text: res.data.msg });
        yield put(algoActions.loadingEnd());
        yield put(algoActions.setLoadingMsg(''));
      } else {
        yield Swal.fire({ icon: 'warning', text: res.data.msg });
      }
    }
  } catch (error) {}
}

function* sendMyRankSaga(action: Action<RecordSendInterface>) {
  try {
    const res: AxiosResponse = yield call(endGame, action.payload);
    if (res.status === 200) {
      yield put(algoActions.setGameResult(res.data));
      yield put(algoActions.loadingEnd());
    }
  } catch (error) {
    // console.log(error);
  }
}

function* bjConnectRequestSaga(action: Action<string>) {
  try {
    const res: AxiosResponse = yield call(BjConnectCheck, action.payload);
    if (res.status === 200) {
      if (res.data) {
        Swal.fire({
          icon: 'success',
          text: '연동되었습니다!',
        });
        yield put(authActions.fetchUserInfoStart());
      } else {
        Swal.fire({
          icon: 'warning',
          text: '연동에 실패했습니다 다시 시도해 주세요',
        });
      }
    }
  } catch (error) {
    yield Swal.fire({
      icon: 'warning',
      text: '연동하는데 문제가 생겼습니다 잠시 후 다시 시도해 주세요',
    });
  } finally {
    yield put(algoActions.bjConnectRequestEnd());
  }
}

function* algoSaga() {
  yield takeLatest(algoActions.enterAlgoRoom, enterAlgoRoomSaga);
  yield takeLatest(algoActions.creatAlgoRoom, creatAlgoRoomSaga);
  yield takeLatest(
    algoActions.checkMyAnswerRequestStart,
    checkMyAnswerRequestSaga,
  );
  yield takeLatest(algoActions.sendMyRank, sendMyRankSaga);
  yield takeLatest(algoActions.bjConnectRequestStart, bjConnectRequestSaga);
}

export const algoSagas = [fork(algoSaga)];
