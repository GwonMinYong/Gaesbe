import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import Swal from 'sweetalert2';

import { algoActions } from '../algorithmSlice';
import { bojUserIdRequest } from '../../../api/algoApi';
import { usePrompt } from '../../../utils/block';
import {
  InGameUsersInterface,
  ProblemInterface,
  RankingUserInfo,
} from '../../../models/algo';

import AlgoBeforeStart from '../components/AlgoBeforeStart';
import AlgoAfterStart from '../components/AlgoAfterStart';
import styled from 'styled-components';

interface CustomWebSocket extends WebSocket {
  _transport?: any;
}

const Wrapper = styled.div`
  height: 100%;
  width: 90%;
  display: flex;
  flex-direction: column;
  justify-items: center;
  margin: auto;
  .title {
    text-align: center;
    height: 18%;
    img {
      width: 60%;
    }
  }
  .content {
    height: 100%;
  }
`;

function AlgoInBattle() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { InGameInfo } = useSelector((state: any) => state.algo);
  const { userInfo } = useSelector((state: any) => state.auth);

  const [inGameUsers, setInGameUsers] = useState<InGameUsersInterface[]>([]);
  const [progress, setProgress] = useState<string>('before');
  const [afterProgress, setAfterProgress] = useState<string>('select');
  const [problemList, setProblemList] = useState<ProblemInterface[]>([]);
  const [problemIndex, setProblemIndex] = useState<number>(0);
  const [ranking, setRanking] = useState<RankingUserInfo[]>([]);
  const [myRank, setMyRank] = useState<number>(5);
  const [timeOut, setTimeOut] = useState<boolean>(false);
  const [msgAlert, setMsgAlert] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    for (let i = 0; i < 4; i++) {
      if (ranking[i]) {
        if (ranking[i].userId === userInfo.id) {
          setMyRank(i + 1);
          break;
        }
      }
    }
  }, [ranking]);

  useEffect(() => {
    if (msgAlert) {
      Swal.fire({
        toast: true,
        position: 'top',
        timer: 1000,
        showConfirmButton: false,
        text: msg,
      });
    }
  }, [msg]);

  const client = useRef<any>(null);
  // 최초 입장시 소켓 뚫고, 백준id보내기
  useEffect(() => {
    if (InGameInfo === null) {
      navigate('/game/algo');
    } else {
      const socket: CustomWebSocket = new SockJS(
        'https://k7e104.p.ssafy.io:8081/api/ws',
      );
      client.current = Stomp.over(socket);
      // 개발 버전에서만 콘솔 뜨게 하기
      if (process.env.NODE_ENV !== 'development') {
        client.current.debug = function () {};
      }
      // 입장할때 소켓 뚫기
      client.current.connect({ userId: userInfo.id }, (frame: any) => {
        // 입장, 퇴장 관련 메세지 받을 위치
        client.current.subscribe(
          `/algo/room/${InGameInfo.roomCode}`,
          (res: any) => {
            if (progress === 'before') {
              setMsg(JSON.parse(res.body).msg);
              setMsgAlert(true);
              setInGameUsers(JSON.parse(res.body).users);
              const newGameInfo = JSON.parse(JSON.stringify(InGameInfo));
              newGameInfo.master = JSON.parse(res.body).master;
              dispatch(algoActions.enterAlgoRoomSuccess(newGameInfo));
            }
          },
        );

        // 문제 선택 시작 메세지 받을 위치
        client.current.subscribe(
          `/algo/start/pass/${InGameInfo.roomCode}`,
          (res: any) => {
            if (JSON.parse(res.body).type === 'START') {
              dispatch(algoActions.setLoadingMsg('START'));
            } else {
              setProblemList(JSON.parse(res.body).problems);
              if (JSON.parse(res.body).master == userInfo.id) {
                client.current.send(
                  `/api/algo/timer`,
                  {},
                  JSON.stringify({ roomCode: InGameInfo.roomCode }),
                );
              }
              dispatch(algoActions.setLoadingMsg(''));
              setProgress('after');
            }
          },
        );

        // 문제 패스 메세지 받기
        client.current.subscribe(
          `/algo/pass/${InGameInfo.roomCode}`,
          (res: any) => {
            if (JSON.parse(res.body).no) {
              setProblemIndex(JSON.parse(res.body).no);
            }
            if (JSON.parse(res.body).master == userInfo.id) {
              client.current.send(
                `/api/algo/timer`,
                {},
                JSON.stringify({ roomCode: InGameInfo.roomCode }),
              );
            }
          },
        );

        // 문제 시작 메세지 받기
        client.current.subscribe(
          `/algo/problem/${InGameInfo.roomCode}`,
          (res: any) => {
            if (JSON.parse(res.body).type === 'FINISH') {
              setTimeOut(true);
            } else {
              setProblemIndex(JSON.parse(res.body).no);
              setAfterProgress('solve');
            }
          },
        );

        // 랭킹 메세지 받기
        client.current.subscribe(
          `/algo/rank/${InGameInfo.roomCode}`,
          (res: any) => {
            const rankingInfo = JSON.parse(res.body);
            setRanking(rankingInfo.ranking);
          },
        );

        // 뚫었으니 들어갔다고 알리기
        client.current.send(
          '/api/algo',
          {},
          JSON.stringify({
            type: 'ENTER',
            sessionId: socket._transport.url.slice(-18, -10),
            userId: userInfo.id,
            nickname: userInfo.nickname,
            roomCode: InGameInfo.roomCode,
          }),
        );
      });
      // 백준 크롤링 하세요, 방번호 백준아이디
      bojUserIdRequest(InGameInfo.roomCode, userInfo.bjId);
      return () => {
        leaveRoom();
      };
    }
  }, []);

  // 뒤로가기 막는 useEffect
  useEffect(() => {
    const preventGoBack = () => {
      // change start
      window.history.pushState(null, '', window.location.href);
      // change end
      Swal.fire({
        icon: 'error',
        text: '게임중에는 나갈 수 없습니다',
      });
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', preventGoBack);
    return () => window.removeEventListener('popstate', preventGoBack);
  }, []);
  // 뒤로가기 막는 useEffect
  // 새로고침, 창닫기, 사이드바 클릭 등으로 페이지 벗어날때 confirm 띄우기
  usePrompt(
    '게임중에 나가면 등수가 기록되지 않습니다',
    progress === 'after' && !timeOut && myRank === 5,
  );
  // 새로고침, 창닫기, 사이드바 클릭 등으로 페이지 벗어날때 confirm 띄우기

  // 방 떠나기
  const leaveRoom = async () => {
    // 소켓 끊고
    await client.current.disconnect(() => {});
    // 스토어의 방 정보 비우기
    await dispatch(algoActions.exitAlgoRoom());
  };
  // 방 떠나기 끝

  const handleLeaveRoom = () => {
    navigate('/game/algo');
  };

  // 내가 방장이다 게임 시작할거다
  const startGame = () => {
    const userBjIds = inGameUsers.map((user: InGameUsersInterface) => {
      return user.bjId;
    });
    client.current.send(
      `/api/algo/start/pass`,
      {},
      JSON.stringify({
        tier: InGameInfo.tier,
        roomCode: InGameInfo.roomCode,
        users: userBjIds,
      }),
    );
  };

  return (
    <>
      {InGameInfo && (
        <Wrapper>
          <h1 className="title">
            <img src={`/img/gametitle/gametitle4.png`}></img>
          </h1>
          <div className="content">
            {progress === 'before' && (
              <AlgoBeforeStart
                client={client}
                handleLeaveRoom={handleLeaveRoom}
                startGame={startGame}
                inGameUsers={inGameUsers}
              />
            )}
            {progress === 'after' && (
              <AlgoAfterStart
                ranking={ranking}
                handleLeaveRoom={handleLeaveRoom}
                inGameUsers={inGameUsers}
                progress={afterProgress}
                client={client}
                problemList={problemList}
                problemIndex={problemIndex}
                myRank={myRank}
                timeOut={timeOut}
              />
            )}
          </div>
        </Wrapper>
      )}
    </>
  );
}
export default AlgoInBattle;
