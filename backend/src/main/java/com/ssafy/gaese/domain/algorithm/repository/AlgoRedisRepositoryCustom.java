package com.ssafy.gaese.domain.algorithm.repository;

import com.ssafy.gaese.domain.algorithm.dto.AlgoRoomDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.ListOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.ssafy.gaese.global.util.SocketUtil.roomCodeMaker;

@Repository
public class AlgoRedisRepositoryCustom {

//    @Autowired
//    private RedisTemplate<String,AlgoRoomDto> redisAlgoTemplate;
    @Autowired
    private RedisTemplate<String,String> stringRedisTemplate;

    //  Room Code 생성
    public String createCode(){
        String code = "";
        while(true){
            code = roomCodeMaker();
            ListOperations<String,String> list = stringRedisTemplate.opsForList();

            List<String> codeList  = list.range("codes",0,-1);
            System.out.println(codeList.toString());
            if(codeList.contains(code)) continue;
            list.rightPush("codes",code);
            list.rightPush("algoCodes",code);
            break;
        }
        return code;
    }

    //  Room Code 삭제
    public Long deleteCode(String code){
        ListOperations<String,String > listOperations = stringRedisTemplate.opsForList();
        if(listOperations.remove("algoCodes",1,code) == 1 ){
            return listOperations.remove("codes",1,code);
        }
        return -1l;
    }

    //  생성된 방 list
    public List<AlgoRoomDto> getRooms(){

        List<String> roomCodeList = stringRedisTemplate.opsForList().range("algoCodes",0,-1);
        List<AlgoRoomDto> roomList = new ArrayList<>();

        for(String roomCode : roomCodeList){
            HashOperations<String,String,String > hashOperations = stringRedisTemplate.opsForHash();
            Map<String, String> map = hashOperations.entries(roomCode);
            AlgoRoomDto algoRoomDto = new AlgoRoomDto(map.get("code"),map.get("time")
                    ,map.get("tier"), map.get("num"));
            roomList.add(algoRoomDto);
        }
        return roomList;

    }

    // 방 생성
    public AlgoRoomDto createRoom(String code, AlgoRoomDto algoRoomDto){
        HashOperations<String, String, String > hashOperations = stringRedisTemplate.opsForHash();

        hashOperations.put(code,"code",code);
        hashOperations.put(code,"time", algoRoomDto.getTime());
        hashOperations.put(code,"tier",algoRoomDto.getTier());
        hashOperations.put(code,"num",algoRoomDto.getNum());

        Map<String, String> save = hashOperations.entries(code);
        AlgoRoomDto saved = new AlgoRoomDto(save.get("code"),save.get("time")
                ,save.get("tier"), save.get("num"));
        return saved;

    }

    //  방 입장
    public List<String> enterRoom(String code, String userId, String sessionId){
        HashOperations<String ,String,String > hashOperations = stringRedisTemplate.opsForHash();
        hashOperations.put(code+"user",userId,sessionId);

        return getUserInRoom(code);
    }

    // 방 나가기
    public List<String> leaveRoom(String code, String userId){
        HashOperations<String ,String, String > hashOperations = stringRedisTemplate.opsForHash();

        hashOperations.delete(code+"user",userId);
        hashOperations.increment(code,"num",-1);

        return getUserInRoom(code);
    }

    // 방 삭제
    public Long deleteRoom(String code){
        stringRedisTemplate.delete(code);
        stringRedisTemplate.delete(code+"user");
        return deleteCode(code);
    }

    public List<String> getUserInRoom(String code){
        HashOperations<String ,String,String > hashOperations = stringRedisTemplate.opsForHash();
        Map<String,String> list = hashOperations.entries(code+"user");
        List<String> users = new ArrayList<>();

        for (String key : list.keySet()) {
            users.add(key);
        }
        return users;
    }

}
