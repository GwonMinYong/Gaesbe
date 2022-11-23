import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { resultCodeRequest } from '../../../../api/algoApi';

import Swal from 'sweetalert2';

const Wrapper = styled.div`
  border: 5px solid #000;
  border-radius: 10px;
  height: 100%;
  background-color: #c4c4c4;
`;
const Content = styled.div`
  height: 90%;
  .title {
    height: 5%;
    text-align: center;
  }
`;
const Select = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 10%;
  border-bottom: 1px solid #fff;
  .select-item {
    text-align: center;
    width: 100%;
    height: 100%;
    border-radius: 10px 10px 0 0;
    :hover {
      color: #000;
      background-color: #ffc02d;
    }
  }
  .selected {
    color: #000;
    background-color: #ffc02d;
  }
`;

const SelectedCode = styled.div`
  height: 84%;
  overflow-y: auto;
  padding: 10px;
  background-color: #ffc02d;
  border-radius: 0 0 6px 6px;
`;

const Close = styled.img`
  /* z-index: 5000; */
  position: absolute;
  top: 5%;
  right: 5%;
  cursor: url('/img/cursor/hover_cursor.png'), auto;
`;

interface ResultCodeInterface {
  code: string;
  lan: number;
  userId: number;
}
interface Props {
  handleModal: () => void;
  algoDetailRoomCode: any;
}
function AlgoDetailInfo({ handleModal, algoDetailRoomCode }: Props) {
  const language: any = {
    1001: 'c++',
    1002: 'java',
    1003: 'python',
    1004: 'c',
  };
  const { userInfo } = useSelector((state: any) => state.auth);
  const [resultCodes, setResultCodes] = useState<ResultCodeInterface[]>();
  const [codeId, setCodeId] = useState(0);
  useEffect(() => {
    fetchResultCodeRequest();
  }, []);
  useEffect(() => {
    if (resultCodes) {
      // console.log(resultCodes);
    }
  }, [resultCodes]);
  const fetchResultCodeRequest = async () => {
    try {
      const res = await resultCodeRequest(algoDetailRoomCode);
      // console.log(res);
      if (res.status === 200) {
        setResultCodes(res.data);
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        text: '배틀의 상세 결과를 가져오는데 오류가 발생했습니다',
      });
    }
  };
  const clickCode = (event: React.MouseEvent<HTMLElement>) => {
    const idx = event.currentTarget.getAttribute('id');
    setCodeId(parseInt(idx!));
  };

  return (
    <Wrapper>
      <Close onClick={handleModal} src="/img/close.png" alt="asdfasdf" />
      <Content>
        <h1 className="title">알고리즘 배틀 코드 리뷰</h1>
        <Select>
          {resultCodes?.map((code: ResultCodeInterface, index) => {
            if (code.userId === userInfo.id) {
              return (
                <div
                  className={
                    codeId == index ? 'select-item selected' : 'select-item'
                  }
                  id={index.toString()}
                  key={index}
                  onClick={clickCode}
                >
                  <p>나의 코드</p>
                </div>
              );
            } else {
              return (
                <div
                  className={
                    codeId == index ? 'select-item selected' : 'select-item'
                  }
                  id={index.toString()}
                  key={index}
                  onClick={clickCode}
                >
                  <p>누군가의 코드</p>
                </div>
              );
            }
          })}
        </Select>
        <SelectedCode>{resultCodes && resultCodes[codeId].code}</SelectedCode>
        {/* <SelectedCode>
        {resultCodes?.map((code: ResultCodeInterface, index) => {
          
          if (code.userId === userInfo.id) {
            return (
              <div className='item' key={index}>
                <p>나의 코드</p>
                <p>제출 언어 : {language[code.lan]}</p>
                <p>{code.code}</p>
              </div>
            );
          } else {
            return (
              <div className='item' key={index}>
                <p>누군가의 코드</p>
                <p>제출 언어 : {language[code.lan]}</p>
                <p>{code.code}</p>
              </div>
            );
          }
        })
        }
        </SelectedCode> */}
      </Content>
    </Wrapper>
  );
}
export default AlgoDetailInfo;
