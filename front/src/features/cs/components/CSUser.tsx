import styled from 'styled-components';

const Wrapper = styled.div`
  /* border: 1px solid #fff; */
  width: 100%;
  margin: auto;
  .user-item {
    /* border: 1px solid #ffffff; */
  }

  .profile {
    height: 100px;
    width: 80px;
  }
  .nickname {
    font-size: 15px;
    width: fit-content;
    margin: 0 auto;
    background-color: #000;
    padding: 10px;
    border-radius: 1rem;
  }
  .score {
    font-size: 20px;
    margin: 6px 0 0 0;
  }

  .crown {
    margin: 0;
    img {
      width: 60px;
    }
  }
`;

function CSUser({ user, ranking }: any) {
  if (ranking) {
    console.log('ranking', ranking[user[0]]);
  }

  return (
    <Wrapper>
      <div className="user-item" key={user[0]}>
        <p className="nickname">{user[1]}</p>
        <p className="score">{user[3]} 점</p>
        {ranking && ranking[user[0]] == 1 ? (
          <p className="crown">
            <img src="/img/crown.png"></img>
          </p>
        ) : (
          <p></p>
        )}
        <img
          src={`${process.env.REACT_APP_S3_URL}/profile/${user[2]}_normal.gif`}
          alt="프로필이미지"
          className="profile"
        />
      </div>
    </Wrapper>
  );
}

export default CSUser;
