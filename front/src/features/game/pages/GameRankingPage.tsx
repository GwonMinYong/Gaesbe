import { useEffect, useState } from 'react';
import { allGameRankingRequest } from '../../../api/gameApi';
import RankingInfo from '../components/RankingInfo';
import { RankerInfoInterface } from '../../../models/user';
import Swal from 'sweetalert2';
import styled from 'styled-components';

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  color: white;
`;
const MainHeader = styled.div`
  font-size: 1.5rem;
  width: 100%;
  height: 10%;
  display: flex;
  justify-content: center;
  align-items: center;
  /* border: 2px solid red; */
`;
const MyRankingBlock = styled.div`
  width: 100%;
  height: 20%;
  /* border: 2px solid blue; */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;
const MyRankingHeader = styled.div`
  display: flex;
  width: 90%;
  height: 30%;
  /* border: 2px solid white; */
  .img {
    width: 3%;
    height: 3%;
    position: absolute;
    left: 26%;
    top: 9%;
  }
`;
const MyRankingBody = styled.div`
  width: 70%;
  height: 70%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  /* border: 2px solid yellow; */
`;
const MyRankingList = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  /* border: 2px solid purple; */
  div {
    height: 50%;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding-left: 1rem;
    h1 {
      font-size: 5rem;
    }
    div {
      font-size: 2rem;
    }
  }
`;
const AllRankingBlock = styled.div`
  width: 100%;
  height: 70%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  /* border: 2px solid orange; */
`;
const AllRankingHeader = styled.div`
  display: flex;
  width: 90%;
  height: 15%;
  .img {
    width: 3%;
    height: 3%;
    position: absolute;
    left: 27%;
    top: 29%;
  }
  /* border: 2px solid white; */
`;
const AllRankingList = styled.div`
  width: 100%;
  height: 85%;

  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  /* border: 2px solid purple; */
`;
function GameRankingPage() {
  const [myRank, setMyRank] = useState<{
    myAlgoRank: number;
    myCsRank: number;
    myLuckRank: number;
    myTypingRank: number;
  } | null>(null);
  const [nowGame, setNowGame] = useState<string>('algo');
  const [algoRankers, setAlgoRankers] = useState<RankerInfoInterface[]>([]);
  const [CSRankers, setCSRankers] = useState<RankerInfoInterface[]>([]);
  const [luckRankers, setLuckRankers] = useState<RankerInfoInterface[]>([]);
  const [typingRankers, setTypingRankers] = useState<RankerInfoInterface[]>([]);

  useEffect(() => {
    fetchAllGameRanking();
  }, []);
  const fetchAllGameRanking = async () => {
    try {
      const res = await allGameRankingRequest();
      // console.log(res);
      if (res.status === 200) {
        setMyRank({
          myAlgoRank: res.data.myAlgoRank,
          myCsRank: res.data.myCsRank,
          myLuckRank: res.data.myLuckRank,
          myTypingRank: res.data.myTypingRank,
        });
        setAlgoRankers(res.data.algo);
        setCSRankers(res.data.cs);
        setLuckRankers(res.data.luck);
        setTypingRankers(res.data.typing);
      }
    } catch (error) {
      Swal.fire({
        icon: 'warning',
        text: '??????????????? ??????????????? ????????? ???????????? ?????? ??? ?????? ????????? ?????????',
      });
    }
  };
  return (
    <Wrapper>
      <MainHeader>
        <h1>????????????? ????????? ??????????</h1>
      </MainHeader>
      <MyRankingBlock>
        <MyRankingHeader>
          <img className="img" src="/img/crown.png" alt="asdfasdfasdf" />
          <h2>?????? ??????</h2>
        </MyRankingHeader>
        <MyRankingBody>
          <MyRankingList>
            <h3>????????????</h3>
            <div>
              <h1>{myRank?.myAlgoRank}</h1>
              <div>???</div>
            </div>
          </MyRankingList>
          <MyRankingList>
            <h3>CS ??????</h3>
            <div>
              <h1>{myRank?.myCsRank}</h1>
              <div>???</div>
            </div>
          </MyRankingList>
          <MyRankingList>
            <h3>????????????</h3>
            <div>
              <h1>{myRank?.myTypingRank}</h1>
              <div>???</div>
            </div>
          </MyRankingList>
          <MyRankingList>
            <h3>????????????</h3>
            <div>
              <h1>{myRank?.myLuckRank}</h1>
              <div>???</div>
            </div>
          </MyRankingList>
        </MyRankingBody>
      </MyRankingBlock>
      <AllRankingBlock>
        <AllRankingHeader>
          <img className="img" src="/img/crown.png" alt="asdfasdfasdf" />
          <h2>?????? TOP 5</h2>
        </AllRankingHeader>
        <AllRankingList>
          <RankingInfo type={'????????????'} rankersInfo={algoRankers} />
          <RankingInfo type={'CS ??????'} rankersInfo={CSRankers} />
          <RankingInfo type={'????????????'} rankersInfo={typingRankers} />
          <RankingInfo type={'????????????'} rankersInfo={luckRankers} />
        </AllRankingList>
      </AllRankingBlock>
      {/* <h1>????????? ?????? ?????????</h1>
      <div className="myRankDiv">
        <div>
          <h3>????????????</h3>
          <h3>{myRank?.myAlgoRank}???</h3>
        </div>
        <div>
          <h3>cs ??????</h3>
          <h3>{myRank?.myCsRank}???</h3>
        </div>
        <div>
          <h3>?????? ??????</h3>
          <h3>{myRank?.myTypingRank}???</h3>
        </div>
        <div>
          <h3>?????? ??????</h3>
          <h3>{myRank?.myLuckRank}???</h3>
        </div>
      </div>
      <div onClick={() => setNowGame('algo')}>????????????</div>
      <div onClick={() => setNowGame('cs')}>CS ??????</div>
      <div onClick={() => setNowGame('typing')}>?????? ??????</div>
      <div onClick={() => setNowGame('casino')}>?????? ??????</div>
      {nowGame === 'algo' && (
        <RankingInfo type={nowGame} rankersInfo={algoRankers} />
      )}
      {nowGame === 'cs' && (
        <RankingInfo type={nowGame} rankersInfo={CSRankers} />
      )}
      {nowGame === 'typing' && (
        <RankingInfo type={nowGame} rankersInfo={typingRankers} />
      )}
      {nowGame === 'casino' && (
        <RankingInfo type={nowGame} rankersInfo={luckRankers} />
      )} */}
    </Wrapper>
  );
}
export default GameRankingPage;
