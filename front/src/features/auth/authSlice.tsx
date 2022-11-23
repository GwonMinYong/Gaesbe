import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, UserInfo } from '../../models/user';

const initialState: User = {
  isLoading: false,
  isDuplicate: false,
  userInfo: null,
  userAbility: null,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setError(state) {
      state.error = null;
    },
    setIsDuplicate(state) {
      state.isDuplicate = null;
    },
    // 유저 정보 불러오기
    fetchUserInfoStart(state) {},
    fetchUserInfoSuccess(state, action) {
      state.userInfo = action.payload;
    },
    fetchUserInfoError(state, action) {
      state.error = action.payload.status;
    },
    // 유저 역량 불러오기
    fetchAbilityStart(state) {},
    fetchAbilitySuccess(state, action) {
      state.userAbility = action.payload;
      // console.log(state.userAbility);
    },
    fetchAbilityError(state, action) {},
    // 유저 닉네임, 프로필 생성
    createUserInfoStart(state, action) {},
    createUserInfoSuccess(state, action) {
      state.userInfo = action.payload;
    },
    createUserInfoError(state, action) {
      state.error = action.payload.status;
    },
    // 중복 체크
    checkNicknameStart(state, action) {},
    checkNicknameSuccess(state, action) {
      state.isDuplicate = action.payload;
    },
    checkNicknameError(state, action) {},
    // 유저 삭제
    deleteUserInfoStart(state) {},
    deleteUserInfoSuccess(state, action) {
      localStorage.removeItem('accessToken');
      state.userAbility = null;
      state.userInfo = null;
    },
    deleteUserInfoError(state, action) {
      state.error = action.payload.status;
    },
    logout(state) {
      localStorage.removeItem('accessToken');
      state.userInfo = null;
      state.userAbility = null;
    },
  },
});

export const authActions = authSlice.actions;

export default authSlice.reducer;
