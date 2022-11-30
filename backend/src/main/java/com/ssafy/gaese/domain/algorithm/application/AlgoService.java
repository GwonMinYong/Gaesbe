package com.ssafy.gaese.domain.algorithm.application;

import com.ssafy.gaese.domain.algorithm.dto.*;
import com.ssafy.gaese.domain.algorithm.dto.redis.AlgoRankDto;
import com.ssafy.gaese.domain.algorithm.dto.redis.AlgoRoomPassDto;
import com.ssafy.gaese.domain.algorithm.dto.redis.AlgoRoomRedisDto;
import com.ssafy.gaese.domain.algorithm.entity.AlgoRecord;
import com.ssafy.gaese.domain.algorithm.repository.*;
import com.ssafy.gaese.domain.friends.application.FriendSocketService;
import com.ssafy.gaese.domain.user.application.ItemService;
import com.ssafy.gaese.domain.user.entity.Ability;
import com.ssafy.gaese.domain.user.entity.User;
import com.ssafy.gaese.domain.user.entity.item.Characters;
import com.ssafy.gaese.domain.user.entity.item.UserCharacter;
import com.ssafy.gaese.domain.user.exception.UserNotFoundException;
import com.ssafy.gaese.domain.user.repository.AbilityRepository;
import com.ssafy.gaese.domain.user.repository.UserRepository;
import com.ssafy.gaese.domain.user.repository.item.CharacterRepository;
import com.ssafy.gaese.domain.user.repository.item.UserCharacterRepository;
import com.ssafy.gaese.global.redis.SocketInfo;
import io.github.bonigarcia.wdm.WebDriverManager;
import lombok.RequiredArgsConstructor;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlgoService {

    private final AlgoRepository algoRepository;
    private final UserRepository userRepository;
    private final AlgoRedisRepository algoRedisRepository;
    private final AlgoRedisRepositoryCustom algoRedisRepositoryCustom;
    private final AlgoRankRedisRepository algoRankRedisRepository;
    private final AlgoRoomPassRepository algoRoomPassRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final SocketInfo socketInfo;
    private final SimpMessagingTemplate simpMessagingTemplate;
    private final AlgoSocketService algoSocketService;
    private final AbilityRepository abilityRepository;
    static ChromeDriver driver = null;


    private final ItemService itemService;

    private final FriendSocketService friendSocketService;

    private final UserCharacterRepository userCharacterRepository;

    private final CharacterRepository characterRepository;

    @Transactional
    public AlgoRecordDto createAlgoRecord(AlgoRecordReq algoRecordReq, Long userId){
        User user = userRepository.findById(userId).orElseThrow(()->new UserNotFoundException());
        Date date = new Date();
        AlgoRecordDto algoRecordDto = null;
        // roomCode, min, nickName, userId
        Optional<AlgoRankDto> opt = algoRankRedisRepository.findById(userId);
        if(opt.isPresent()){
            AlgoRankDto algoRankDto = opt.get();
            algoRecordDto = AlgoRecordDto.builder()
                    .isSolve(true)
                    .roomCode(algoRecordReq.getRoomCode())
                    .userId(userId)
                    .date(date)
                    .code(algoRecordReq.getCode())
                    .isRetry(false)
                    .problemId(algoRankDto.getProblemId())
                    .ranking(algoRecordReq.getRanking())
                    .solveTime(algoRankDto.getMin()+"")
                    .lan(algoRecordReq.getLanId())
                    .build();
            algoRankRedisRepository.delete(algoRankDto);
        }else{
            algoRecordDto = AlgoRecordDto.builder()
                    .isSolve(false)
                    .roomCode(algoRecordReq.getRoomCode())
                    .userId(userId)
                    .date(date)
                    .code(algoRecordReq.getCode())
                    .isRetry(false)
                    .problemId(algoRecordReq.getProblemId())
                    .ranking(algoRecordReq.getRanking())
                    .lan(algoRecordReq.getLanId())
                    .solveTime("-")
                    .build();
        }
        algoRepository.save(algoRecordDto.toEntity(user));
        Ability ability = abilityRepository.findByUser_Id(userId).get();
        ability.addExp("algorithm", 1);


        charChecker(user.getId());

        return algoRecordDto;
    }

    public Page<AlgoRecordDto> recordList(Pageable pageable, Long userId){
        System.out.println("서비스");
        User user = userRepository.findById(userId).orElseThrow(()->new UserNotFoundException());
        Page<AlgoRecord> algoRecords = algoRepository.findByUser(user, pageable);
        return algoRecords.map(algoRecord -> algoRecord.toDto());
    }

    public HashMap<String,List<AlgoRoomDto>> getRooms(){

        HashMap<String,List<AlgoRoomDto>> res = new HashMap<>();
        List<AlgoRoomDto> waitRoomList = new ArrayList<>();
        List<AlgoRoomDto> startRoomList = new ArrayList<>();

        Iterable<AlgoRoomRedisDto> algoRoomRedisDtos = algoRedisRepositoryCustom.getRooms();

        for(AlgoRoomRedisDto algoRoomRedisDto : algoRoomRedisDtos) {
             if(algoRoomRedisDto.getAlgoRoomDto().isStart()){
                startRoomList.add(algoRoomRedisDto.toDto());
            }else{
                waitRoomList.add(algoRoomRedisDto.toDto());
            }
        }

        res.put("start",startRoomList);
        res.put("wait",waitRoomList);

        return res;
    }

    public boolean enterRoom(AlgoSocketDto algoSocketDto) {

        String enterUser = String.valueOf(algoSocketDto.getUserId());

        userRepository.findById(Long.parseLong(enterUser)).orElseThrow(()->new UserNotFoundException());

        List<String> userInRoom = algoRedisRepositoryCustom.getUserInRoom(algoSocketDto.getRoomCode());

        if (enterUser != null && userInRoom.contains(enterUser)) {
            return false;
        } else {
            algoRedisRepositoryCustom.enterRoom(algoSocketDto);
            //session 정보 저장
            socketInfo.setSocketInfo(algoSocketDto.getSessionId(),
                    String.valueOf(algoSocketDto.getUserId()),
                    algoSocketDto.getRoomCode(),
                    "Algo",
                    algoSocketDto.getNickname());
            // 한개의 게임에만 접속할 수 있도록
            socketInfo.setOnlinePlayer(Long.parseLong(String.valueOf(algoSocketDto.getUserId())));
            return true;
        }
    }

    public AlgoRoomDto createRoom(AlgoRoomDto algoRoomDto){

        String code = algoRedisRepositoryCustom.createCode();
        return algoRedisRepositoryCustom.createRoom(algoRoomDto.toRedisDto(code));
    }

    public void leaveRoom(AlgoSocketDto algoSocketDto,String userId){
        System.out.println(algoSocketDto.getSessionId() + "나간다");
        HashOperations<String ,String, String > hashOperations = redisTemplate.opsForHash();
        User user = userRepository.findById(Long.parseLong(userId)).orElseThrow(()->new UserNotFoundException());


        AlgoRoomRedisDto algoRoomRedisDto = algoRedisRepository.findById(algoSocketDto.getRoomCode()).orElseThrow(()->new NoSuchElementException());
        HashMap<String, Object> res = new HashMap<>();
        algoRedisRepositoryCustom.leaveRoom(algoSocketDto);
        // 방장이 나갔는지 확인
        if(algoRoomRedisDto.getAlgoRoomDto().getMaster().equals(algoSocketDto.getUserId())){
            
            if(changeMaster(algoSocketDto.getRoomCode())){
                System.out.println("마스터 변경");
            }else{
                deleteRoom(algoSocketDto.getRoomCode());
                // 방 유저 정보 삭제
                algoRedisRepositoryCustom.deleteRoomUser(algoRoomRedisDto,user.getBjId());
                return;
            }
        }

        if(getUserIds(algoSocketDto.getRoomCode()).size()==0){
            deleteRoom(algoSocketDto.getRoomCode());
            // 방 유저 정보 삭제
            algoRedisRepositoryCustom.deleteRoomUser(algoRoomRedisDto,user.getBjId());
            return;
        }

        res = new HashMap<>();
        res.put("msg",algoSocketDto.getNickname()+" 님이 나가셨습니다.");

        List<AlgoUserDto> users = getUsers(getUserIds(algoSocketDto.getRoomCode()));
        res.put("users",users);
        res.put("master", getMaster(algoSocketDto.getRoomCode()));

        simpMessagingTemplate.convertAndSend("/algo/room/"+algoSocketDto.getRoomCode(),res);

    }


    public String getMaster(String roomCode){
        Optional<AlgoRoomRedisDto> opt = algoRedisRepository.findById(roomCode);
        if(opt.isPresent()){
            AlgoRoomRedisDto algoRoomRedisDto = opt.get();
            return algoRoomRedisDto.getAlgoRoomDto().getMaster();
        }else{
            return null;
        }
    }
    public boolean changeMaster(String roomCode){
        List<String> userIds = algoRedisRepositoryCustom.getUserInRoom(roomCode);
        if(userIds.size()==0) {
            return false;
        }
        AlgoRoomRedisDto algoRoomRedisDto = algoRedisRepository.findById(roomCode).orElseThrow(()->new NoSuchElementException());
        algoRoomRedisDto.getAlgoRoomDto().changeMaster(userIds.get(0));
        algoRedisRepository.save(algoRoomRedisDto);
        return true;
    }

    public void deleteRoom(String code){
        HashOperations<String,String,String>hashOperations = redisTemplate.opsForHash();
        ZSetOperations<String, String> zSetOperations = redisTemplate.opsForZSet();
        SetOperations<String, String> setOperations = redisTemplate.opsForSet();

        //시작했다면
        String startTime = hashOperations.get(code, "startTime");
        if(startTime != null ){
            // pass 정보 삭제
            AlgoRoomPassDto algoRoomPassDto  = algoRoomPassRepository.findById(code).orElseThrow(()-> new NoSuchElementException());
            algoRoomPassRepository.delete(algoRoomPassDto);
        }

        AlgoRoomRedisDto algoRoomRedisDto = algoRedisRepository.findById(code).orElseThrow(()->new NoSuchElementException());
        // 방 삭제
        algoRedisRepository.delete(algoRoomRedisDto);
        // 방 시작 정보 삭제
        redisTemplate.delete(algoRoomRedisDto.getRoomCode());
        // 랭킹 정보 삭제
        zSetOperations.removeRange(code+"-rank",0,-1);

    }

    public int confirmRoomEnter(String roomCode, Long userId){
        if(socketInfo.isPlayGame(userId)) return 0;
        if(algoRedisRepositoryCustom.getRoomNum(roomCode) >= 4) return -1;
        if(algoRedisRepository.findById(roomCode).get().getAlgoRoomDto().isStart()) return -2;
        return 1;
    }

    public List<String> getUserIds(String roomCode){
        return algoRedisRepositoryCustom.getUserInRoom(roomCode);
    }
    public List<AlgoUserDto> getUsers(List<String> userIds){
        return userRepository.findUsersByIds(userIds.stream().map(id->Long.parseLong(id)).collect(Collectors.toList())).stream().map(
                user -> user.toAlgoDto()).collect(Collectors.toList());
    }


    public String checkBjId(Long userId){
        Optional<String> opt = userRepository.getBjIdById(userId);
        if(opt.isPresent()){
            return opt.get();
        }
        return null;
    }

    public String createCode(Long userId){
        String code = algoRedisRepositoryCustom.createCode();
        HashOperations<String, String,String> hashOperations = redisTemplate.opsForHash();
        hashOperations.put("bjCodes",userId+"",code);

        return code;
    }

    public int getFirstCnt(Long userId){
        User user = userRepository.findById(userId).orElseThrow(()->new UserNotFoundException());
        int cnt = algoRepository.countFirstRank(user);
        return cnt;
    }

    public List<AlgoRecordCodeDto> getAllCodes(String roomCode){
        return algoRepository.getAllCode(roomCode).stream().map(
                                        record -> record.toCodeDto()
                                ).collect(Collectors.toList());

    }

    public Boolean confirmCode(Long userId, String bjId){
        HashOperations<String, String,String> hashOperations = redisTemplate.opsForHash();
        String code = hashOperations.get("bjCodes",userId+"");
        Boolean res = false;

        try{
            WebDriverManager.chromedriver().setup();
            ChromeOptions chromeOptions = new ChromeOptions();
            chromeOptions.addArguments("--no-sandbox");
            chromeOptions.addArguments("--headless");
            chromeOptions.addArguments("disable-gpu");
            chromeOptions.addArguments("--disable-dev-shm-usage");
            driver = new ChromeDriver(chromeOptions);
            // 크롤링
            driver.get("https://www.acmicpc.net/user/"+bjId);
            WebElement element = driver.findElement(By.className("no-mathjax"));
            String msg = element.getText();
            if(msg.contains(code)){

                if(userRepository.updateBjId(userId,bjId)==1){
                    res = true;
                }
                hashOperations.delete("bjCodes", userId+"");
            }
        }catch (Exception e){
            System.out.println("크롤링 중 에러 발생");
            System.out.println(e.getMessage());
        }finally {
            driver.quit();
        }
        return res;
    }



    void charChecker(Long userid)
    {
        User user = userRepository.findById(userid).get();

        List<AlgoRecord> algoRecords = algoRepository.findAllByUser(user);
        ArrayList<Characters> characterArr = (ArrayList<Characters>) characterRepository.findAll();
        Map<Long,Characters> characters = new HashMap<>();
        for (Characters c:characterArr) {
            characters.put(c.getId(),c);
        }

        int algoCount=0;
        int oneCount=0;

        for (AlgoRecord algoRecord:algoRecords)
        {
            if(algoRecord.getRanking()<2)
            {
                oneCount++;
            }
            algoCount++;
        }

        long charId=21;
        if(oneCount>0 && !userCharacterRepository.findByUserAndCharacters(user,characters.get(charId)).isPresent())
        {
            userCharacterSet(user,charId,characters);
        }
        charId=20;
        if(algoCount>2 && !userCharacterRepository.findByUserAndCharacters(user,characters.get(charId)).isPresent())
        {
            userCharacterSet(user,charId,characters);
        }
        charId=19;
        if(!userCharacterRepository.findByUserAndCharacters(user,characters.get(charId)).isPresent())
        {
            userCharacterSet(user,charId,characters);
        }


    }


    void userCharacterSet(User user, long charId, Map<Long,Characters> characters)
    {
        UserCharacter userCharacter = new UserCharacter();
        userCharacter.setUser(user);
        userCharacter.setCharacters(characters.get(charId));
        userCharacterRepository.save(userCharacter);
        friendSocketService.sendCharacters(user.getId(),(long)charId);
    }

}
