import {
  take,
  takeEvery,
  takeLatest,
  put,
  all,
  delay,
  fork,
  call,
} from 'redux-saga/effects';
import { authActions } from './authSlice';
import {
  fetchUserInfoApi,
  createUserInfoApi,
  checkNicknameApi,
  deleteUserInfoApi,
  fetchAbilityApi,
} from '../../api/authApi';
import { AxiosResponse } from 'axios';

// 유저 정보 받아오기
function* fetchUserInfoSaga(action: any) {
  const { fetchUserInfoSuccess, fetchUserInfoError } = authActions;
  try {
    const response: AxiosResponse = yield call(fetchUserInfoApi);
    yield put(fetchUserInfoSuccess(response.data));
  } catch (e: any) {
    yield put(fetchUserInfoError(e.response));
  }
}

function* onFetchUserInfo() {
  const { fetchUserInfoStart } = authActions;
  yield takeLatest(fetchUserInfoStart, fetchUserInfoSaga);
}

// 유저 역량 정보 받아오기
function* fetchAbilitySaga(action: any) {
  const { fetchAbilitySuccess, fetchAbilityError } = authActions;
  try {
    const response: AxiosResponse = yield call(fetchAbilityApi);
    yield put(fetchAbilitySuccess(response.data));
  } catch (e: any) {
    yield put(fetchAbilityError(e.response));
  }
}

function* onFetchAbility() {
  const { fetchAbilityStart } = authActions;
  yield takeLatest(fetchAbilityStart, fetchAbilitySaga);
}

// 유저 초기 정보 설정
function* createUserInfoSaga(action: any) {
  const { createUserInfoSuccess, createUserInfoError } = authActions;
  try {
    const response: AxiosResponse = yield call(
      createUserInfoApi,
      action.payload,
    );
    yield put(createUserInfoSuccess(response.data));
  } catch (e: any) {
    yield put(createUserInfoError(e.response));
  }
}

function* onCreateUserInfo() {
  const { createUserInfoStart } = authActions;
  yield takeLatest(createUserInfoStart, createUserInfoSaga);
}

// 닉네임 중복 체크
function* checkNicknameSaga(action: any) {
  const { checkNicknameSuccess, checkNicknameError } = authActions;
  try {
    const response: AxiosResponse = yield call(
      checkNicknameApi,
      action.payload,
    );
    yield put(checkNicknameSuccess(response.data));
  } catch (e: any) {
    yield put(checkNicknameError(e.response));
  }
}

function* onCheckNickname() {
  const { checkNicknameStart } = authActions;
  yield takeLatest(checkNicknameStart, checkNicknameSaga);
}

function* deleteUserInfo() {
  const { deleteUserInfoStart } = authActions;
  yield takeLatest(deleteUserInfoStart, deleteUserInfoSaga);
}
function* deleteUserInfoSaga(action: any) {
  const { deleteUserInfoSuccess, deleteUserInfoError } = authActions;
  try {
    const response: AxiosResponse = yield call(deleteUserInfoApi);
    yield put(deleteUserInfoSuccess(response.data));
  } catch (error: any) {
    yield put(deleteUserInfoError(error.response));
    // console.log(error.response);
    // console.log(error.response.status);
  }
}

export const authSagas = [
  fork(onFetchUserInfo),
  fork(onCreateUserInfo),
  fork(onCheckNickname),
  fork(deleteUserInfo),
  fork(onFetchAbility),
];
