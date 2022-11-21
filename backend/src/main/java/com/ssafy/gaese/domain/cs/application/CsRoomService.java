package com.ssafy.gaese.domain.cs.application;

import com.ssafy.gaese.domain.cs.dto.redis.CsRoomDto;
import com.ssafy.gaese.domain.cs.dto.CsSocketDto;
import com.ssafy.gaese.domain.cs.exception.AlreadyGameStartException;
import com.ssafy.gaese.domain.cs.exception.PlayAnotherGameException;
import com.ssafy.gaese.domain.cs.repository.CsRecordRedisRepository;
import com.ssafy.gaese.domain.user.dto.UserDto;
import com.ssafy.gaese.domain.cs.entity.CsProblem;
import com.ssafy.gaese.domain.cs.exception.ExceedMaxPlayerException;
import com.ssafy.gaese.domain.cs.exception.RoomNotFoundException;
import com.ssafy.gaese.domain.cs.repository.CsProblemRepository;
import com.ssafy.gaese.domain.cs.repository.CsRoomRedisRepository;
import com.ssafy.gaese.domain.user.entity.User;
import com.ssafy.gaese.domain.user.exception.UserNotFoundException;
import com.ssafy.gaese.domain.user.repository.UserRepository;
import com.ssafy.gaese.global.redis.SocketInfo;
import com.ssafy.gaese.global.util.RedisUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
@Log4j2
public class CsRoomService {

    private final RedisUtil redisUtil;
    private final CsRoomRedisRepository csRoomRedisRepository;
    private final CsRecordRedisRepository csRecordRedisRepository;

    private final UserRepository userRepository;
    private final CsProblemRepository csProblemRepository;

    private final CsService csService;

    private final SimpMessagingTemplate simpMessagingTemplate;

    private final SocketInfo socketInfo;

    private final int maxPlayer=10;
    private final int numProblem=6;

    private final String waitRoomKey="WaitRoom";


    public void enterOrLeave(CsSocketDto csSocketDto) throws InterruptedException {
        CsRoomDto roomDto=null;
        Map<String,Object> res = new HashMap<>();

        // 방 입장
        Long userId = csSocketDto.getUserId();
        User user = userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException());
        if(csSocketDto.getType() == CsSocketDto.Type.ENTER){
            // 다른 게임을 하고있는 중인지 확인
            if(socketInfo.isPlayGame(userId)){
                res.put("playAnotherGame", true);
                simpMessagingTemplate.convertAndSend("/cs/"+ userId,res);
//                res.clear();
//                res.put("errorMsg", "이미 게임을 진행 중입니다.");
                simpMessagingTemplate.convertAndSend("/friend/"+ userId,res);
                throw new PlayAnotherGameException(csSocketDto);
            }


            // 랜덤방 들어가기
            if (csSocketDto.getRoomType()!= CsSocketDto.RoomType.FRIEND) roomDto = enterRandomRoom(csSocketDto);
            // 친선전 들어가기
            else {
                // 방만들기
                if (csSocketDto.getRoomCode()==null){
                    roomDto = enterMyRoom(csSocketDto);
                }
                // 만들어져있는 방 들어가기기
               else{
                    roomDto = enterRoom(csSocketDto);
                }
            }

            res.put("msg", user.getNickname() + " 님이 접속하셨습니다.");

            socketInfo.setSocketInfo(csSocketDto.getSessionId(),
                    userId.toString(),
                    csSocketDto.getRoomCode(),
                    "Cs",
                    null);

            // 한개의 게임에만 접속할 수 있도록
            socketInfo.setOnlinePlayer(userId);
        }
        // 방 나가기
        else if(csSocketDto.getType() == CsSocketDto.Type.LEAVE){
            leaveRoom(csSocketDto);
            res.put("msg",user.getNickname()+" 님이 나가셨습니다.");
            simpMessagingTemplate.convertAndSend("/cs/room/"+csSocketDto.getRoomCode(),res);

            return;
        }
        // 방 전원에게 유저 출입 메시지전달
        simpMessagingTemplate.convertAndSend("/cs/room/"+roomDto.getCode(),res);

        // 방 코드를 개인에게 전달
        res.clear();
        res.put("room",roomDto.getCode());
        simpMessagingTemplate.convertAndSend("/cs/"+ userId,res);

//        Thread.sleep(1*1000);


        // 플레이어가 꽉 차면 게임 시작
        boolean isLast = isReadyToStart(roomDto);

        res.clear();
        res.put("isLast", isLast);
        simpMessagingTemplate.convertAndSend("/cs/"+ userId,res);
        

    }

    public void gameProcess(CsSocketDto csSocketDto) throws InterruptedException {
        CsRoomDto roomDto = csRoomRedisRepository.findById(csSocketDto.getRoomCode()).orElseThrow(()->new RoomNotFoundException(csSocketDto));
        // 문제 뽑아오기
        List<CsProblem> randomProblem = csProblemRepository.findRandomProblem(numProblem);

        Map<String,Object> res = new HashMap<>();
        // 방에 사람이 꽉차서 시작한다고 함
        res.clear();
        res.put("msg", "ready");

        // 시작됐다고 저장
        roomDto.setRoomStatus(CsRoomDto.RoomStatus.START);
        roomDto = csRoomRedisRepository.save(roomDto);

        simpMessagingTemplate.convertAndSend("/cs/room/"+roomDto.getCode(),res);

        Thread.sleep(5*1000);

        // 게임 시작했다고 클라이언트에게 알리기

        System.out.println("게임 시작");
//              게임 시작
        CsRoomDto saved = csService.gameStart(roomDto, randomProblem);
//            게임 끝
        csService.gameEnd(saved,randomProblem);

        // 방 삭제
        deleteRoom(saved.getCode());
    }

    // 방 생성
    // 해시로 저장
    public CsRoomDto createRoom(){

        CsRoomDto csRoomDto = CsRoomDto.create();
        csRoomDto.setRoomType(CsRoomDto.RoomType.RANDOM);

        CsRoomDto savedRoom = csRoomRedisRepository.save(csRoomDto);

        // 방만든 후에 대기 방에 넣음
        redisUtil.addSetData(waitRoomKey,savedRoom.getCode());

        return savedRoom;
    }

    //  랜덤 방 입장
    public CsRoomDto enterRandomRoom(CsSocketDto csSocketDto){
//        if (!redisUtil.isExists(waitRoomKey))
        List<String> waitRooms = new ArrayList<>(redisUtil.getSetData(waitRoomKey));
        Collections.shuffle(waitRooms);

        String roomIdToEnter = null;

        System.out.println("랜덤밤으로 들어감, 랜덤방 수"+waitRooms.size());

        for (String room:waitRooms){
            Optional<CsRoomDto> roomInfoOpt = csRoomRedisRepository.findById(room);

            // 방이 안찾아지면 다음으로
            if (roomInfoOpt.isEmpty()) continue;
            // 인원이 가득차면 다음으로

            CsRoomDto csRoom = roomInfoOpt.get();

            if (csRoom.getPlayers()==null)csRoom.setPlayers(new HashMap<>());
            HashMap<String, Long> players = csRoom.getPlayers();

            if (players.size()>=maxPlayer) continue;

            // 방이 가득 안찼으면 player에 추가하고 변경된 정보 저장
            roomIdToEnter = csRoom.getCode();
            break;
        }

        // 들어갈 곳이 없으면 새로운 방 생성
        if (roomIdToEnter==null){
            roomIdToEnter = createRoom().getCode();
        }

        log.debug("이 방으로 들어가요~"+roomIdToEnter);

        csSocketDto.setRoomCode(roomIdToEnter);

        CsRoomDto csRoomDto = enterRoom(csSocketDto);
        return csRoomDto;
    }

    // 친선전 방 만들기
    public CsRoomDto enterMyRoom(CsSocketDto csSocketDto) {
        CsRoomDto csRoomDto = CsRoomDto.create();
        csRoomDto.setRoomType(CsRoomDto.RoomType.FRIEND);

        // res 초기화
        Map<String,Object> res = new HashMap<>();
        res.put("master",true);

        // 해당 user가 반장
        Long userId = csSocketDto.getUserId();
        csRoomDto.setMaster(csSocketDto.getUserId());
        simpMessagingTemplate.convertAndSend("/cs/"+userId,res);

        // 들어갈 곳이 없으면 새로운 방 생성
        CsRoomDto savedRoom = csRoomRedisRepository.save(csRoomDto);

        csSocketDto.setRoomCode(savedRoom.getCode());

        csRoomDto = enterRoom(csSocketDto);
        return csRoomDto;
    }
    public void changeMaster(CsRoomDto csRoom){
        HashMap<String, Long> players = csRoom.getPlayers();
        Collection<Long> keys = players.values();
        Map<String,Object> res = new HashMap<>();

        // 반장이 될 사람
        Long nextMasterPlayerId = (Long) keys.toArray()[0];
        csRoom.setMaster(nextMasterPlayerId);
        csRoomRedisRepository.save(csRoom);

        // 반장이 바꼈다고 방전체한테 알리기
        User user = userRepository.findById(nextMasterPlayerId).orElseThrow(() -> new UserNotFoundException());
        res.put("msg",user.getNickname()+" 님이 반장이 되었습니다.");
        simpMessagingTemplate.convertAndSend("/cs/room/"+csRoom.getCode(),res);

        // res 초기화
        res.clear();
        res.put("master",true);

        simpMessagingTemplate.convertAndSend("/cs/"+nextMasterPlayerId,res);

    }
    // 친선전 방 입장
    public synchronized CsRoomDto enterRoom(CsSocketDto csSocketDto){
        System.out.println(csSocketDto.toString());
        CsRoomDto csRoom = csRoomRedisRepository.findById(csSocketDto.getRoomCode()).orElseThrow(()->new RoomNotFoundException(csSocketDto));

        if (csRoom.getRoomStatus()== CsRoomDto.RoomStatus.START) throw new AlreadyGameStartException(csSocketDto);

        if (csRoom.getPlayers()==null)csRoom.setPlayers(new HashMap<>());
        HashMap<String, Long> players = csRoom.getPlayers();

        // 방이 가득찼다면 예외 날림
        if (players.size()>=maxPlayer) throw new ExceedMaxPlayerException(csSocketDto);

        // 방이 가득 안찼으면 player에 추가하고 변경된 정보 저장
        players.put(csSocketDto.getSessionId(),csSocketDto.getUserId());

        CsRoomDto saved = csRoomRedisRepository.save(csRoom);

        return saved;
    }

    // 방 나가기
    public void leaveRoom(CsSocketDto csSocketDto){
        CsRoomDto csRoom = csRoomRedisRepository.findById(csSocketDto.getRoomCode()).orElseThrow(()->new RoomNotFoundException(csSocketDto));

        HashMap<String, Long> players = csRoom.getPlayers();
        players.remove(csSocketDto.getSessionId());

        // 바뀐 방 정보로 저장

        // 0명이면 삭제
        if (players.size()==0) {
            redisUtil.removeSetData(waitRoomKey,csRoom.getCode());
            deleteRoom(csRoom.getCode());
            return;
        }

        // 나간사람이 친선전의 반장이면 다음 사람한테 반장 위임
        if (csRoom.getRoomType()== CsRoomDto.RoomType.FRIEND&&
        csRoom.getMaster()==csSocketDto.getUserId()){
            changeMaster(csRoom);
        }

        CsRoomDto saved = csRoomRedisRepository.save(csRoom);
        getUserInRoom(saved.getCode());
//        return saved;
    }

    // 방 삭제 (게임 끝나면 방 삭제)
    public boolean deleteRoom(String roomId){
        csRoomRedisRepository.deleteById(roomId);

        return true;
    }

    public boolean deleteRecord(String roomCode,Long userId){
        csRecordRedisRepository.deleteById(roomCode+userId);

        return true;
    }

    // 방에 있는 유저리스트 정보 조회
    public void getUserInRoom(String roomId){
        System.out.println();
        CsRoomDto room = csRoomRedisRepository.findById(roomId).orElseThrow(()->new RoomNotFoundException());

        if (room.getPlayers()==null) return;

        List<UserDto> playerList = room.getPlayers().values().stream()
                .map(id->{
                    System.out.println("아이디 "+id);
                    return userRepository.findById(id).orElseThrow(()->new UserNotFoundException()).toDto();
                })
                .collect(Collectors.toList());




//        res.put("players",getUserInRoom(csRoom.getCode()));
        simpMessagingTemplate.convertAndSend("/cs/room/"+roomId,playerList);
    }

    public boolean isReadyToStart(CsRoomDto csRoom){

        HashMap<String, Long> players = csRoom.getPlayers();

        // 인원 안차면 시작 안함
        if (players.size()!=maxPlayer) return false;
        // 게임 시작하면 list에서 삭제
        redisUtil.removeSetData(waitRoomKey,csRoom.getCode());


        return true;
    }

}
