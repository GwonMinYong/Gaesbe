import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import './style.css';
import Swal from 'sweetalert2';

import Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import { friendActions } from '../../friend/friendSlice';

interface CustomWebSocket extends WebSocket {
  _transport?: any;
}

interface CharStateType {
  index: number;
  sentence: number;
  type: number;
}
const Wrapper = styled.div`
  height: 100%;
  width: 100%;
`;

const TypingBg = styled.img`
  height: 100%;
  width: 100%;
  position: absolute;
  text-align: left;
`;
const TrackLine = styled.div`
  height: 25%;
`;
const Track = styled.div`
  /* height: 20vh;
  margin-top: 23.5vh; */
  height: calc(20vh - 1rem);
  margin-top: 21.5vh;
`;
const LoadingBlock = styled.div`
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  .loadingText {
    font-size: large;
  }
`;
const TypingPersonalResult = styled.div`
  width: 100%;
  color: white;
  height: 100%;
  margin-bottom: 1px;
`;
const Personal = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
`;
const PersonalId = styled.div`
  width: 3%;
  height: 100%;
`;
const CharacterSet = styled('div')<{ progress: string }>`
  width: 100%;
  /* height: 100%; */
  padding-left: ${(props) => props.progress};
  // 부드럽게 움직이도록
  transition: all 0.4s;
  display: flex;
  flex-direction: column;
`;
const CharacterName = styled.div`
  opacity: 0.9;
  /* width: 10%; */
  min-width: 7%;
  height: 200%;
  bottom: 70%;
  z-index: 5;
  position: absolute;
  div {
    background-color: #2e2e2e;
    color: white;
    padding: 7px;
    font-size: 10px;
    border-radius: 15px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
`;
const CharacterImg = styled.img`
  height: 200%;
  bottom: 20%;
  position: absolute;
  z-index: 1;
`;
const PersonalCharacter = styled.div`
  width: 87%;
  position: relative;
  &::after {
    content: '';
    border-right: 1rem solid #bf0909;
    position: absolute;
    right: 0;
    height: 100%;
  }
  .imgNormal {
    transform: scaleX(-1);
  }
`;
// const CharacterImg = styled('img')<{ progress: string }>`
//   padding-left: ${(props) => props.progress};
//   // 부드럽게 움직이도록
//   transition: all 0.4s;
//   height: 200%;
//   bottom: 20%;
//   position: absolute;
//   z-index: 1;
// `;
const PersonalResult = styled.div`
  width: 10%;
  border-radius: 5px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;
const Typing = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;
const TypingResult = styled.div`
  /* width: 100%;
  color: white;
  margin-bottom: 3rem;
  box-sizing: border-box;
  min-height: 50vh;
  max-height: 50vh;
  position: relative;
  display: inline-block;
  *display: inline;
  zoom: 1; */

  width: 100%;
  color: white;
  margin-bottom: 3rem;
  box-sizing: border-box;
  min-height: 50vh;
  max-height: 50vh;
  position: relative;
  display: inline-block;
  *display: inline;
  zoom: 1;
  border: 1rem solid #232323;
  box-sizing: border-box;
  border-radius: 2rem;
  overflow: hidden;
`;
const WaitingTypingGameBox = styled.div`
  width: 90%;
  height: 17rem;
  display: flex;
  justify-content: center;
  align-items: center;
  color: black;
  background-color: white;
  border-radius: 20px;
  font-family: 'Hack';
  font-weight: bold;
`;
const TypingGameBox = styled.div`
  width: 90%;
  background-color: white;
  padding-left: 1rem;
  padding-top: 1rem;
  height: 17rem;
  border-radius: 20px;
  overflow: hidden;
  font-family: 'Hack';
  font-weight: bold;
`;
const Wow = styled.div`
  display: inline;
  h1 {
    display: inline;
    div {
      height: 10rem;
      display: inline;
    }
  }
`;
const This = styled.div`
  display: inline;
  color: ${(props) => props.color};
`;
const TypingGame = () => {
  let roomcode: string;
  let testtest: number;
  let testprogress: any;
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { lang } = location.state;
  const [players, setPlayers] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<Boolean>(true);
  const [roomCode, setRoomCode] = useState<string>('');
  const { userInfo } = useSelector((state: any) => state.auth);
  const [testProgress, setTestProgress] = useState<any>(null);
  const [paragraph, setPargraph] = useState<any>(null);
  const [isReady, setIsReady] = useState<Boolean>(false);
  const [isEnd, setIsEnd] = useState<Boolean>(false);
  const [resultId, setResultId] = useState<any>(null);
  const [resultNickName, setResultNickName] = useState<any>(null);
  const [resultProfile, setResultProfile] = useState<any>(null);
  const initialTime = useRef<number>(3);
  const interval = useRef<any>(null);
  const [sec, setSec] = useState(3);
  const { errorMsg } = useSelector((state: any) => state.friend);
  // const socket: CustomWebSocket = new SockJS(
  //   'https://k7e104.p.ssafy.io:8081/api/ws',
  // );
  const client = useRef<any>(null);
  const client2 = useRef<any>(null);
  // useEffect(() => {
  // }, []);
  // const client2 = Stomp.over(socket);
  useEffect(() => {
    if (isEnd && resultId && resultNickName) {
      // console.log('끄읕');
      navigate('/game/typing/result', {
        state: {
          resultId: resultId,
          resultNickName: resultNickName,
          resultProfile: resultProfile,
        },
      });
    }
  }, [isEnd, resultId, resultNickName]);
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
    if (userInfo) {
      const socket: CustomWebSocket = new SockJS(
        'https://k7e104.p.ssafy.io:8081/api/ws',
      );
      client.current = Stomp.over(socket);
      client.current.connect({}, (frame: any) => {
        // console.log('*****************121**************************');
        client.current.subscribe(`/typing2/${userInfo.id}`, (res: any) => {
          var data = JSON.parse(res.body);
          if (data.hasOwnProperty('room')) {
            setRoomCode(data.room);
            roomcode = data.room;
          }
          if (data.hasOwnProperty('isLast')) {
            if (data.isLast === true) {
              client.current.send(
                '/api/typing2/start',
                {},
                JSON.stringify({
                  langType: lang,
                  roomCode: roomcode,
                }),
              );
              setIsReady(true);
              setTimeout(() => {
                setIsLoading(false);
              }, 4000);
            }
          }
        });
        const enterRoom = () => {
          client.current.send(
            '/api/typing2',
            {},
            JSON.stringify({
              langType: lang,
              type: 'ENTER',
              sessionId: socket._transport.url.slice(-18, -10),
              userId: userInfo.id,
              roomType: 'RANDOM',
            }),
          );
        };
        enterRoom();
        const fetchMemberInfo = () => {
          client.current.send(
            '/api/typing2/memberInfo',
            {},
            JSON.stringify({
              roomCode: roomcode,
            }),
          );
        };
        setTimeout(() => {
          fetchMemberInfo();
        }, 2000);
      });
    }
  }, [userInfo]);

  useEffect(() => {
    if (roomCode) {
      const socket: CustomWebSocket = new SockJS(
        'https://k7e104.p.ssafy.io:8081/api/ws',
      );
      client2.current = Stomp.over(socket);
      client2.current.connect({}, (frame: any) => {
        // console.log('*****************177**************************');
        client2.current.subscribe('/typing2/room/' + roomCode, (res: any) => {
          var testdata = JSON.parse(res.body);
          if (testdata.hasOwnProperty('progressByPlayer')) {
            setTest(testdata.progressByPlayer[`${userInfo.id}`]);
            setTestProgress(testdata);
            testprogress = testdata.progressByPlayer;
            testtest = testdata.progressByPlayer[`${userInfo.id}`];
          } else if (testdata.hasOwnProperty('start')) {
            setIsReady(true);
            setTimeout(() => {
              setIsLoading(false);
            }, 4000);
          } else if (testdata.hasOwnProperty('end')) {
            if (testdata.end === true) {
              // console.log('어 끝이야');
            }
            setResultId(testdata.winUserId);
            setResultNickName(testdata.winUserNickName);
            setResultProfile(testdata.winUserProfile);
            setIsEnd(true);
          } else if (testdata.hasOwnProperty('msg')) {
            Swal.fire({
              toast: true,
              position: 'top',
              timer: 1000,
              showConfirmButton: false,
              text: testdata.msg,
            });
          } else if (testdata.hasOwnProperty('paragraph')) {
            setPargraph(testdata.paragraph);
          } else if (testdata.hasOwnProperty('roomDto')) {
            return;
          } else {
            setPlayers(testdata);
          }
        });
      });
    }
  }, [roomCode]);

  useEffect(() => {
    return () => {
      client.current.disconnect(() => {});
      client2.current.disconnect(() => {});
    };
  }, []);

  const typinggamebox = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    typinggamebox.current?.focus();
  });
  function yscroll() {
    typinggamebox.current?.scrollBy({
      left: -10000,
      top: 40,
      behavior: 'smooth',
    });
  }
  function xscroll() {
    typinggamebox.current?.scrollBy({ left: 10, behavior: 'smooth' });
  }

  const exapmleitem = `${paragraph}`;
  const example = exapmleitem.split(' ');
  const item = example.map((e) => e);
  let totalLength = 0;
  const arr = [0, 1, 2, 3];
  item.map((e) => (totalLength += e.length));
  const [charState, setCharState] = useState<CharStateType>({
    index: 0,
    sentence: 0,
    type: 0,
  });
  const [progress, setProgress] = useState<number>(0);
  const [index, setIndex] = useState<number>(0);
  const [sentence, setSentence] = useState<number>(0);
  const [endGame, setEndGame] = useState<number>(0);
  const [test, setTest] = useState<number>(0);

  const handleSetKey = (event: any) => {
    if (event.keyCode === 32) {
      event.preventDefault();
      //기능구현
    }
    if (event.key === 'Backspace') {
      event.preventDefault();
    } else if (event.key === ' ') {
      if (example[sentence][index] === 'ˇ') {
        // console.log('****************보냄********************');
        xscroll();
        client.current.send(
          '/api/typing2/submit',
          {},
          JSON.stringify({
            roomCode: roomCode,
            // sessionId: socket._transport.url.slice(-18, -10),
            isCorrect: true,
            userId: userInfo.id,
          }),
        );
        setProgress(progress + 1);
        setIndex(index + 1);
        const changedState = JSON.parse(
          JSON.stringify({ index: index, sentence: sentence, type: 1 }),
        );
        setCharState(changedState);
      } else {
        const changedState = JSON.parse(
          JSON.stringify({ index: index, sentence: sentence, type: 2 }),
        );
        setCharState(changedState);
      }
    } else if (event.key === 'Enter') {
      // window.scrollBy(0, 1000);
      if (index === example[sentence].length) {
        yscroll();
        const changedState = JSON.parse(
          JSON.stringify({ index: 0, sentence: sentence + 1, type: 0 }),
        );
        setCharState(changedState);
        setSentence(sentence + 1);
        setIndex(0);
      } else {
        event.preventDefault();
      }
    } else if (
      event.key !== 'Enter' &&
      event.key !== 'Shift' &&
      event.key !== 'Alt' &&
      event.key !== 'Control' &&
      event.key !== 'CapsLock' &&
      event.key !== 'F12' &&
      event.key !== 'F5' &&
      event.key !== 'Tab' &&
      event.key !== 'Meta' &&
      event.key !== 'HanjaMode' &&
      event.key !== 'ArrowLeft' &&
      event.key !== 'ArrowRight' &&
      event.key !== 'ArrowDown' &&
      event.key !== 'ArrowUp'
    ) {
      // 백에 보내는 맞고 틀리고는 무조건 인덱스당 한번만

      // 내가 친거랑 쳐야하는게 똑같다면
      if (example[sentence][index] === event.key) {
        // console.log('****************보냄********************');
        xscroll();
        client.current.send(
          '/api/typing2/submit',
          {},
          JSON.stringify({
            roomCode: roomCode,
            // sessionId: socket._transport.url.slice(-18, -10),
            isCorrect: true,
            userId: userInfo.id,
          }),
        );

        setProgress(progress + 1);
        setIndex(index + 1);
        const changedState = JSON.parse(
          JSON.stringify({ index: index, sentence: sentence, type: 1 }),
        );
        setCharState(changedState);

        // 틀렸다면
      } else {
        const changedState = JSON.parse(
          JSON.stringify({ index: index, sentence: sentence, type: 2 }),
        );
        setCharState(changedState);
      }
    } else {
    }
  };
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
    <Wrapper>
      {isLoading && !players && (
        <LoadingBlock>
          <img src="/img/loadingspinner.gif" />
          <p className="loadingText">랜덤 매칭중~</p>
        </LoadingBlock>
      )}

      <Typing>
        {players && (
          <TypingResult>
            <TypingBg
              className="typingBg"
              src="/img/typing/typingTrack2.png"
              alt="타이핑 트랙"
            />
            <Track>
              {arr.map((a: any, idx: number) => {
                return (
                  <TrackLine key={idx}>
                    <TypingPersonalResult>
                      <Personal>
                        <PersonalId>
                          {idx < players.length && (
                            <div>{players[idx].nickname}</div>
                          )}
                        </PersonalId>
                        <PersonalCharacter>
                          {/* 로딩되고 있을 땐 가만히 서있는걸로 */}
                          {isLoading && idx < players.length && (
                            <CharacterSet
                              progress={
                                testProgress
                                  ? testProgress.progressByPlayer[
                                      `${players[idx].id}`
                                    ] + '%'
                                  : '0%'
                              }
                            >
                              <CharacterName>
                                <div>{players[idx].nickname}</div>
                              </CharacterName>
                              <CharacterImg
                                // progress={
                                //   testProgress
                                //     ? testProgress.progressByPlayer[
                                //         `${players[idx].id}`
                                //       ] + '%'
                                //     : '0%'
                                // }
                                className="imgNormal"
                                src={`${process.env.REACT_APP_S3_URL}/profile/${players[idx].profileChar}_normal.gif`}
                                // src={`${process.env.REACT_APP_S3_URL}/profile/${userInfo.profileChar}_normal.gif`}
                                alt="playerImg"
                              />
                            </CharacterSet>
                          )}

                          {/* 로딩되고 있을 땐 가만히 서있는걸로 */}
                          {!isLoading && idx < players.length && (
                            <CharacterSet
                              progress={
                                testProgress
                                  ? testProgress.progressByPlayer[
                                      `${players[idx].id}`
                                    ] + '%'
                                  : '0%'
                              }
                            >
                              <CharacterName>
                                <div>{players[idx].nickname}</div>
                              </CharacterName>
                              <CharacterImg
                                // progress={
                                //   testProgress
                                //     ? testProgress.progressByPlayer[
                                //         `${players[idx].id}`
                                //       ] + '%'
                                //     : '0%'
                                // }
                                className="img"
                                // src={`${process.env.REACT_APP_S3_URL}/profile/${userInfo.profileChar}_walk.gif`}
                                src={`${process.env.REACT_APP_S3_URL}/profile/${players[idx].profileChar}_walk.gif`}
                                alt="playerImg"
                              />
                            </CharacterSet>
                          )}
                        </PersonalCharacter>
                        <PersonalResult>
                          {idx < players.length && testProgress && (
                            <div>
                              {
                                testProgress.progressByPlayer[
                                  `${players[idx].id}`
                                ]
                              }
                            </div>
                          )}
                        </PersonalResult>
                      </Personal>
                    </TypingPersonalResult>
                  </TrackLine>
                );
              })}
            </Track>
          </TypingResult>
        )}

        {/* 대기하고 있을때 */}
        {isLoading && players && (
          <WaitingTypingGameBox>
            {!isReady && <p>4명의 인원이 모이면 시작합니다</p>}
            {isReady && <p>{sec}초 후 게임이 시작됩니다!</p>}
          </WaitingTypingGameBox>
        )}

        {/* 게임 시작했을 때 */}

        {!isLoading && (
          <TypingGameBox
            ref={typinggamebox}
            onKeyDown={(event) => handleSetKey(event)}
            tabIndex={0}
          >
            {item.map((e, idx) => {
              return (
                <div>
                  {e.split('').map((char: string, index: number) => {
                    let state = charState.type;
                    let stateindex = charState.index;
                    let statesentence = charState.sentence;
                    let color =
                      state === 0 ? 'gray' : state === 1 ? 'black' : 'red';

                    return (
                      <Wow id="wow">
                        <h1>
                          <div>
                            {statesentence === idx && stateindex === index ? (
                              <This
                                style={{
                                  textDecoration: 'underline solid',
                                  textUnderlinePosition: 'under',
                                  letterSpacing: '0.2rem',
                                }}
                                className={`caret`}
                                color={color}
                              >
                                {char}
                              </This>
                            ) : statesentence === idx && stateindex > index ? (
                              <This color={'black'}>{char}</This>
                            ) : statesentence > idx ? (
                              <This color={'black'}>{char}</This>
                            ) : (
                              <This color={'gray'}>{char}</This>
                            )}
                          </div>
                        </h1>
                      </Wow>
                    );
                  })}
                </div>
              );
            })}
          </TypingGameBox>
        )}
      </Typing>
    </Wrapper>
  );
};

export default TypingGame;
