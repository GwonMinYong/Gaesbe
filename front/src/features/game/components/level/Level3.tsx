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
  bottom: 51%;
  left: 62%;
`;
const MyComputer = styled.img`
  width: 9%;
  position: absolute;
  bottom: 33%;
  left: 45%;
  :hover {
    transform: scale(1.2);
    content: url('/img/MyOffice/level3computer.gif');
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

  :hover {
    transform: scale(1.2);
    transition: 0.4s ease-in-out;
    cursor: url('/img/cursor/hover_cursor.png'), auto;
  }
`;
const Note = styled.img`
  width: 7%;
  position: absolute;
  bottom: 35%;
  right: 36%;
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
  bottom: 71%;
  right: 42%;
  width: 6%;
  height: 9%;
  transform: scaleX(-1);
  /* bottom: 24vh;
  right: 31vw; */
  transition: all 0.4s;
  :hover {
    transform: scaleX(-1.2) scaleY(1.2);
    /* content: url("/img/roomGif/level0computer.gif"); */
    transition: 0.4s ease-in-out;
    cursor: url('/img/cursor/hover_cursor.png'), auto;
  }
`;
const Level3 = ({ handleModal, officeIdx }: any) => {
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

        <MyRoom src="/img/MyOffice/level4.png" alt="lv2 room" />

        <MyComputer
          onClick={handleGameSelect}
          src="/img/MyOffice/level3computer.png"
          alt="내 컴퓨터"
        />
        <Coin onClick={handleCoin} src="/img/coin/coin.png" />
        <Note onClick={handleMyPage} src="/img/MyOffice/note.png" />
        {/* <Spider src="/img/roomGif/spider.gif" /> */}
        <Calender
          onClick={handleModal}
          src="/img/MyOffice/level3calender.png"
        />
      </div>
    </Unity>
  );
};

export default Level3;
