import { requestToMeDelete, requestToMeAccept } from '../../../api/friendApi';

import styled from 'styled-components';

const Wrapper = styled.div`
  border: 3px solid #000000;
  background-color: #fff;
  border-radius: 20px;
  color: #000;
  display: flex;
  justify-content: space-around;
  margin: 3% auto;

  .circle {
    margin: auto 0;
    background-color: #b392ff;
    width: 50px;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 5rem;
  }
  .nickname {
    margin: auto 0;
    font-size: 1.2rem;
  }
  .profile {
    width: 30px;
  }

  .btn-div {
    width: 30%;
    display: flex;
    justify-content: space-around;
  }
  .btn-div button {
    width: 40%;
    height: 70%;
    margin: auto;
    border: 3px solid #000;
    box-shadow: 1px 1px #000;
    border-radius: 10px;
    :hover {
      cursor: url('/img/cursor/hover_cursor.png'), auto;
      background: #ffffff;
    }
  }
`;

function RequestToMeItem({ requestListItem, fetchRequestToMe }: any) {
  const requestDelete = async () => {
    try {
      const res = await requestToMeDelete(requestListItem.friendReqId);
      if (res.status === 200) {
        fetchRequestToMe();
      }
    } catch (error) {
      // console.log(error);
    }
  };

  const requestAccept = async () => {
    try {
      const res = await requestToMeAccept(requestListItem.requestUser.id);
      if (res.status === 200) {
        fetchRequestToMe();
      }
    } catch (error) {
      // console.log(error);
    }
  };

  return (
    <Wrapper>
      <div className="circle">
        <img
          className="profile"
          src={`${process.env.REACT_APP_S3_URL}/profile/${requestListItem.requestUser.profileChar}_normal.gif`}
        />
      </div>

      <div className="nickname">{requestListItem.requestUser.nickname}</div>
      <div className="btn-div">
        <button onClick={requestAccept}>수락</button>
        <button onClick={requestDelete}>거절</button>
      </div>
    </Wrapper>
  );
}
export default RequestToMeItem;
