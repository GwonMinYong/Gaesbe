package com.ssafy.gaese.domain.friends.application;

import com.ssafy.gaese.domain.friends.dto.FriendDto;
import com.ssafy.gaese.domain.friends.dto.FriendRequestDto;
import com.ssafy.gaese.domain.friends.entity.FriendRequest;
import com.ssafy.gaese.domain.friends.entity.Friends;
import com.ssafy.gaese.domain.friends.exception.AlreadyFriendException;
import com.ssafy.gaese.domain.friends.exception.AlreadyFriendReqToMeException;
import com.ssafy.gaese.domain.friends.exception.AlreadyFriendRequestException;
import com.ssafy.gaese.domain.friends.repository.FriendRepository;
import com.ssafy.gaese.domain.friends.repository.FriendRequestRepository;
import com.ssafy.gaese.domain.user.entity.User;
import com.ssafy.gaese.domain.friends.exception.ReqToMeException;
import com.ssafy.gaese.domain.user.exception.UserNotFoundException;
import com.ssafy.gaese.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class FriendService {

    private final FriendRepository friendRepository;
    private final FriendRequestRepository friendRequestRepository;
    private final UserRepository userRepository;

    private final SimpMessagingTemplate simpMessagingTemplate;
    public boolean requestFriend(Long userId, String targetNickname) throws NullPointerException{

        User targetUser = userRepository.findByNickname(targetNickname).orElseThrow(()->new UserNotFoundException());

        User user = userRepository.findById(userId)
                .orElseThrow(()->new UserNotFoundException());

        System.out.println("타겟 친구 요청"+targetUser.getId()+""+user.getId());
        if (targetUser.getId().equals(user.getId())) throw new ReqToMeException();

        // 친구 상태인지 확인
        User firstuser = null;
        User seconduser = null;

        if(userId > targetUser.getId()){
            firstuser = user;
            seconduser = targetUser;
        } else {
            firstuser = targetUser;
            seconduser = user;
        }

        if(friendRepository.existsByFirstUserAndSecondUser(firstuser,seconduser)) throw new AlreadyFriendException();

        // 이미 요청을 했으면
        if(friendRequestRepository.existsByRequestUserAndTargetUser(user,targetUser)){
            throw new AlreadyFriendRequestException();
        }
        // 이미 상대가 요청을 했으면
        else if(friendRequestRepository.existsByRequestUserAndTargetUser(targetUser,user)) {
            throw new AlreadyFriendReqToMeException();
        } else{
            FriendRequest friendRequest = FriendRequest.builder()
                    .targetUser(targetUser)
                    .requestUser(user)
                    .createdDate(new Date())
                    .build();
            friendRequestRepository.save(friendRequest);
            //친구 신청이 왔다고  알람 보내는 부분
            friendAlarm(targetUser.getId(),true);
        }

        return true;
    }

    public List<FriendRequestDto> getRequestFriend(Long userId) throws NullPointerException{
        User user = userRepository.findById(userId)
                .orElseThrow(()->new UserNotFoundException());
        List<FriendRequestDto> friendRequestList = friendRequestRepository
                .findByTargetUser(user).stream()
                .map(FriendRequest::toDto)
                .collect(Collectors.toList());

        if(friendRequestList.size()>0)
        {
            System.out.println("친구 신청 알람 보내기 전 리스트 사이즈 체크");
            System.out.println(friendRequestList.size());
            friendAlarm(userId, true);
            
        }

        return friendRequestList;
    }


    public List<FriendDto> getFriends(Long userId){
        User user = userRepository.findById(userId)
                .orElseThrow(()->new UserNotFoundException());

        List<Friends> friendsByFirstUser = friendRepository.findByFirstUser(user);
        List<Friends> friendsBySecondUser = friendRepository.findBySecondUser(user);

        // 전체 친구 리스트
        List<User> friendUsers = new ArrayList<>();


        for (Friends friend : friendsByFirstUser) {
            friendUsers.add(userRepository.findById(friend.getSecondUser()
                            .getId())
                    .orElseThrow(()->new UserNotFoundException()));
        }
        for (Friends friend : friendsBySecondUser) {
            friendUsers.add(userRepository.findById(friend.getFirstUser()
                            .getId())
                    .orElseThrow(()->new UserNotFoundException()));
        }
        return friendUsers.stream().map(User::toFriendDto).collect(Collectors.toList());

    }

    public List<FriendRequestDto> delRequest(Long userId, Long reqId){
        User user = userRepository.findById(userId)
                .orElseThrow(()->new UserNotFoundException());



        friendRequestRepository.deleteById(reqId);


        int findByRequestCount = friendRequestRepository.findByTargetUser(user).size();
        System.out.println("친구 저장한 후 "+findByRequestCount);
        if(findByRequestCount==0)
            friendAlarm(userId,false);
        else
            friendAlarm(userId,true);

        System.out.println("친구 거절 후 남은 수 목록 체크");
        System.out.println(findByRequestCount);

        return getRequestFriend(userId);
    }


    //해당 유저가 친구 신청이 남아 있으면 알람을 보냄
//    public void friendRequestChecker(Long userId)
//    {
//        User user = userRepository.findById(userId)
//                .orElseThrow(()->new UserNotFoundException());
//
//        if(friendRequestRepository.findByTargetUser(user)!=null)
//        {
//            friendAlarm(user.getId(), true);
//        }
//
//    }
//

    //친구 신청시 친구에게 알람 보냄
    public void friendAlarm(Long userId, boolean alarm)
    {
        HashMap<String, Object> res = new HashMap<>();

        res.put("alarm",alarm);

        simpMessagingTemplate.convertAndSend("/friend/"+userId,res);
    }
}