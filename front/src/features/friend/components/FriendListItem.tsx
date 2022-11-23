import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import Swal from 'sweetalert2';

import { deleteFriend } from '../../../api/friendApi';
import { friendActions } from '../friendSlice';

const FriendListItemBlock = styled.div`
  width: 100%;
  .friendBoxWrapper {
    height: 4.5rem;
    width: 100%;
    margin-top: 0.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;

    padding-bottom: 0.2rem;

    :hover .speechBubbleWrapper {
      display: block;
    }
  }
  .invite {
    /* padding-top: 1rem; */
  }
  .friendBox {
    position: relative;
    box-sizing: border-box;
    border: 3px solid #8d84f3;
    border-radius: 10px;
    height: 100%;
    width: 85%;
    margin-top: 0.5rem;
    display: flex;
    justify-content: space-around;
    align-items: center;

    .linetb {
      border-bottom: 1px solid black;
    }

    .speechBubbleWrapper {
      position: absolute;
      top: calc(100% + 6px);
      display: none;
      z-index: 1;
    }
    .speechBubble {
      position: relative;
      background: #ffc02d;
      border-radius: 0.4em;
      width: 9rem;
      /* height: 6rem; */
      display: flex;
      flex-direction: column;
      /* justify-content: space-evenly; */
      .styledHr {
        margin: 0 auto;
        width: 98%;
        height: 1px;
        background-color: #000000;
        border: 0px;
      }
      .bubbleText {
        text-align: center;
        color: #000000;
        font-weight: 550;
        padding: 0.4rem 0;
      }
      .bubbleText:hover {
        background-color: #e6a713;
      }
      .bubbleText.top:hover {
        border-top-left-radius: 0.4rem;
        border-top-right-radius: 0.4rem;
      }
      .bubbleText.bottom:hover {
        border-bottom-right-radius: 0.4rem;
        border-bottom-left-radius: 0.4rem;
      }

      .textRed {
        color: #ff0000;
      }
    }

    .speechBubble:after {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      width: 0;
      height: 0;
      border: 20px solid transparent;
      border-bottom-color: #ffc02d;
      border-top: 0;
      margin-left: -20px;
      margin-top: -17px;
      z-index: -1;
    }
    .profileNickname {
      width: 65%;
      height: 100%;
      display: flex;
      align-items: center;
      .profileCircle {
        position: relative;
        display: flex;
        justify-content: center;
        border-radius: 50%;
        height: 2rem;
        width: 2rem;
        background-color: #ffffff;
        .profile {
          height: 90%;
          width: 55%;
        }
        .online {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          background-color: aquamarine;
        }
        .offline {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          background-color: #8d84f3;
        }
      }
    }

    .nicknameBox {
      margin-left: 0.5rem;
      .level {
        font-size: 0.8rem;
      }
      .nickname {
        @import url('https://fonts.googleapis.com/css2?family=Iceberg&display=swap');
        /* font-family: 'Iceberg', cursive; */
        font-size: 1.3rem;
        margin-top: 0.3rem;
        /* font-weight: 600; */
      }
    }
    .messageImg {
      height: 60%;
    }
  }
  .inviteBtn {
    padding: 2% 4%;
    border: none;
    background-color: none;
    border-radius: 15px;
    :hover {
      background-color: #fcb615;
      color: white;
      cursor: url('/img/cursor/hover_cursor.png'), auto;
    }
  }
`;

function FriendListItem({ friend, type, category, chatCnt }: any) {
  const dispatch = useDispatch();
  const { uncheckedChatList } = useSelector((state: any) => state.friend);
  const { userInfo } = useSelector((state: any) => state.auth);
  const [uncheckedMsgIds, setUncheckedMsgIds] = useState<any>(null);

  useEffect(() => {
    if (uncheckedChatList && uncheckedChatList.hasOwnProperty(friend.id)) {
      const tmp = uncheckedChatList[friend.id].map((chatList: any) => {
        return chatList.id;
      });
      setUncheckedMsgIds(tmp);
    }
  }, [uncheckedChatList]);

  const handleDeleteFriend = () => {
    Swal.fire({
      title: '정말로?',
      text: '정말 삭제하시겠습니까?',
      icon: 'warning',
      showCancelButton: true,
      cancelButtonText: '아니오',
      focusCancel: true,
      // confirmButtonColor: '#3085d6',
      // cancelButtonColor: '#d33',
      confirmButtonText: '네!',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await deleteFriend(friend.id);
          if (res.status === 200) {
            dispatch(friendActions.setNeedReload(true));
            dispatch(
              friendActions.resetChatList({
                friendId: friend.id,
                myId: userInfo.id,
              }),
            );
          }
        } catch (error) {
          // console.log(error);
        }
      }
    });
  };

  const invite = () => {
    dispatch(friendActions.inviteFriend(friend.id));
    Swal.fire({
      icon: 'success',
      text: '초대하였습니다!',
    });
  };

  const openChat = () => {
    dispatch(friendActions.openChatRoom(friend));
    if (
      uncheckedChatList.hasOwnProperty(friend.id) &&
      uncheckedChatList[friend.id].length !== 0
    ) {
      dispatch(
        friendActions.postChatStart({
          msgIds: uncheckedMsgIds,
          friendId: friend.id,
        }),
      );
    }
  };
  // console.log(friend, '친구ㅜㅜㅜㅜㅜㅜㅜㅜㅜㅜㅜㅜㅜㅜㅜㅜㅜㅜ');
  return (
    <FriendListItemBlock>
      <div
        className={
          'friendBoxWrapper' + (category === 'invite' ? ' invite' : '')
        }
      >
        <div className="friendBox">
          {category === 'noInvite' && (
            <div className="speechBubbleWrapper">
              <div className="speechBubble">
                <div className="bubbleText linetb top" onClick={openChat}>
                  채팅방
                </div>
                {/* <hr className="styledHr" /> */}
                <div
                  className="bubbleText textRed bottom"
                  onClick={handleDeleteFriend}
                >
                  친구 삭제
                </div>
              </div>
            </div>
          )}
          <div className="profileNickname">
            <div className="profileCircle">
              <img
                className="profile"
                src={`${process.env.REACT_APP_S3_URL}/profile/${friend.profileChar}_normal.gif`}
              />
              {type === 'online' && <div className="online" />}
              {type === 'offline' && <div className="offline" />}
            </div>
            <div className="nicknameBox">
              {/* <div className="level">LV1. 대기업</div> */}
              <div className="level">
                {friend.officeLv === 1 ? (
                  <div>Lv.{friend.officeLv} 응애취준생</div>
                ) : friend.officeLv === 2 ? (
                  <div>Lv.{friend.officeLv} 만렙취준생</div>
                ) : friend.officeLv === 3 ? (
                  <div>Lv.{friend.officeLv} 응애개발자</div>
                ) : friend.officeLv === 4 ? (
                  <div>Lv.{friend.officeLv} 척척학사개발자</div>
                ) : friend.officeLv === 5 ? (
                  <div>Lv.{friend.officeLv} 척척석사개발자</div>
                ) : friend.officeLv === 6 ? (
                  <div>Lv.{friend.officeLv} 척척박사개발자</div>
                ) : friend.officeLv === 7 ? (
                  <div>Lv.{friend.officeLv} 만렙개발자</div>
                ) : (
                  <div>Lv.{friend.officeLv} 킹갓삼성개발자</div>
                )}
              </div>
              <div className="nickname">{friend.nickname}</div>
            </div>
          </div>
          {category === 'noInvite' && chatCnt !== 0 && <div>{chatCnt}</div>}
          {category === 'noInvite' && chatCnt === 0 && <div></div>}
          {category === 'invite' && !friend.playGame && (
            <button className="inviteBtn" onClick={invite}>
              초대하기
            </button>
          )}
          {category === 'invite' && friend.playGame && <div>게임중</div>}
        </div>
      </div>
    </FriendListItemBlock>
  );
}
export default FriendListItem;
