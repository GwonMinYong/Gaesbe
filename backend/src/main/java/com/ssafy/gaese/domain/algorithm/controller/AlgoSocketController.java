package com.ssafy.gaese.domain.algorithm.controller;

import com.ssafy.gaese.domain.algorithm.application.AlgoProblemService;
import com.ssafy.gaese.domain.algorithm.application.AlgoService;
import com.ssafy.gaese.domain.algorithm.application.AlgoSocketService;
import com.ssafy.gaese.domain.algorithm.dto.*;
import com.ssafy.gaese.domain.algorithm.dto.redis.AlgoRankDto;
import com.ssafy.gaese.domain.algorithm.dto.redis.AlgoRoomPassDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.RestController;

import java.text.ParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class AlgoSocketController {

    private final SimpMessagingTemplate simpMessagingTemplate; // broker로 메시지 전달
    private final AlgoService algoService;
    private final AlgoProblemService algoProblemService;
    private final AlgoSocketService algoSocketService;
    private final RedisTemplate redisTemplate;

    // 알고리즘 방 입장/나가기
    @MessageMapping("/algo")
    public void algoRoom(AlgoSocketDto algoSocketDto) throws Exception{

        Map<String,Object> res = new HashMap<>();
        System.out.println("===== 들어옴==== ");
        System.out.println(algoSocketDto.getType());

        if(algoSocketDto.getType() == AlgoSocketDto.Type.ENTER) {

            SetOperations<String ,String > setOperations = redisTemplate.opsForSet();
            if (algoService.enterRoom(algoSocketDto)) {


                res.put("playAnotherGame", false);
                res.put("msg", algoSocketDto.getNickname() + " 님이 접속하셨습니다.");
            }

        }
//        else if(algoSocketDto.getType() == AlgoSocketDto.Type.LEAVE){
//            algoService.leaveRoom(algoSocketDto);
//            res.put("msg",algoSocketDto.getUserId()+" 님이 나가셨습니다.");
//        }

        List<AlgoUserDto> users = algoService.getUsers(algoService.getUserIds(algoSocketDto.getRoomCode()));
        res.put("users",users);
        res.put("master", algoService.getMaster(algoSocketDto.getRoomCode()));
        simpMessagingTemplate.convertAndSend("/algo/room/"+algoSocketDto.getRoomCode(),res);
    }
    
    // 문제 선택 시작, timer 시작, no : 0 전송 , AlgoRoomPassDto 저장
    /*
    입장 시, start 인지 확인, start로 변경
     */
    @MessageMapping("/algo/start/pass")
    public void algoPassTimer(AlgoProblemReq algoProblemReq) throws Exception{
        HashMap<String, Object> res = new HashMap<>();
        res.put("type","START");
        // 방 시작 상태로 변경
        algoProblemService.setStartGame(algoProblemReq.getRoomCode());
        // 문제 전송 중임을 알림
        simpMessagingTemplate.convertAndSend("/algo/start/pass/"+algoProblemReq.getRoomCode(),res);
        algoSocketService.createAlgoRoomPass(algoProblemReq.getRoomCode());

        res.clear();
        // 문제 전송
        res.put("type","PROBLEM");
        res.put("no",0);
        res.put("master",algoService.getMaster(algoProblemReq.getRoomCode()));
        res.put("problems",algoProblemService.getCommonProblems(algoProblemReq));
        simpMessagingTemplate.convertAndSend("/algo/start/pass/"+algoProblemReq.getRoomCode(),res);
    }
    
    // pass 눌렀을 때
    @MessageMapping("/algo/pass")
    public void algoPass(AlgoRoomCodeDto algoRoomCodeDto){
        System.out.println("[controller] pass 누름");
        if(!algoSocketService.getRoomPass(algoRoomCodeDto.getRoomCode()).isPass())
            algoSocketService.setProblemPass(algoRoomCodeDto.getRoomCode());

       }

    
    // timer 시작, 종료시 pass 상태 확인 후 PASS or START 전송
    @MessageMapping("/algo/timer")
    public void algoPassTimerTest(AlgoRoomCodeDto roomCodeDto ) throws Exception{

        System.out.println("timer 시작");
        Thread.sleep(1000*10);
        // Pass 했는지 확인
        AlgoRoomPassDto algoRoomPassDto = algoSocketService.getRoomPass(roomCodeDto.getRoomCode());
        if(algoRoomPassDto.isPass()){ // pass

            //다음 문제로 넘기고, pass false 로
            algoSocketService.setProblemNo(roomCodeDto.getRoomCode());

            HashMap<String, Object> res = new HashMap<>();
            res.put("type","PASS");
            res.put("no",algoSocketService.getRoomPass(roomCodeDto.getRoomCode()).getNowNo());
            res.put("master",algoService.getMaster(roomCodeDto.getRoomCode()));
            simpMessagingTemplate.convertAndSend("/algo/pass/"+roomCodeDto.getRoomCode(),res);
        }else{
            System.out.println("========= 문제 풀이 시작 ========= ");

            //문제 풀이 시작 > 시작 시간 저장
            algoProblemService.saveTime(roomCodeDto.getRoomCode());

            HashMap<String, Object> res = new HashMap<>();
            res.put("type","START");
            res.put("no",algoSocketService.getRoomPass(roomCodeDto.getRoomCode()).getNowNo());
            simpMessagingTemplate.convertAndSend("/algo/problem/"+roomCodeDto.getRoomCode(),res);

            Long time = algoSocketService.getTime(roomCodeDto.getRoomCode());

            Thread.sleep(1000*60*time);

            // 끝나면 랭킹 전송

            res = new HashMap<>();
            res.put("type","FINISH");
            res.put("ranking",algoSocketService.getCurrentRank(roomCodeDto.getRoomCode()));
            simpMessagingTemplate.convertAndSend("/algo/problem/"+roomCodeDto.getRoomCode(),res);
        }
    }

    @MessageMapping("/algo/startGame")
    public void startGame(AlgoRoomDto algoRoomDto){

    }

    @MessageMapping("/algo/rank")
    public void getRank(AlgoRoomDto algoRoomDto) throws ParseException {

        HashMap<String, Object> res = new HashMap<>();
        List<AlgoRankDto> ranking = algoSocketService.getCurrentRank(algoRoomDto.getRoomCode());
        res.put("ranking", ranking);
        simpMessagingTemplate.convertAndSend("/algo/rank/" + algoRoomDto.getRoomCode(), res);


    }

}
