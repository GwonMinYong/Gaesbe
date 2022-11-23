import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { attendanceRequest } from '../../../api/mypageApi';
import AttendanceComponent from '../components/AttendanceComponent';
import { gameActions } from '../gameSlice';
import { itemActions } from '../itemSlice';
import Level0 from '../components/level/Level0';
import Level1 from '../components/level/Level1';
import Level2 from '../components/level/Level2';
import Level3 from '../components/level/Level3';
import Level4 from '../components/level/Level4';
import Level5 from '../components/level/Level5';
import Level6 from '../components/level/Level6';
import styled from 'styled-components';
import Swal from 'sweetalert2';
import LevelupModal from '../components/LevelupModal';
import { authActions } from '../../auth/authSlice';

const Wrapper = styled.div`
  height: 100%;
  width: 100%;

  position: relative;

  overflow: hidden;

  .lockImg {
    margin-top: 20%;
    height: 40%;
  }

  .abilitys {
    position: absolute;
    bottom: 3%;
    /* left: 12%; */
    display: flex;
    flex-direction: row;
    color: #ffffff;
    width: 100%;
    z-index: 0;
    .ability {
      /* margin-right: 5rem; */
      width: 25%;
      font-family: 'NeoDunggeunmo';
      font-size: 1.2rem;
      font-weight: 500;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 0px 4%;
    }
    .gaze {
      width: 80%;
      margin-top: 0.5rem;
      /* box-shadow: 0px 0px 3px 4px #ffffff; */
    }
  }
`;

const LevelUpBtn = styled.button`
  position: absolute;
  right: 1rem;
  top: 1rem;
  padding: 0.6rem;
  border-radius: 0.8rem;
  font-size: 1.2rem;
  background: #f27474;
  z-index: 1000;

  :hover {
    background: #e86464;
    cursor: url('/img/cursor/hover_cursor.png'), auto;
  }
`;

const Office = styled.div`
  width: 100%;
  height: 100%;
  position: relative;

  text-align: center;

  .unlockNeed {
    color: white;
    font-size: 1rem;
    margin-top: 1rem;
  }

  .officeName {
    z-index: 5;
    position: absolute;
    left: 3rem;
    top: 3rem;
    font-size: 2rem;
    color: white;

    img {
      width: 10rem;
    }
    .interaction {
      width: 15%;
      position: absolute;
      top: 100%;
      left: 0;
      :hover {
        cursor: url('/img/cursor/hover_cursor.png'), auto;
      }
    }
    /* font-weight: bold; */
  }
  .info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    width: 20%;
    height: 20%;
    top: 15%;
    left: 10%;
    border: 5px solid black;
    border-radius: 10px;
    position: absolute;
    background-color: #ffc02d;
    div {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
    }
    img {
      width: 15%;
    }
  }
`;

const OfficeBtn = styled.img`
  position: absolute;
  width: 50px;
  height: 50px;
  z-index: 5;
  top: calc(50% - 25px);

  transition: 0.3s transform;
  :hover {
    transform: scale(1.2);
    cursor: url('/img/cursor/hover_cursor.png'), auto;
  }

  &.prevBtn {
    left: 2rem;
  }
  &.nextBtn {
    right: 2rem;
  }
`;

const Offices = styled('div')<{ officeIdx: number }>`
  /* overflow: hidden; */
  /* border: 5px solid white; */
  height: 100%;
  /* width: 100%; */
  display: flex;

  flex-wrap: wrap;
  flex-direction: column;

  transform: translateX(calc(-100 * ${(props) => props.officeIdx}%));
  transition: transform 1s;
`;

const MyOfficePage = () => {
  const dispatch = useDispatch();
  const [officeIdx, setOfficeIdx] = useState(0);
  const idxRef = useRef(0);
  const { userAbility } = useSelector((state: any) => state.auth);
  const { offices } = useSelector((state: any) => state.item);
  const officeComponents = [
    Level0,
    Level1,
    Level2,
    Level3,
    Level4,
    Level5,
    Level6,
  ];

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [needReload, setNeedReload] = useState<boolean>(false);
  const [levelupable, setLevelupable] = useState<boolean>(false);
  const [nextLevel, setNextLevel] = useState<number>(0);
  const [nextLevelName, setNextLevelName] = useState<String>('');
  const [isLevelup, setIsLevelup] = useState<Boolean>(false);
  const [openInfo, setOpenInfo] = useState<boolean>(false);
  const handleModal = () => {
    setModalOpen(!modalOpen);
  };
  const handleReload = (e: boolean) => {
    setNeedReload(e);
  };

  useEffect(() => {
    dispatch(itemActions.fetchCharacterStart());
    dispatch(itemActions.fetchOfficeStart());
  }, []);
  useEffect(() => {
    if (offices && userAbility) {
      const nextoffice = offices.filter((office: any) => !office.own);
      idxRef.current = offices.length - nextoffice.length - 1;
      setOfficeIdx(idxRef.current);
      // console.log('idxRef.current' + idxRef.current);

      if (
        nextoffice.length >= 1 &&
        nextoffice[0].minLv <=
          Math.min(
            userAbility.algorithmLv,
            userAbility.csLv,
            userAbility.typingLv,
            userAbility.luckLv,
          )
      ) {
        // console.log('nextoffice', nextoffice);
        setLevelupable(true);
        setNextLevel(nextoffice[0].officeId);
        setNextLevelName(nextoffice[0].name);
      } else {
        setLevelupable(false);
      }
    }
  }, [offices, userAbility]);

  const officePrev = () => {
    idxRef.current -= 1;
    setOfficeIdx(idxRef.current);
  };
  const officeNext = () => {
    idxRef.current += 1;
    setOfficeIdx(idxRef.current);
  };

  const attendance = async () => {
    try {
      const res = await attendanceRequest();
      if (res.status === 200) {
        Swal.fire({ icon: 'success', text: '출석체크 되었습니다' });
        handleReload(true);
      }
    } catch (error: any) {
      if (error.response.status === 446) {
        Swal.fire({ icon: 'info', text: '오늘은 이미 출석했습니다' });
      }
    }
  };

  const handleLevelUp = () => {
    dispatch(itemActions.requestBuyOfficeStart(nextLevel));
    setIsLevelup(true);
    setTimeout(() => {
      setIsLevelup(false);
    }, 2000);
  };

  useEffect(() => {
    dispatch(authActions.fetchUserInfoStart());
    dispatch(authActions.fetchAbilityStart());
    dispatch(itemActions.fetchCharacterStart());
  }, []);
  const handleOpenInfo = () => {
    setOpenInfo(!openInfo);
  };
  return (
    <Wrapper>
      {levelupable && (
        <LevelUpBtn onClick={handleLevelUp}>
          {nextLevelName} 지원하기
        </LevelUpBtn>
      )}
      {isLevelup && (
        <LevelupModal handleModal={handleModal} nextLevel={officeIdx} />
      )}
      {offices && officeIdx > 0 && (
        <OfficeBtn
          className="prevBtn"
          src="/img/arrow/pink-small-arrow-right.png"
          onClick={officePrev}
        />
      )}
      {offices && officeIdx < offices.length - 1 && (
        <OfficeBtn
          className="nextBtn"
          onClick={officeNext}
          src="/img/arrow/pink-small-arrow-left.png"
        />
      )}

      {offices && (
        <Offices officeIdx={officeIdx}>
          {offices.map((v: any, idx: number) => {
            const Component: any = officeComponents[idx];
            return (
              <Office>
                <div className="officeName">
                  <img src={`/img/MyOffice/officeName/${idx}.png`} />
                  {v.own && idx <= 5 && (
                    <img
                      onMouseEnter={handleOpenInfo}
                      onMouseLeave={handleOpenInfo}
                      className="interaction"
                      src="/img/questionMark-gray.png"
                      alt=""
                    />
                  )}
                </div>
                <div
                  className="info"
                  style={{ display: openInfo ? '' : 'none' }}
                >
                  <div>
                    <img
                      src={`/img/MyOffice/level${idx}computer.png`}
                      alt="asd"
                    />{' '}
                    : 게임페이지로
                  </div>
                  <div>
                    <img src={`/img/coin/coin.png`} alt="" /> : 싸피게임으로
                  </div>
                  <div>
                    <img
                      src={`/img/MyOffice/level${idx}note.png`}
                      alt={`/img/MyOffice/note.png`}
                    />{' '}
                    : 마이페이지로
                  </div>
                  <div>
                    <img src={`/img/MyOffice/level${idx}calender.png`} alt="" />{' '}
                    : 출석체크하기
                  </div>
                </div>
                {/* <div className="officeName">{v.name}</div> */}

                {v.own && <Component officeIdx={v} handleModal={handleModal} />}
                {!v.own && (
                  <>
                    <img className="lockImg" src="/img/Intro/padlock.png" />
                    <div className="unlockNeed">
                      잠금해제 조건: 모든 역량 Lv.{v.minLv}
                    </div>
                  </>
                )}
              </Office>
            );
          })}

          {modalOpen && (
            <AttendanceComponent
              officeIdx={officeIdx}
              needReload={needReload}
              handleReload={handleReload}
              attendance={attendance}
              handleModal={handleModal}
            />
          )}
        </Offices>
      )}

      {userAbility && (
        <div className="abilitys">
          <div className="ability">
            <div>ALGORITHM Lv.{userAbility.algorithmLv}</div>
            <img
              className="gaze"
              src={`/img/ability/expBar/exp${userAbility.algorithmExp}.png`}
              alt="algo_exp"
            />
          </div>
          <div className="ability">
            <div>CS Lv.{userAbility.csLv}</div>
            <img
              className="gaze"
              src={`/img/ability/expBar/exp${userAbility.csExp}.png`}
              alt="cs_exp"
            />
          </div>
          <div className="ability">
            <div>TYPING Lv.{userAbility.typingLv}</div>
            <img
              className="gaze"
              src={`/img/ability/expBar/exp${userAbility.typingExp}.png`}
              alt="typing_exp"
            />
          </div>
          <div className="ability">
            <div>LUCK Lv.{userAbility.luckLv}</div>
            <img
              className="gaze"
              src={`/img/ability/expBar/exp${userAbility.luckExp}.png`}
              alt="luck_exp"
            />
          </div>
        </div>
      )}
    </Wrapper>
  );
};

export default MyOfficePage;
