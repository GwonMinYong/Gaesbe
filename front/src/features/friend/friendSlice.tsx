import { createSlice } from '@reduxjs/toolkit';

import { Action, FriendsInterface } from '../../models/friend';

interface FriendStateInterface {
  friends: FriendsInterface | null;
  isLoading: boolean;
  modal: string | null;
  secondModal: boolean;
  isSuccess: boolean;
  needReload: boolean;
  isInvite: boolean;
  friendId: number | null;
  chatFriend: number | null;
  invitedGameInfo: any;
  alarmList: any;
  waitFriendList: any;
  isChatOpen: boolean;
  chatList: any;
  checkedChatList: any;
  uncheckedChatList: any;
  sendContent: any;
  errorMsg: string | null;
  alarm: boolean;
}

const initialState: FriendStateInterface = {
  friends: null,
  isLoading: false,
  modal: null,
  secondModal: false,
  isSuccess: false,
  needReload: false,
  isInvite: false,
  friendId: null,
  chatFriend: null,
  invitedGameInfo: null,
  alarmList: [],
  waitFriendList: [],
  isChatOpen: false,
  chatList: null,
  checkedChatList: null,
  uncheckedChatList: null,
  sendContent: null,
  errorMsg: null,
  alarm: false,
};

const friendSlice = createSlice({
  name: 'friend',
  initialState,
  reducers: {
    setNeedReload(state, action: Action<boolean>) {
      state.needReload = action.payload;
    },
    setIsSuccess(state, action: Action<boolean>) {
      state.isSuccess = action.payload;
    },
    handleModal(state, action) {
      // state.modal = !state.modal;
      state.modal = action.payload;
    },
    handleSecondModal(state) {
      state.secondModal = !state.secondModal;
    },
    setFriends(state, action: Action<FriendsInterface>) {
      state.friends = action.payload;
    },
    requestFriendStart(state, action: Action<string>) {
      state.isLoading = true;
    },
    requestFriendFinish(state) {
      state.isLoading = false;
    },
    // 게임에 친구 초대
    openInvite(state) {
      state.isInvite = true;
    },
    closeInvite(state) {
      state.isInvite = false;
    },
    inviteFriend(state, action) {
      state.friendId = action.payload;
    },
    resetFriend(state) {
      state.friendId = null;
    },
    invitedGame(state, action) {
      state.invitedGameInfo = action.payload;
    },
    // 채팅 관련
    fetchAlarmList(state, action) {
      // console.log(action);
    },
    fetchWaitFriend(state, action) {
      // console.log(action);
    },
    openChatRoom(state, action) {
      state.chatFriend = action.payload;
      state.isChatOpen = true;
    },
    closeChatRoom(state) {
      state.isChatOpen = false;
    },
    // 채팅 목록 불러오기
    fetchChatStart(state) {},
    fetchChatSuccess(state, action) {
      state.chatList = action.payload.chatList;
      const wholeChatList = action.payload.chatList;
      const idList = Object.keys(wholeChatList);
      const unchecked = idList.map((idx: any) => {
        return wholeChatList[idx].filter((chat: any) => {
          return chat.checked === false;
        });
      });
      const checked = idList.map((idx: any) => {
        return wholeChatList[idx].filter((chat: any) => {
          return chat.checked === true;
        });
      });

      let checkedObj: any = {};
      let uncheckedObj: any = {};
      for (let i = 0; i < unchecked.length; i++) {
        checkedObj[idList[i]] = checked[i];
        uncheckedObj[idList[i]] = unchecked[i];
      }
      state.uncheckedChatList = uncheckedObj;
      state.checkedChatList = checkedObj;
    },
    fetchChatError(state, action) {
      // console.log(action.payload);
    },
    // 채팅 보내기
    sendChat(state, action) {
      state.sendContent = action.payload;
    },
    resetChat(state) {
      state.sendContent = '';
    },
    // 채팅 받기
    recieveChat(state, action) {
      const tmp = [action.payload.chatItem];
      let newArr;
      let newArr2;
      if (state.uncheckedChatList[action.payload.id]) {
        newArr = tmp.concat(state.uncheckedChatList[action.payload.id]);
      } else {
        newArr = tmp;
      }
      if (state.chatList[action.payload.id]) {
        newArr2 = tmp.concat(state.chatList[action.payload.id]);
      } else {
        newArr2 = tmp;
      }
      if (!state.isChatOpen) {
        state.uncheckedChatList[action.payload.id] = newArr;
      }
      state.chatList[action.payload.id] = newArr2;
    },
    // 채팅 읽었다는 신호 보내기
    postChatStart(state, action) {},
    postChatSuccess(state, action) {
      state.uncheckedChatList[action.payload] = [];
    },
    postChatError(state, action) {},
    // 친구 삭제시 채팅 삭제
    resetChatList(state, action) {
      const { friendId, myId } = action.payload;
      state.chatList[friendId] = {};
    },
    // 에러메세지 저장
    setErrorMsg(state, action) {
      state.errorMsg = action.payload;
    },
    setAlarm(state, action) {
      state.alarm = action.payload;
    },
  },
});

export const friendActions = friendSlice.actions;

export default friendSlice.reducer;
