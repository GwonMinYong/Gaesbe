import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import styled from 'styled-components';
import { usePrompt } from '../../../utils/block';
import FriendModal from '../../friend/components/FriendModal';
import { friendActions } from '../../friend/friendSlice';

interface CustomWebSocket extends WebSocket {
  _transport?: any;
}

const Container = styled.div`
  /* width: 82%; */
  background-color: #232323;
  color: #ffffff;
  font-family: 'NeoDunggeunmo';
  font-style: normal;
  .gameTitle {
    margin-top: 1rem;
    height: 10%;
    width: 20%;
  }
`;

const LoadingBlock = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  .loadingText {
    font-size: large;
  }
`;

const WaitingBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  .waitingroom {
    width: 100%;
    height: 100%;
  }
  .subtitle {
    font-size: 30px;
    font-weight: 400;
  }
  .waitingContent {
    display: flex;
    width: 100%;
    height: 100%;
  }
  .imgBox {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .waitingCharacters {
  }
`;

const IngameBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;

  --duration: 5;

  .progressContainer .progress {
    animation: roundtime calc(var(--duration) * 1s) linear forwards;
    transform-origin: left center;
  }

  @keyframes roundtime {
    to {
      transform: scaleX(0);
    }
  }

  .progress {
    background: orange;
    height: 100%;
    /* width: 100%; */
    text-align: right;
    font: bold 12px arial;
    border-right: 1px silver solid;
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    line-height: 30px;
    color: #444;
    /* -webkit-transition: width 5s linear; For Safari 3.1 to 6.0 */
    /* transition: width 5s linear; */
  }
  .progressContainer {
    width: 90%;
    margin: 0 auto;
    height: 30px;
    border: 1px silver solid;
    border-radius: 4px;
    background: white;
  }

  .problemBox {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .problem {
    box-sizing: border-box;
    width: 60%;
    height: 45%;
    background: #ffffff;
    border: 5px solid #000000;
    box-shadow: 5px 5px 0px 4px #000000, 4px 4px 0px 7px #ffffff;
    color: #000000;
    display: flex;
    flex-direction: column;
    align-items: center;
    /* justify-content: space-between; */
    .question {
      margin-top: 2rem;
      font-size: larger;
      font-weight: bold;
    }
  }
  .selectbuttons {
    display: flex;
    width: 60%;
    margin-top: 1rem;
    justify-content: space-between;
  }
  .selectbutton {
    cursor: pointer;
  }
  .rankBlock {
    margin-top: 1rem;
    display: flex;
  }
  .rankwrapper {
    margin-right: 1rem;
    .character {
      width: 30%;
      height: 30%;
    }
  }
  .character {
    width: 70%;
    height: 30%;
  }
`;

const CSFriendPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState<Boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isMaster, setIsMaster] = useState<Boolean>(false);
  const [isStart, setIsStart] = useState<Boolean>(false);
  const [roomCode, setRoomCode] = useState<string>('');
  const [players, setPlayers] = useState<any>(null);
  const [problem, setProblem] = useState<any>(null);
  const [isSolved, setIsSolved] = useState<Boolean | null>(null);
  const [isSubmit, setIsSubmit] = useState<Boolean>(false);
  const [ranking, setRanking] = useState<any>(null);
  const [cntPerNum, setCntPerNum] = useState<any>(null);
  const [solveOrder, setSolveOrder] = useState<any>(null);
  const [answer, setAnswer] = useState<number | null>(null);
  const [isNext, setIsNext] = useState<Boolean>(false);
  const [isEnd, setIsEnd] = useState<any>(null);
  const [rankByPlayer, setRankByPlayer] = useState<any>(null);
  const [countArr, setCountArr] = useState<any>(null);
  const { userInfo } = useSelector((state: any) => state.auth);
  const { modal } = useSelector((state: any) => state.friend);
  const { friendId } = useSelector((state: any) => state.friend);

  const answerButton = [1, 2, 3, 4];

  const { shareCode } = location.state;

  const initialTime = useRef<number>(3);
  const interval = useRef<any>(null);
  const [sec, setSec] = useState(3);
  let roomcode: string;
  let playerList: Array<any>;

  const characterLocationArr: any = [
    {
      position: 'absolute',
      width: '15%',
      height: '15%',
      left: '14%',
      top: '56%',
    },
    {
      position: 'absolute',
      width: '15%',
      height: '15%',
      left: '18%',
      top: '52%',
    },
    {
      position: 'absolute',
      width: '15%',
      height: '15%',
      left: '22%',
      top: '48%',
    },
    {
      position: 'absolute',
      width: '15%',
      height: '15%',
      left: '14%',
      top: '56%',
    },
    {
      position: 'absolute',
      width: '15%',
      height: '15%',
      left: '14%',
      top: '56%',
    },
    {
      position: 'absolute',
      width: '15%',
      height: '15%',
      left: '14%',
      top: '56%',
    },
    {
      position: 'absolute',
      width: '15%',
      height: '15%',
      left: '14%',
      top: '56%',
    },
    {
      position: 'absolute',
      width: '15%',
      height: '15%',
      left: '14%',
      top: '56%',
    },
    {
      position: 'absolute',
      width: '15%',
      height: '15%',
      left: '14%',
      top: '56%',
    },
    {
      position: 'absolute',
      width: '15%',
      height: '15%',
      left: '14%',
      top: '56%',
    },
  ];
  const characterCountArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  const client = useRef<any>(null);
  // client.debug = () => {};

  // 게임 시작 전 자동 시작 타이머
  useEffect(() => {
    if (isReady) {
      interval.current = setInterval(() => {
        setSec(initialTime.current % 60);
        initialTime.current -= 1;
      }, 1000);
      return () => clearInterval(interval.current);
    }
  }, [isReady]);

  useEffect(() => {
    if (initialTime.current < 0) {
      clearInterval(interval.current);
    }
  }, [sec]);

  // 소켓 연결 후 구독 및 요청
  useEffect(() => {
    if (userInfo) {
      const socket: CustomWebSocket = new SockJS(
        'https://k7e104.p.ssafy.io:8081/api/ws',
      );
      client.current = Stomp.over(socket);
      client.current.connect({}, (frame: any) => {
        // 내 개인 정보 구독
        client.current.subscribe(`/cs/${userInfo.id}`, (res: any) => {
          var data = JSON.parse(res.body);
          if (data.hasOwnProperty('room')) {
            setRoomCode(data.room);
            roomcode = data.room;
          } else if (data.hasOwnProperty('msg')) {
            if (data.msg === 'submit') {
              setIsSubmit(true);
            }
          } else if (data.hasOwnProperty('isSolved')) {
            setIsSolved(data.isSolved);
            setIsSubmit(false);
            setTimeout(() => {
              setIsNext(true);
            }, 7000);
          } else if (data.hasOwnProperty('master')) {
            setIsMaster(true);
          }
        });

        // 방에 들어가기
        const enterRoom = () => {
          client.current.send(
            '/api/cs',
            {},
            JSON.stringify({
              type: 'ENTER',
              sessionId: socket._transport.url.slice(-18, -10),
              userId: userInfo.id,
              roomType: 'FRIEND',
              roomCode: shareCode,
            }),
          );
        };
        enterRoom();
      });
    }
  }, [userInfo]);

  useEffect(() => {
    if (roomCode) {
      const socket: CustomWebSocket = new SockJS(
        'https://k7e104.p.ssafy.io:8081/api/ws',
      );
      const client2 = Stomp.over(socket);
      // 룸코드를 받으면 그 방에 대한 구독을 함
      client2.connect({}, (frame) => {
        client2.subscribe('/cs/room/' + roomCode, (res) => {
          var data1 = JSON.parse(res.body);
          if (data1.hasOwnProperty('msg')) {
            if (data1.msg === 'end') {
              setIsEnd(true);
              setRankByPlayer(data1.rankByPlayer);
            } else if (data1.msg === 'ready') {
              setIsReady(true);
            } else {
              setIsReady(false);
              setIsStart(true);
            }
          } else if (data1.hasOwnProperty('currentProblem')) {
            setIsSolved(null);
            setProblem(data1.currentProblem);
            setIsNext(false);
          } else if (data1.hasOwnProperty('ranking')) {
            setRanking(data1.ranking);
            setCntPerNum(data1.cntPerNum);
            setSolveOrder(data1.solveOrder);
            setAnswer(data1.answer);
          } else {
            if (!playerList) {
              for (let i = 0; i < data1.length; i++) {
                characterCountArr[i] = data1[i].id;
              }
              setCountArr(characterCountArr);
            } else if (playerList.length > data1.length) {
              const temp = playerList.filter((player: any) => {
                return !data1.some(
                  (dataItem: any) => player.id === dataItem.id,
                );
              });
              characterCountArr[characterCountArr.indexOf(temp[0].id)] = 0;
              setCountArr(characterCountArr);
            } else if (playerList.length < data1.length) {
              const temp = data1.filter((dataItem: any) => {
                return !playerList.some(
                  (player: any) => dataItem.id === player.id,
                );
              });
              characterCountArr[characterCountArr.indexOf(0)] = temp[0].id;
              setCountArr(characterCountArr);
            }
            setPlayers(data1);
            playerList = data1;
          }
        });
        client2.send(
          '/api/cs/memberInfo',
          {},
          JSON.stringify({
            roomCode: roomCode,
          }),
        );
      });
    }
  }, [roomCode]);

  useEffect(() => {
    return () => {
      client.current.disconnect(() => {});
    };
  }, []);
  // 로딩 & 끝 제어
  useEffect(() => {
    if (players) {
      setIsLoading(false);
    }
    if (isEnd && rankByPlayer) {
      console.log('끝');
      navigate('/game/CS/result', {
        state: { ranking: ranking, rankByPlayer: rankByPlayer },
      });
    }
  }, [players, isEnd, rankByPlayer]);

  const onClickStart = () => {
    client.current.send(
      '/api/cs/start',
      {},
      JSON.stringify({
        roomCode: roomCode,
      }),
    );
  };

  const handleAnswerSend = (e: any, number: any) => {
    client.current.send(
      '/api/cs/submit',
      {},
      JSON.stringify({
        answer: number,
        problemId: problem.id,
        userId: userInfo.id,
        roomCode: roomCode,
      }),
    );
  };

  const handleModal = () => {
    dispatch(friendActions.handleModal('invite'));
  };
  const closeModal = () => {
    dispatch(friendActions.handleModal(null));
  };

  useEffect(() => {
    if (friendId) {
      client.current.send(
        '/api/friend/invite',
        {},
        JSON.stringify({
          userId: friendId,
          gameType: 'cs',
          roomCode: roomCode,
        }),
      );
    }
  }, [friendId]);

  useEffect(() => {
    const preventGoBack = () => {
      // change start
      window.history.pushState(null, '', window.location.href);
      // change end
      alert('게임중에는 나갈 수 없습니다');
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', preventGoBack);
    return () => window.removeEventListener('popstate', preventGoBack);
  }, []);
  // 뒤로가기 막는 useEffect
  // 새로고침, 창닫기, 사이드바 클릭 등으로 페이지 벗어날때 confirm 띄우기
  usePrompt('게임중에 나가면 등수가 기록되지 않습니다', true);

  return (
    <Container>
      {isLoading && (
        <LoadingBlock>
          <img src="/img/loadingspinner.gif" alt="loadingSpinner" />
          <p className="loadingText">방에 들어가는중~</p>
        </LoadingBlock>
      )}
      {!isLoading && !isStart && (
        <WaitingBlock>
          {modal === 'invite' && (
            <FriendModal handleModal={closeModal} type="invite" />
          )}

          <img
            src="/img/gametitle/gametitle3.png"
            className="gameTitle"
            alt="gameTitle"
          />
          <div className="subtitle">친선전</div>
          {isMaster && <button onClick={onClickStart}>게임시작</button>}
          {isReady && <p>{sec}초 후 게임이 시작됩니다!</p>}
          <div className="waitingContent">
            <div className="imgBox">
              <img
                src="/img/rank/waitingroom.png"
                className="waitingroom"
                alt="room"
              />
              {players &&
                players.map((player: any, idx: number) => {
                  return (
                    <div
                      key={idx}
                      style={characterLocationArr[countArr.indexOf(player.id)]}
                    >
                      <div>{player.nickname}</div>
                      <img
                        style={{ height: '100%', width: '100%' }}
                        src={`${process.env.REACT_APP_S3_URL}/profile/${player.profileChar}_normal.gif`}
                        alt="character"
                      />
                    </div>
                  );
                })}
            </div>
            <button onClick={handleModal}>친구 초대</button>
            {players &&
              players.map((player: any, idx: number) => {
                return <li key={idx}>{player.nickname}</li>;
              })}
          </div>
        </WaitingBlock>
      )}
      {isStart && (
        <IngameBlock>
          <img
            src="/img/gametitle/gametitle3.png"
            className="gameTitle"
            alt="gameTitle"
          />
          {(!problem || isNext) && (
            <div>
              <img src="/img/loadingspinner.gif" alt="loadingSpinner" />
              <p className="loadingText">문제를 불러오고 있습니다</p>
            </div>
          )}
          {problem && !isSubmit && isSolved === null && (
            <div className="problemBox">
              <div className="problem">
                <div className="progressContainer">
                  <div className="progress"></div>
                </div>
                <div className="question">{problem.question}</div>
                <div>{problem.example}</div>
                {/* {problem.examples.map((example: string, index: number) => {
                return (
                  <span>
                  {index} : {example}
                  </span>
                  );
                })} */}
              </div>
              <div className="selectbuttons">
                {answerButton.map((answer, idx) => {
                  return (
                    <img
                      key={idx}
                      className="selectbutton"
                      onClick={(e) => handleAnswerSend(e, answer)}
                      src={`/img/selectbutton/button${answer}.png`}
                    />
                  );
                })}
              </div>
              <div className="rankBlock">
                {ranking &&
                  ranking.slice(0, 3).map((rank: any, idx: number) => {
                    return (
                      <div key={idx} className="rankwrapper">
                        <div>
                          <img src={`/img/rank/medal${idx}.png`} />
                          <div>
                            <img
                              className="character"
                              src={`${process.env.REACT_APP_S3_URL}/profile/${rank[2]}_normal.gif`}
                            />
                            <div>{rank[1]}</div>
                            <div>{rank[3]}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
          {isSubmit && (
            <div>
              <img src="/img/loadingspinner.gif" />
              <p className="loadingText">다른 사람들이 푸는것을 기다려주세요</p>
            </div>
          )}
          {isSolved !== null && !isNext && (
            <div>
              <p>중간결과 페이지</p>
              <div>
                <div>{problem.question}</div>
                <div>{problem.example}</div>
                <div>답 : {answer}</div>
                <div>고른 비율</div>
                {cntPerNum &&
                  Object.keys(cntPerNum).map((num: any, idx: number) => {
                    return <div key={idx}>{cntPerNum[num]}</div>;
                  })}
                {}
              </div>
            </div>
          )}
        </IngameBlock>
      )}
    </Container>
  );
};

export default CSFriendPage;