import styled from 'styled-components';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TypingMain = styled.div`
  width: 66%;
  background-color: #232323;
  justify-content: center;
  text-align: center;
  color: white;
  .title {
    text-align: center;
    height: 25%;
    img {
      height: 80%;
    }
  }
`;
const SelectLanguage = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  height: 10rem;
  /* border: 2px solid red; */
  margin-bottom: 5rem;
`;
const SelectLanguageBox = styled.div`
  display: flex;
  justify-content: center;
  width: 10rem;
  height: 10rem;
  align-items: center;

  overflow-y: hidden;
  overflow-x: auto;
  padding: 2rem 2rem;
  /* position: relative; */
  /* border: 2px solid blue; */

  /* :active {
    background-color: white;
  } */
  :hover {
    transform: translateY(-5%);
    transition: all 0.2s linear;
    cursor: url('/img/cursor/hover_cursor.png'), auto;
  }

  .relative {
    position: relative;
  }

  .imgBox {
    background: white;
    width: 100%;
    height: 100%;

    :hover {
      background: #ececec;
    }

    &.java {
      box-shadow: 0px 0px 12px 6px #ff434a;
    }

    &.python {
      box-shadow: 0px 0px 12px 6px #ffc02d;
    }

    animation-name: showToIconBg;
    animation-duration: 2s;
    @keyframes showToIconBg {
      0% {
        transform: translateY(-100%);
      }
      50% {
        transform: translateX(0);
      }
    }
    img {
      width: 80%;
      padding: 10%;

      animation-name: showToIcon;
      animation-duration: 2s;
      @keyframes showToIcon {
        0% {
          transform: translateY(-100%);
        }
        100% {
          transform: translateY(0);
        }
      }
    }
  }

  .langName {
    position: absolute;
    /* background: #4e4e4e; */

    font-weight: bold;

    top: 70%;
    right: -2rem;
    overflow: hidden;

    div {
      width: 100%;
      height: 100%;
      background: #4e4e4e;
      padding: 0.4rem;
      box-sizing: border-box;

      animation-name: showToLangName;
      animation-duration: 2s;

      @keyframes showToLangName {
        0% {
          transform: translateX(-130%);
          opacity: 0;
        }
        50% {
          transform: translateX(-130%);
          opacity: 0;
          /* display: none; */
        }
        50% {
          transform: translateX(-50%);
          color: #4e4e4e;
        }
        100% {
          transform: translateX(0);
          color: white;
        }
      }
    }
  }
`;
const SelectGameType = styled.div``;
const SelectTypeBox = styled.div`
  button {
    padding: 1rem;
  }
`;
function TypingMainPage() {
  const [gameType, setGameType] = useState<String>('PYTHON');
  const navigate = useNavigate();
  const handleEnterGame = () => {
    navigate('enter', { state: { lang: gameType } });
  };
  const handleRandomGame = () => {
    navigate('enter', { state: { lang: gameType } });
  };
  const handleChoicePython = () => {
    setGameType('PYTHON');
    // console.log('파이썬 선택');
  };
  const handleChoiceJava = () => {
    setGameType('JAVA');
    // console.log('자바 선택');
  };
  // console.log(gameType);
  return (
    <TypingMain>
      <div className="title">
        <img src="/img/gametitle/gametitle2.png" alt="title" />
      </div>
      <h1>타이핑 연습을 하면서 언어와 친해지자</h1>
      <SelectLanguage>
        <SelectLanguageBox onClick={handleChoicePython}>
          <div className="relative">
            <div className={`imgBox ${gameType == 'PYTHON' ? 'python' : ''}`}>
              <img
                className="gaze"
                src={`/img/langIcon/python_icon.png`}
                alt="luck_exp"
              />
            </div>
            <div className="langName">
              <div>Python</div>
            </div>
          </div>
        </SelectLanguageBox>
        <SelectLanguageBox onClick={handleChoiceJava}>
          <div className="relative">
            <div className={`imgBox ${gameType == 'JAVA' ? 'java' : ''}`}>
              <img
                className="gaze"
                src={`/img/langIcon/Java_icon.png`}
                alt="luck_exp"
              />
            </div>
            <div className="langName">
              <div>Java</div>
            </div>
          </div>
        </SelectLanguageBox>
      </SelectLanguage>
      <div>
        <h3>언어를 선택해주세요</h3>
      </div>
      <SelectGameType>
        <SelectTypeBox>
          <button onClick={handleRandomGame}>랜덤매칭</button>
        </SelectTypeBox>
        <SelectTypeBox>
          <button onClick={handleEnterGame}>솔로게임</button>
        </SelectTypeBox>
      </SelectGameType>
    </TypingMain>
  );
}

export default TypingMainPage;
