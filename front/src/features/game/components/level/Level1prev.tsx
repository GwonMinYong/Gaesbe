import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
const Unity = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60%;
  background-color: #232323;
  background-image: url(/img/MyOffice/level1.png);
  background-repeat: no-repeat;
  background-size: 90%;
  /* background-size: 70%; */
  background-position-y: 50%;
`;
const MyComputer = styled.img`
  width: 7%;
  height: 15%;
  position: absolute;
  bottom: 20vh;
  right: 45vw;
  :hover {
    transform: scale(1.3);
    transition: 0.4s ease-in-out;
  }
`;
const Coin = styled.img`
  width: 10%;
  height: 10%;
  position: absolute;
  bottom: 30vh;
  left: 50vw;
  :hover {
    transform: scale(1.3);
    transition: 0.4s ease-in-out;
  }
`;
const Note = styled.img`
  width: 5%;
  height: 7%;
  position: absolute;
  bottom: 25vh;
  left: 25vw;
  :hover {
    transform: scale(1.3);
    transition: 0.4s ease-in-out;
  }
`;
const Calender = styled.img`
  width: 5%;
  height: 12%;
  position: absolute;
  bottom: 47vh;
  right: 31vw;
  /* bottom: 24vh;
  right: 31vw; */
  :hover {
    transform: scale(1.3);
    transition: 0.4s ease-in-out;
  }
`;
const Level1 = () => {
  const navigate = useNavigate();
  const handleCoin = () => {
    navigate('/game/casino');
  };
  const handleAlert = () => {
    alert('마이페이지로');
  };
  return (
    <Unity>
      <MyComputer
        onClick={handleAlert}
        src="/img/MyOffice/level1computer.png"
        alt="내 컴퓨터"
      />
      <Coin onClick={handleCoin} src="/img/coin/coin.png" />
      <Note src="/img/MyOffice/note.png" />
      <Calender src="/img/MyOffice/calender.png" />
    </Unity>
  );
};

export default Level1;
