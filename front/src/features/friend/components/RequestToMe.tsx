import { useEffect, useState } from 'react';
import { requestToMeList } from '../../../api/friendApi';

import { useDispatch } from 'react-redux';
import { friendActions } from '../friendSlice';
import { FriendInterface } from '../../../models/friend';
import RequestToMeItem from './RequestToMeItem';

import styled from 'styled-components';

interface RequestList {
  friendReqId: number;
  requestUser: FriendInterface;
}

const Wrapper = styled.div`
  height: 100%;
  div {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
  }
  .img {
    position: absolute;
    right: 4%;
    :hover {
      cursor: url('/img/cursor/hover_cursor.png'), auto;
      transform: scale(1.05);
    }
  }
  .title {
    width: 80%;
    border: 5px solid #000;
    background-color: #ffc400;
    border-radius: 20px;
    color: #000;
    position: relative;
    height: 10%;
    text-align: center;
    font-size: 2rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 1rem 0;
    margin-top: 2rem;
  }
`;

function RequestToMe() {
  const dispatch = useDispatch();
  const [requestList, setRequestList] = useState<RequestList[]>([]);
  const fetchRequestToMe = async () => {
    try {
      const res = await requestToMeList();
      if (res.status === 200) {
        setRequestList(res.data);
      }
    } catch (error) {
      // console.log(error);
    }
  };

  useEffect(() => {
    fetchRequestToMe();
  }, []);
  const handleSecondModal = () => {
    dispatch(friendActions.handleSecondModal());
  };
  return (
    <Wrapper>
      <img
        className="img"
        onClick={handleSecondModal}
        src="/img/close.png"
        alt=""
      />
      <div>
        <div className="title">친구 요청 목록</div>
      </div>
      {requestList.length > 0 ? (
        <>
          {requestList.map((requestListItem: RequestList) => {
            return (
              <RequestToMeItem
                key={requestListItem.friendReqId}
                requestListItem={requestListItem}
                fetchRequestToMe={fetchRequestToMe}
              />
            );
          })}
        </>
      ) : (
        <h2>친구요청이 없습니다</h2>
      )}
    </Wrapper>
  );
}
export default RequestToMe;
