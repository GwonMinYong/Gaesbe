import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import BeforeSolveUsers from './BeforeSolveUsers';
import LoadingSpinner from './LoadingSpinner';
import FriendModal from '../../friend/components/FriendModal';
import { friendActions } from '../../friend/friendSlice';

import '../../../components/Common/retroBtn.css';
import styled from 'styled-components';

const Wrapper = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  text-align: center;

  .btn-top {
    text-align: left;
    height: 3%;
    margin-bottom: 4%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .backBtn {
      margin: auto 0;
      height: 100%;
    }

    .inviteBtn {
      width: 50%;
      :hover {
        transform: scale(1.1);

        cursor: url('/img/cursor/hover_cursor.png'), auto;
      }
    }

    .inviteBtnBox {
      position: relative;
      font-size: 1rem;
      right: -80px;
      top: 15px;

      :hover .inviteBtnToolTip {
        display: block;
      }
      .inviteBtnToolTip {
        display: none;
        position: absolute;
        bottom: 110%;
      }
    }
  }
  .user {
    height: 60%;
    background-image: url(/img/background/park.jpg);
    background-repeat: no-repeat;
    background-position: center;
    background-size: 100% 121%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    border: 1px solid #fff;
    position: relative;
  }
  .btn-bottom {
    height: 25%;
    display: flex;
    justify-items: center;
    a {
      margin: auto;
    }
  }
`;

function AlgoBeforeStart({
  client,
  handleLeaveRoom,
  startGame,
  inGameUsers,
}: any) {
  const dispatch = useDispatch();

  const { InGameInfo, loadingMsg } = useSelector((state: any) => state.algo);
  const { userInfo } = useSelector((state: any) => state.auth);
  const { modal } = useSelector((state: any) => state.friend);

  const handleModal = () => {
    dispatch(friendActions.openInvite());
    dispatch(friendActions.handleModal('invite'));
  };
  const closeModal = () => {
    dispatch(friendActions.closeInvite());
    dispatch(friendActions.handleModal(null));
  };

  const { friendId } = useSelector((state: any) => state.friend);
  useEffect(() => {
    // console.log(InGameInfo);
    if (friendId) {
      client.current.send(
        '/api/friend/invite',
        {},
        JSON.stringify({
          userId: friendId,
          fromUserNick: userInfo.nickname,
          gameType: 'algo',
          roomCode: JSON.stringify(InGameInfo),
        }),
      );
      dispatch(friendActions.inviteFriend(null));
    }
  }, [friendId]);
  return (
    <Wrapper>
      <div className="btn-top">
        <a
          onClick={handleLeaveRoom}
          className="backBtn eightbit-btn eightbit-btn--reset"
        >
          나가기
        </a>
        <div className="inviteBtnBox">
          <div className="inviteBtnToolTip">친구 초대</div>
          <img
            src="/img/cs/inviteBtn2.png"
            className="inviteBtn"
            onClick={handleModal}
          />
        </div>
      </div>
      {loadingMsg === 'START' && (
        <>
          <LoadingSpinner loadingMsg="곧 배틀이 시작됩니다" />
          <p className="loadingText">곧 배틀이 시작됩니다</p>
        </>
      )}
      <div className="user">
        <BeforeSolveUsers inGameUsers={inGameUsers} />
      </div>
      <div className="btn-bottom">
        {InGameInfo.master == userInfo.id && (
          <a onClick={startGame} className="eightbit-btn eightbit-btn--proceed">
            배틀 시작
          </a>
        )}
        {modal && <FriendModal handleModal={closeModal} type="invite" />}
        {InGameInfo.master != userInfo.id && (
          <a className="eightbit-btn eightbit-btn--disable">대기중</a>
        )}
      </div>
    </Wrapper>
  );
}
export default AlgoBeforeStart;
