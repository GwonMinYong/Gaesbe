import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { ProblemInterface, RankingUserInfo } from '../../../models/algo';
import { algoActions } from '../algorithmSlice';

import ProblemInfo from './ProblemInfo';
import GameResultModal from './GameResultModal';
import LoadingSpinner from './LoadingSpinner';
import BeforeSolveUsers from './BeforeSolveUsers';

import styled from 'styled-components';
import '../../../components/Common/retroBtn.css';

interface LanguageInterface {
  lanId: number;
  name: string;
}

const Wrapper = styled.div<{ time: number }>`
  height: 90%;
  .content {
    display: flex;
    justify-content: space-between;
  }

  .content > div {
    width: 48%;
    text-align: center;
  }

  .user {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
  }
  .left {
    height: 100%;
    display: flex;
    flex-direction: column;

    .progressContainer {
      height: 10%;
    }

    --duration: ${(props) => props.time * 60};

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

    .btn {
      margin: auto;
    }
    .user-list {
      height: 40%;
    }
    .user-list div:nth-child(1) {
      text-align: left;
      margin-bottom: 3%;
      color: #ffc02d;
      font-size: 1.1rem;
    }
  }
  .right {
    height: 100%;
    display: flex;
    flex-direction: column;
    .select {
      height: 10%;
      width: 100%;
      min-height: 50px;
      margin: 3% auto;
      display: flex;
      justify-content: space-around;
      align-items: center;
      .btnBlueGreen {
        background: #92cd41;
      }
      .btnBlueGreen.btnPush {
        box-shadow: 0px 5px 0px 0px #4aa52e;
      }
      .btnPush:hover {
        margin-top: 15px;
        margin-bottom: 5px;
      }
      .btnBlueGreen.btnPush:hover {
        box-shadow: 0px 0px 0px 0px #4aa52e;
      }
      span.button {
        display: block;
        position: relative;
        float: left;
        width: 80px;
        padding: 0;
        margin: auto;
        text-align: center;
        line-height: 30px;
        color: #fff;
        /* border : 3px solid #000; */
        transition: all 0.2s;
      }
    }
    input[type='radio'] {
      display: none;
    }

    input[type='radio']:checked + span {
      color: yellow;
    }
    button {
    }
  }
  /* 3D */
`;

function AlgoSolve({
  client,
  problemList,
  inGameUsers,
  ranking,
  problemIndex,
  myRank,
  timeOut,
}: any) {
  const dispatch = useDispatch();

  const languageList: LanguageInterface[] = [
    { lanId: 1001, name: 'c++' },
    { lanId: 1002, name: 'java' },
    { lanId: 1003, name: 'python' },
    { lanId: 1004, name: 'c' },
  ];
  const nowProblem: ProblemInterface = problemList[problemIndex];

  const { InGameInfo, solve, gameResultMsg, loadingMsg } = useSelector(
    (state: any) => state.algo,
  );
  const { userInfo } = useSelector((state: any) => state.auth);

  const [form, setForm] = useState<{ lanId: number; code: string }>({
    lanId: 1003,
    code: '',
  });
  const [firstLoading, setFirstLoading] = useState<boolean>(true);
  const [firstModalLoading, setFirstModalLoading] = useState<boolean>(true);
  // 게임이 끝나면 모달을 열고
  const [modal, setModal] = useState<boolean>(false);

  // 결과 모달 자동으로 열기
  useEffect(() => {
    if (gameResultMsg && firstModalLoading) {
      setModal(true);
      setFirstModalLoading(false);
    }
  }, [gameResultMsg]);
  // 컴포넌트 사라질때 문제 성공 리셋
  useEffect(() => {
    return () => {
      dispatch(algoActions.solveSuccess(false));
      dispatch(algoActions.setGameResult(''));
    };
  }, []);

  useEffect(() => {
    if (firstLoading) {
      setFirstLoading(false);
      return;
    }
    if (myRank !== 5 && !timeOut) {
      dispatch(
        algoActions.sendMyRank({
          roomCode: InGameInfo.roomCode,
          ranking: myRank,
          problemId: nowProblem.problemId,
          code: form.code,
          lanId: form.lanId,
        }),
      );
    } else if (timeOut && myRank === 5) {
      dispatch(
        algoActions.sendMyRank({
          roomCode: InGameInfo.roomCode,
          ranking: myRank,
          problemId: nowProblem.problemId,
          code: '타임 아웃!',
          lanId: form.lanId,
        }),
      );
    }
  }, [myRank, timeOut]);

  const handleRadio = (e: React.SyntheticEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      lanId: Number(e.currentTarget.value),
    });
  };
  const handleCode = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setForm({
      ...form,
      code: e.currentTarget.value,
    });
  };
  // TextArea에서 ctrl + a가 안되서 만듦
  const codeTextArea = useRef<HTMLTextAreaElement>(null);
  codeTextArea.current?.addEventListener('keydown', keysPressed);
  function keysPressed(e: any) {
    if (e.ctrlKey && e.key === 'a') {
      codeTextArea.current?.select();
    }
  }
  // TextArea에서 ctrl + a가 안되서 만듦 끝

  const handleCheckSubmit = (e: React.SyntheticEvent<HTMLButtonElement>) => {
    dispatch(
      algoActions.checkMyAnswerRequestStart({
        roomCode: InGameInfo.roomCode,
        problemId: Number(nowProblem.problemId),
        userBjId: userInfo.bjId,
        lanId: form.lanId,
      }),
    );
  };

  const handleGoToSolve = () => {
    window.open(`https://www.acmicpc.net/problem/${nowProblem.problemId}`);
  };

  useEffect(() => {
    if (solve) {
      sendMyRank();
      dispatch(algoActions.solveSuccess(false));
    }
  }, [solve]);

  const sendMyRank = () => {
    client.current.send(
      '/api/algo/rank',
      {},
      JSON.stringify({ roomCode: InGameInfo.roomCode }),
    );
  };
  const handleModal = () => {
    setModal(!modal);
  };

  return (
    <Wrapper time={InGameInfo.time}>
      {loadingMsg === 'SUBMIT' && <LoadingSpinner loadingMsg="제출 확인 중" />}
      {modal && <GameResultModal handleModal={handleModal} myRank={myRank} />}

      <div className="content">
        <div className="left">
          <div className="progressContainer">
            <div className="progress" />
          </div>
          <ProblemInfo nowProblem={nowProblem} />
          <a
            className="btn eightbit-btn eightbit-btn--proceed"
            onClick={handleGoToSolve}
          >
            문제풀러가기
          </a>
          <div className="user-list">
            {/* {ranking.map((user:RankingUserInfo, index:number) => {
            return <div  key={index}>
              <h2>{user.nickName}</h2>
              <img src={`/img/rank/character${user.profileChar}.png`} alt="프로필이미지" />
              {user.min} 분

            </div>
          })} */}
            <div className="rank-title">명예의 전당</div>
            <BeforeSolveUsers inGameUsers={ranking}></BeforeSolveUsers>
          </div>
        </div>
        <div className="right">
          <textarea
            ref={codeTextArea}
            style={{ resize: 'none', overflow: 'auto' }}
            rows={25}
            cols={50}
            wrap="off"
            onChange={handleCode}
            placeholder={form.code}
            value={form.code}
            disabled={gameResultMsg ? true : false}
          />
          {gameResultMsg ? null : (
            <>
              <div className="select">
                {languageList.map((language) => (
                  <label key={language.lanId} htmlFor={language.name}>
                    <input
                      type="radio"
                      name="lanId"
                      id={language.name}
                      value={language.lanId}
                      onChange={handleRadio}
                      checked={form.lanId === language.lanId}
                    />
                    <span className="button btnPush btnBlueGreen">
                      {language.name}
                    </span>
                  </label>
                ))}
              </div>
              <button
                className="eightbit-btn eightbit-btn--proceed"
                onClick={handleCheckSubmit}
              >
                정답 확인
              </button>
            </>
          )}
        </div>
      </div>
    </Wrapper>
  );
}
export default AlgoSolve;
