import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import Swal from 'sweetalert2';

import styled from 'styled-components';
import FriendModal from '../../friend/components/FriendModal';
import { friendActions } from '../../friend/friendSlice';

import CSIsLoadingPage from '../components/CSIsLoading';
import CSMiddleChart from '../components/CSMiddleChart';

interface CustomWebSocket extends WebSocket {
  _transport?: any;
}

const Container = styled.div`
  width: 100%;
  height: 100%;
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

const WaitingBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  .waitingroom {
    width: 100%;
    height: 100%;
  }
  .subtitle {
    font-size: 30px;
    font-weight: 400;
    height: 10%;
  }
  .waitingContent {
    display: flex;
    width: 60%;
    height: 70%;
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

const PlayerCharacter = styled.div`
  position: absolute;
  height: 20%;
  .playerNickName {
    text-align: center;
    height: 20%;
  }
  img {
    height: 80%;
  }
`;

const CSIngamePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState<Boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isLast, setIsLast] = useState<Boolean>(false);
  const [isStart, setIsStart] = useState<Boolean>(false);
  const [roomCode, setRoomCode] = useState<string>('');
  const [players, setPlayers] = useState<any>(null);
  const [problem, setProblem] = useState<any>(null);
  const [problemCnt, setProblemCnt] = useState<number>(0);
  const [isSolved, setIsSolved] = useState<number | null>(null);
  const [isSubmit, setIsSubmit] = useState<Boolean>(false);
  const [ranking, setRanking] = useState<any>(null);
  const [myScore, setMyScore] = useState<any>(null);
  const [myRanking, setMyRanking] = useState<any>(null);
  const [cntPerNum, setCntPerNum] = useState<any>(null);
  const [chartPerNum, setChartPerNum] = useState<any>(null);
  const [isNext, setIsNext] = useState<Boolean>(false);
  const [isEnd, setIsEnd] = useState<any>(null);
  const [rankByPlayer, setRankByPlayer] = useState<any>(null);
  const [countArr, setCountArr] = useState<any>(null);
  const { userInfo } = useSelector((state: any) => state.auth);
  const { modal } = useSelector((state: any) => state.friend);
  const { errorMsg } = useSelector((state: any) => state.friend);

  const answerButton = [1, 2, 3, 4];
  const answerButtonOX = [1, 2];

  const initialTime = useRef<number>(3);
  const interval = useRef<any>(null);
  const [sec, setSec] = useState(3);
  let roomcode: string;
  let playerList: Array<any>;

  const characterLocationArr: any = [
    {
      left: '14%',
      top: '56%',
      zIndex: 4,
    },
    {
      left: '25%',
      top: '47%',
      zIndex: 2,
    },
    {
      left: '35%',
      top: '43%',
    },
    {
      left: '33%',
      top: '63%',
      zIndex: 4,
    },
    {
      left: '43%',
      top: '52%',
      zIndex: 2,
    },
    {
      left: '48%',
      top: '37%',
    },
    {
      left: '53%',
      top: '56%',
      zIndex: 2,
    },
    {
      left: '67%',
      top: '49%',
      zIndex: '2',
    },
    {
      left: '65%',
      top: '60%',
      zIndex: '3',
    },
    {
      left: '47%',
      top: '69%',
      zIndex: '4',
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
            }, 57000);
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
              roomType: 'RANDOM',
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
            } else if (data1.msg === 'start') {
              setIsReady(false);
              setIsStart(true);
            } else {
              Swal.fire({
                toast: true,
                position: 'top',
                timer: 1000,
                showConfirmButton: false,
                text: data1.msg,
              });
            }
          } else if (data1.hasOwnProperty('currentProblem')) {
            setIsSolved(null);
            setProblem(data1.currentProblem);
            setProblemCnt((prev) => prev + 1);
            setIsNext(false);
          } else if (data1.hasOwnProperty('ranking')) {
            setRanking(data1.ranking);
            setCntPerNum(data1.cntPerNum);
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

  useEffect(() => {
    if (players && isLast) {
      client.current.send(
        '/api/cs/start',
        {},
        JSON.stringify({
          roomCode: roomCode,
        }),
      );
    }
  }, [isLast, players]);

  // 로딩 & 끝 제어
  useEffect(() => {
    if (players) {
      setIsLoading(false);
    }
    if (isEnd && rankByPlayer) {
      console.log('끝');
      navigate('/game/CS/result', {
        state: {
          ranking: ranking,
          rankByPlayer: rankByPlayer,
          myScore: myScore,
          myRanking: myRanking,
        },
      });
    }
  }, [players, isEnd, rankByPlayer]);

  // 정답 유무 확인
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

  useEffect(() => {
    if (ranking) {
      const tmp = ranking.filter((rank: any) => {
        return rank[0] === userInfo.id;
      });
      setMyScore(tmp[0]);
      const my = (element: any) => element[0] === userInfo.id;
      console.log(ranking.findIndex(my));
    }
  }, [ranking]);

  useEffect(() => {
    if (cntPerNum) {
      const tmp = Object.values(cntPerNum);
      setChartPerNum(tmp);
    }
  }, [cntPerNum]);

  useEffect(() => {
    if (errorMsg) {
      Swal.fire({
        toast: true,
        position: 'top',
        timer: 1000,
        showConfirmButton: false,
        text: errorMsg,
      });
      setTimeout(() => {
        dispatch(friendActions.setErrorMsg(null));
        navigate('/game');
      }, 1000);
    }
  }, [errorMsg]);

  return (
    <Container>
      {isLoading && <CSIsLoadingPage />}
      {!isLoading && !isStart && (
        <WaitingBlock>
          <img
            src="/img/gametitle/GameTitle6.png"
            className="gameTitle"
            alt="gameTitle"
          />
          <h3>10명이 모이면 자동으로 게임이 시작합니다!!</h3>
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
                    <PlayerCharacter
                      key={idx}
                      style={characterLocationArr[countArr.indexOf(player.id)]}
                    >
                      <div className="playerNickName">{player.nickname}</div>
                      <img
                        src={`${process.env.REACT_APP_S3_URL}/profile/${player.profileChar}_normal.gif`}
                        alt="character"
                      />
                    </PlayerCharacter>
                  );
                })}
            </div>
          </div>

          {isReady && <p className="timeOut">{sec}초 후 게임이 시작됩니다!</p>}
        </WaitingBlock>
      )}
      {isStart && (
        <IngameBlock>
          {(!problem || isNext) && (
            <div>
              <img src="/img/loadingspinner.gif" alt="loadingSpinner" />
              <p className="loadingText">문제를 불러오고 있습니다</p>
            </div>
          )}
          {problem && !isSubmit && isSolved === null && (
            <div className="problemBox">
              {problemCnt && (
                <div className="problemCount">{problemCnt}/10</div>
              )}
              <div className="problem">
                <div className="progressContainer">
                  <div className="progress"> </div>
                </div>
                <div className="problemContent">
                  <div className="question">
                    {problem.question
                      .split('```')
                      .map((k: String, v: number) => (
                        <div>{k}</div>
                      ))}
                  </div>
                  <div>
                    {problem.example.split('|').map((k: String, v: number) => (
                      <div className="example">
                        {v + 1}. {k}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="selectbuttons">
                {problem &&
                  problem.type === 'MULTICHOICE' &&
                  answerButton.map((answer, idx) => {
                    return (
                      <img
                        key={idx}
                        className="selectbutton"
                        onClick={(e) => handleAnswerSend(e, answer)}
                        src={`/img/selectbutton/button${answer}.png`}
                      />
                    );
                  })}
                {problem &&
                  problem.type === 'OX' &&
                  answerButtonOX.map((answer, idx) => {
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
                        <img
                          className="medal"
                          src={`/img/rank/medal${idx}.png`}
                        />
                        <div className="characterBox">
                          <img
                            className="character"
                            src={`${process.env.REACT_APP_S3_URL}/profile/${rank[2]}_normal.gif`}
                          />
                          <div className="playerNickName">
                            <div>{rank[1]}</div>
                            <div>{rank[3]}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {myScore && myRanking >= 4 && (
                  <div className="rankwrapper myRankWrapper">
                    <div className="myRank">
                      {myRanking + 1}
                      <span>등</span>
                    </div>

                    <div className="characterBox myCharacter">
                      <img
                        className="character"
                        src={`${process.env.REACT_APP_S3_URL}/profile/${myScore[2]}_normal.gif`}
                        alt="profile"
                      />
                      <div className="playerNickName">
                        <div>{myScore[1]}</div>
                        <div>{myScore[3]}</div>
                      </div>
                    </div>
                  </div>
                )}
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
            <div className="problemBox">
              {problemCnt && (
                <div className="problemCount">{problemCnt}/10</div>
              )}
              <div className="problem">
                <div className="problemContent">
                  <div className="question">
                    {problem.question
                      .split('```')
                      .map((k: String, v: number) => (
                        <div>{k}</div>
                      ))}
                  </div>
                  <div>
                    {problem.example.split('|').map((k: String, v: number) => (
                      <div
                        className={
                          'example' +
                          (v + 1 === problem.answer ? ' answer' : '')
                        }
                      >
                        {v + 1}. {k}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="chart">
                <CSMiddleChart chartPerNum={chartPerNum} />
              </div>
              {isSolved && isSolved === 0 && (
                <div className="middleText">틀렸습니다ㅜ</div>
              )}
              {isSolved && isSolved === -1 && (
                <div className="middleText">시간초과입니다ㅜ</div>
              )}
              {isSolved && isSolved > 0 && (
                <div className="middleText">
                  {isSolved}등으로 정답을 맞추셨습니다!
                </div>
              )}
            </div>
          )}
        </IngameBlock>
      )}
    </Container>
  );
};

export default CSIngamePage;
