import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { fetchFriends } from '../../../api/friendApi';
import { friendActions } from '../friendSlice';

import { AxiosResponse } from 'axios';
import { FriendInterface } from '../../../models/friend';

import FriendListItem from './FriendListItem';

function FriendListMange() {
  const dispatch = useDispatch();
  const { needReload } = useSelector((state: any) => state.friend);
  const [friendList, setFriendList] = useState<FriendInterface[]>([]);
  const fetchFriendList = async () => {
    try {
      const res: AxiosResponse = await fetchFriends();
      if (res.status === 200) {
        setFriendList(res.data);
      }
    } catch (error) {
      // console.log(error)
    }
  };

  useEffect(() => {
    fetchFriendList();
  }, []);
  useEffect(() => {
    if (needReload) {
      fetchFriendList();
      dispatch(friendActions.setNeedReload(false));
    }
  }, [needReload]);

  return (
    <>
      <h2>친구목록 관리</h2>
      {friendList.length > 0 &&
        friendList.map((friend: FriendInterface) => {
          return (
            <FriendListItem key={friend.id} friend={friend} type="manage" />
          );
        })}
    </>
  );
}
export default FriendListMange;
