import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { fetchAlgoRoomList } from '../../../api/algoApi';
import { algoActions } from '../algorithmSlice';
import { AlgoRoomInterface } from '../../../models/algo';

import AlgoRoom from '../components/AlgoRoom';
import AlgoModal from '../components/AlgoModal';
import AlgoExplanationMoal from '../components/AlgoExplanationModal';
import styled from 'styled-components';
import '../../../components/Common/retroBtn.css';
import Swal from 'sweetalert2';
const Wrapper = styled.div`
  height: 100%;
  width: 100%;
  .arrowImg {
    transform: scaleX(-1);
    padding: 1rem;
    /* position: absolute;
    left: 0;
    top: 0; */
    transition: all 0.3s;
    :hover {
      transform: scaleX(-1.2) scaleY(1.2);
      cursor: url('/img/cursor/hover_cursor.png'), auto;
    }
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  height: 90%;
  width: 80%;

  margin: 0 auto;
  .title {
    text-align: center;
    height: 15%;
    margin: 0;
    img {
      width: 50%;
    }
    .question {
      width: 3%;
    }
  }
  .btn-top {
    height: 7%;
    margin-bottom: 3%;
    text-align: right;
    a {
      margin-right: 2%;
    }
  }
  .btn-bottom {
    height: 12%;
    margin-top: 2%;
    text-align: center;
    display: grid;
    a {
      margin: auto;
      justify-content: center;
    }
  }
  .room-wrapper {
    display: flex;
    flex-direction: row;
    text-align: center;
    height: 66%;
  }
  .room {
    width: 50%;
    outline-style: solid;
    outline-width: 5px;
    outline-color: black;
    margin-right: 2%;
    background-color: #2e2e2e;
  }
  .left {
    h2 {
      color: #6f43ff;
    }
  }
  .right {
    h2 {
      color: #f0568c;
    }
  }

  .room-list {
    height: 83%;
    overflow-y: auto;
    border-top: 5px solid black;
  }
`;

function AlgoMainPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { needReload } = useSelector((state: any) => state.algo);
  const [roomList, setRoomList] = useState<{
    start: AlgoRoomInterface[];
    wait: AlgoRoomInterface[];
  }>({ start: [], wait: [] });
  const [bjConnectModal, setBjConnectModal] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const handleConnectModal = () => {
    setBjConnectModal(!bjConnectModal);
  };

  const handleMakeRoom = () => {
    navigate('make');
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (needReload) {
      fetchRooms();
      dispatch(algoActions.setNeedReload(false));
    }
  }, [needReload]);

  const fetchRooms = async () => {
    try {
      const res = await fetchAlgoRoomList();
      setRoomList(res.data);
    } catch (error) {
      // console.log(error);
    }
  };

  const handleReload = () => {
    fetchRooms();
  };
  const openModal = () => {
    setModalOpen(true);
  };
  return (
    <Wrapper>
      <img
        className="arrowImg"
        onClick={() => navigate('/game/select')}
        src="/img/arrow/back-arrow.png"
        alt=""
      />
      <Content>
        {bjConnectModal && <AlgoModal handleModal={handleConnectModal} />}
        <h1 className="title">
          <img src={`/img/gametitle/gametitle4.png`}></img>
          <img
            onClick={openModal}
            className="question"
            src="/img/questionMark-gray.png"
          ></img>
        </h1>
        {modalOpen && <AlgoExplanationMoal setModalOpen={setModalOpen} />}
        <div className="btn-top">
          <a onClick={handleReload} className="eightbit-btn">
            새로고침
          </a>
          <a
            onClick={handleConnectModal}
            className="eightbit-btn eightbit-btn--reset"
          >
            백준연동
          </a>
        </div>
        <div className="room-wrapper">
          <div className="room left">
            <h2>대기중인 방</h2>
            <div className="room-list">
              {roomList.wait.length > 0 &&
                roomList.wait.map((room) => {
                  return <AlgoRoom key={room.roomCode} roomInfo={room} />;
                })}
            </div>
          </div>
          <div className="room right">
            <h2>진행중인 방</h2>
            <div className="room-list">
              {roomList.start.length > 0 &&
                roomList.start.map((room) => {
                  return <AlgoRoom key={room.roomCode} roomInfo={room} />;
                })}
            </div>
          </div>
        </div>
        <div className="btn-bottom">
          <a
            className="eightbit-btn eightbit-btn--proceed"
            onClick={handleMakeRoom}
          >
            방만들기
          </a>
        </div>
      </Content>
    </Wrapper>
  );
}
export default AlgoMainPage;
