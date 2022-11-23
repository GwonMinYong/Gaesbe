import React from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
const Unity = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: #232323;
  position: relative;

  .imageContainer {
    width: 73%;
    position: relative;
    display: inline-block;
    *display: inline;
    zoom: 1;
  }
`;

const MyRoom = styled.img`
  width: 100%;
  height: 15%;
  margin-bottom: 15%;
`;

const MyCharacter = styled.img`
  width: 9%;
  position: absolute;
  bottom: 33%;
  left: 43%;
  z-index: 4;
`;
const MyComputer = styled.img`
  width: 17%;
  position: absolute;
  bottom: 45%;
  left: 28%;
  :hover {
    transform: scale(1.2);
    content: url('/img/roomGif/level0computer.gif');
    transition: 0.4s ease-in-out;
    cursor: url('/img/cursor/hover_cursor.png'), auto;
  }
`;
const Coin = styled.img`
  width: 4%;
  height: 3%;
  position: absolute;
  bottom: 56%;
  left: 50%;
  animation: motion 1.4s linear 0s infinite;
  margin-top: 0;

  @keyframes motion {
    0% {
      margin-bottom: 0px;
    }
    50% {
      margin-bottom: 0.9%;
    }
    100% {
      margin-bottom: 0px;
    }
  }

  :hover {
    transform: scale(1.2);
    transition: 0.4s ease-in-out;
    cursor: url('/img/cursor/hover_cursor.png'), auto;
  }
`;
const Note = styled.img`
  width: 9%;
  position: absolute;
  bottom: 38%;
  right: 61%;
  :hover {
    transform: scale(1.2);
    transition: 0.4s ease-in-out;
    cursor: url('/img/cursor/hover_cursor.png'), auto;
  }
`;
const Spider = styled.img`
  width: 13%;
  left: 44%;
  position: absolute;
  top: 4%;
`;
const Calender = styled.img`
  /* width: 5%;
  height: 12%; */
  position: absolute;
  bottom: 61%;
  right: 15%;
  width: 7%;
  height: 12%;
  /* bottom: 24vh;
  right: 31vw; */
  :hover {
    transform: scale(1.2);
    transition: 0.4s ease-in-out;
    /* content: url("/img/MyOffice/level0calender.gif"); */
    cursor: url('/img/cursor/hover_cursor.png'), auto;
  }
`;
const Level0 = ({ handleModal, officeIdx }: any) => {
  const navigate = useNavigate();

  const { userInfo } = useSelector((state: any) => state.auth);
  const handleCoin = () => {
    navigate('/game/casino');
  };
  const handleMyPage = () => {
    navigate('/game/mypage');
    // alert('마이페이지로');
  };
  const handleGameSelect = () => {
    navigate('/game/select');
    // alert('마이페이지로');
  };
  return (
    <Unity>
      <div className="imageContainer">
        {userInfo && (
          <MyCharacter
            src={`${process.env.REACT_APP_S3_URL}/profile/${userInfo.profileChar}_normal.gif`}
            className="profileImg"
            alt="profileImg"
          />
        )}

        <MyRoom src="/img/MyOffice/level00.gif" alt="lv0 room" />

        <MyComputer
          onClick={handleGameSelect}
          src="/img/MyOffice/level0computer.png"
          alt="내 컴퓨터"
        />
        <Coin onClick={handleCoin} src="/img/coin/coin.png" />
        <Note onClick={handleMyPage} src="/img/MyOffice/level0note.png" />
        <Spider src="/img/roomGif/spider.gif" />
        <Calender
          onClick={handleModal}
          src="/img/MyOffice/level0calender.png"
        />
      </div>
    </Unity>
  );
};

export default Level0;
