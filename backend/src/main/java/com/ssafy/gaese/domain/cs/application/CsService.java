package com.ssafy.gaese.domain.cs.application;

import com.ssafy.gaese.domain.cs.dto.CsRecordDto;
import com.ssafy.gaese.domain.cs.dto.redis.CsRecordRedisDto;
import com.ssafy.gaese.domain.cs.dto.redis.CsRoomDto;
import com.ssafy.gaese.domain.cs.dto.CsSubmitDto;
import com.ssafy.gaese.domain.cs.entity.CsProblem;
import com.ssafy.gaese.domain.cs.entity.CsRecord;
import com.ssafy.gaese.domain.cs.entity.CsRecordProblem;
import com.ssafy.gaese.domain.cs.exception.*;
import com.ssafy.gaese.domain.cs.repository.*;
import com.ssafy.gaese.domain.friends.application.FriendSocketService;
import com.ssafy.gaese.domain.typing2.entity.TypingRecord;
import com.ssafy.gaese.domain.user.application.ItemService;
import com.ssafy.gaese.domain.user.dto.item.CharacterDto;
import com.ssafy.gaese.domain.user.entity.Ability;
import com.ssafy.gaese.domain.user.entity.User;
import com.ssafy.gaese.domain.user.entity.item.Characters;
import com.ssafy.gaese.domain.user.entity.item.UserCharacter;
import com.ssafy.gaese.domain.user.exception.UserNotFoundException;
import com.ssafy.gaese.domain.user.repository.AbilityRepository;
import com.ssafy.gaese.domain.user.repository.UserRepository;
import com.ssafy.gaese.domain.user.repository.item.CharacterRepository;
import com.ssafy.gaese.domain.user.repository.item.UserCharacterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CsService {

    private final CsRecordRepository csRecordRepository;
    private final CsProblemRepository csProblemRepository;
    private final UserRepository userRepository;

    private final CsRoomRedisRepository csRoomRedisRepository;
    private final CsRecordRedisRepository csRecordRedisRepository;
    private final CsRecordProblemRepository csRecordProblemRepository;
    private final SimpMessagingTemplate simpMessagingTemplate;
    private final AbilityRepository abilityRepository;

    private final ItemService itemService;

    private final FriendSocketService friendSocketService;

    private final UserCharacterRepository userCharacterRepository;

    private final CharacterRepository characterRepository;


    private final int penaltyScore=60;

    private final int numProblem=2;

    public Page<CsRecordDto> findCsRecord(Long userId, Pageable pageable){
        Page<CsRecord> CsRecords = csRecordRepository
                .findAllByUser(userRepository.findById(userId).orElseThrow(()->new UserNotFoundException()), pageable);
        Page<CsRecordDto> csRecordsDtoPage = CsRecords.map((csRecord) -> csRecord.toDto());
        return csRecordsDtoPage;
    }


    // ????????? ????????? ???????????? synchronized
    public synchronized CsRoomDto submitAnswer(CsSubmitDto csSubmitDto){
        Map<String,Object> res = new HashMap<>();

        CsRoomDto roomDto = csRoomRedisRepository
                .findById(csSubmitDto.getRoomCode())
                .orElseThrow(()->new RoomNotFoundException());



        // ???????????? ????????? ????????? ????????? ????????? ???????????? ?????? ??????
        // ????????? ???????????? ??????
        if(roomDto.getIsSolvedByPlayer().get(csSubmitDto.getUserId())!=-1) throw new DoubleSubmitException();
        if(roomDto.getCurrentIdx()!=csSubmitDto.getProblemId()) {
            System.out.println("????????? ?????????");
            System.out.println("??? ?????? ??????"+roomDto.getCurrentIdx());
            System.out.println("????????? ?????? ??????"+csSubmitDto.getProblemId());
            throw new ExceedTimeException();
        }


        // ????????? ????????? ?????? ??????
        // ?????? ????????? ?????? ???????????? ????????? ?????? ??????????????? ??????
        boolean isCorrected = answerCheck(csSubmitDto);
        // ????????? ???????????? ??????
        int round = roomDto.getRound();
        Long userId = csSubmitDto.getUserId();
        res.put("msg","submit");

        // ???????????? ??????????????? ????????? ??????
        simpMessagingTemplate.convertAndSend("/cs/"+csSubmitDto.getUserId(),res);

        // ??? ??? ??????????????? ??????
        HashMap<Integer, Integer> cntPerNum = roomDto.getCntPerNum();
        cntPerNum.put(csSubmitDto.getAnswer(),cntPerNum.get(csSubmitDto.getAnswer())+1);

        if(isCorrected){
            // ??????????????? response??? ??????.

            CsRecordRedisDto csRecordRedisDto = csRecordRedisRepository.findById(roomDto.getCode()+userId).orElseThrow(()->new RoomNotFoundException());


            csRecordRedisDto.getIsCorrectList()[round]=true;
            csRecordRedisRepository.save(csRecordRedisDto);

            // ?????? ????????? ?????? ?????? ??????
            HashMap<Integer, Integer> numCorrectByRound = roomDto.getNumCorrectByRound();

            // ?????? ??????
            HashMap<Long, Long> score = roomDto.getScore();
            System.out.println("?????? ?????? ???"+score.toString());
            score.put(userId,score.get(userId)+(1000-penaltyScore*numCorrectByRound.get(round)));
            roomDto.setScore(score);

            // ?????? ???????????? numCorrectByRound ?????????
            numCorrectByRound.put(round,numCorrectByRound.get(round)+1);
            roomDto.getIsSolvedByPlayer().put(csSubmitDto.getUserId(),numCorrectByRound.get(round));
        } else{
            roomDto.getIsSolvedByPlayer().put(csSubmitDto.getUserId(),0);
        }

        System.out.println("?????? ?????? ??? ??? isSolved"+roomDto.getIsSolvedByPlayer().toString());
        System.out.println("?????? ?????? ??? ??? roomDto"+roomDto.toString());



        // ?????? ?????? ??????
        return csRoomRedisRepository.save(roomDto);
    }

    public boolean answerCheck(CsSubmitDto csSubmitDto){
        CsProblem csProblem = csProblemRepository
                .findById(csSubmitDto.getProblemId())
                .orElseThrow(() -> new ProblemNotFoundException());

        if(csProblem.getAnswer()==csSubmitDto.getAnswer()) return true;
        else return false;
    }

    public CsRoomDto gameStart(CsRoomDto roomDto, List<CsProblem> randomProblem) throws InterruptedException {
        Map<String,Object> res = new HashMap<>();



        // ?????? ??????????????? ????????????????????? ?????????
        res.put("msg", "start");
        simpMessagingTemplate.convertAndSend("/cs/room/"+roomDto.getCode(),res);


        CsProblem currentCsProblem = null;

        // numCorrectByRound ?????????
        HashMap<Integer, Integer> numCorrectByRound = new HashMap<>();
        HashMap<Integer, Integer> cntPerNum = new HashMap<>();
        for (int i = 1; i <= 4; i++) {
            cntPerNum.put(i,0);
        }
        for (int i = 0; i < numProblem; i++) {
            numCorrectByRound.put(i,0);
        }
        roomDto.setNumCorrectByRound(numCorrectByRound);
        roomDto.setCntPerNum(cntPerNum);

//        ?????? 0????????? ?????????
        // ?????? ?????? ????????? ?????????
        HashMap<Long, Long> score = new HashMap<>();
        HashMap<Long, Integer> isSolvedByPlayer = new HashMap<>();

        String roomId = roomDto.getCode();

        System.out.println("?????????");


        roomDto.getPlayers().values().forEach(v->{
            score.put(v,0L);
            isSolvedByPlayer.put(v,-1);
            csRecordRedisRepository.save(CsRecordRedisDto.create(roomId, v,numProblem));
        });
        roomDto.setScore(score);
        roomDto.setIsSolvedByPlayer(isSolvedByPlayer);


        csRoomRedisRepository.save(roomDto);

        for (int i = 0; i < randomProblem.size(); i++) {
            System.out.println(i+"?????? ??????");
            currentCsProblem = randomProblem.get(i);

            res.clear();
            res.put("currentProblem", csProblemRepository.findById(currentCsProblem.getId()));

            simpMessagingTemplate.convertAndSend("/cs/room/"+roomId,res);

            // ?????? ?????? ?????? redis??? ??????
//            simpMessagingTemplate.convertAndSend("/cs/room/"+roomId,res);

            roomDto = csRoomRedisRepository.findById(roomId).orElseThrow(()->new RoomNotFoundException());
            roomDto.setCurrentIdx(currentCsProblem.getId());
            roomDto.setRound(i);

            cntPerNum = roomDto.getCntPerNum();
            for (int j = 1; j <= 4; j++) {
                cntPerNum.put(j,0);
            }

            csRoomRedisRepository.save(roomDto);

            //            ?????? ???????????? 60??? ?????????
            Thread.sleep(10*1000);


            // **********????????? ???
            // ?????? ?????? ??????
            roomDto = csRoomRedisRepository.findById(roomId).orElseThrow(()->new RoomNotFoundException());
            HashMap<Long, Long> currentScore = roomDto.getScore();

            // ?????? ????????? ??????
            List<Map.Entry<Long, Long>> rankEntryList = new LinkedList<>(currentScore.entrySet());
            rankEntryList.sort((o1, o2) -> -o1.getValue().compareTo(o2.getValue()));

            Object[][] rankList = new Object[rankEntryList.size()][4];

            for (int j = 0; j < rankEntryList.size(); j++) {
                Long userId = rankEntryList.get(j).getKey();
                User user = userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException());
                rankList[j][0] = userId;
                rankList[j][1] = user.getNickname();
                rankList[j][2] = user.getProfileChar();
                rankList[j][3] = rankEntryList.get(j).getValue();
            }


            // ????????????
            HashMap<Long, Integer> isSolvedByPlayer1 = roomDto.getIsSolvedByPlayer();



            // ???????????? ?????? ????????? ?????? ??????
            roomDto.getPlayers().values().forEach(v->{
                // ??????????????? ???????????? ????????? ?????? ????????? ??????
                res.clear();

                res.put("isSolved", isSolvedByPlayer1.get(v));

                simpMessagingTemplate.convertAndSend("/cs/"+v,res);
                isSolvedByPlayer1.put(v,-1);
            });

            roomDto.setIsSolvedByPlayer(isSolvedByPlayer1);
            csRoomRedisRepository.save(roomDto);


            // ??? ???????????? ranking??? ?????????
            res.clear();
            res.put("ranking", rankList);

            // ??? ?????? ???
            Integer answer = csProblemRepository
                    .findById(roomDto.getCurrentIdx())
                    .orElseThrow(() -> new ProblemNotFoundException()).getAnswer();
            res.put("answer", answer);

            // ????????? cnt ?????? ???
            cntPerNum = roomDto.getCntPerNum();
            res.put("cntPerNum", cntPerNum);

            simpMessagingTemplate.convertAndSend("/cs/room/"+roomId,res);

            //            ?????? ???????????? 60??? ?????????
            Thread.sleep(8*1000);
        }

        return csRoomRedisRepository.findById(roomId).orElseThrow(()->new RoomNotFoundException());



    }

    @Transactional
    public void gameEnd(CsRoomDto roomDto,List<CsProblem> randomProblem){

        Map<String,Object> res = new HashMap<>();

        // ???????????? ?????????
        res.put("msg", "end");

        HashMap<Long, Long> score = roomDto.getScore();

        HashMap<Long, Integer> rankByPlayer = new HashMap<>();

        List<Map.Entry<Long, Long>> entryList = new LinkedList<>(score.entrySet());
        entryList.sort((o1, o2) -> -o1.getValue().compareTo(o2.getValue()));

        int rank=0;
        long lastScore=-1;


        for(Map.Entry<Long, Long> entry : entryList){
            if (lastScore!=entry.getValue()) rank++;
            rankByPlayer.put(entry.getKey(),rank);
        }


        res.put("rankByPlayer", rankByPlayer);
        simpMessagingTemplate.convertAndSend("/cs/room/"+roomDto.getCode(),res);
        // ??????
        roomDto.getPlayers().forEach((k,v)->{
            CsRecord csRecord = CsRecord.builder()
                    .user(userRepository.findById(v).orElseThrow(() -> new UserNotFoundException()))
                    .ranks(rankByPlayer.get(v))
                    .date(LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy.MM.dd")))
                    .build();
            CsRecord saved = csRecordRepository.save(csRecord);



            // ???????????? ?????????????????? ?????? db??? ??????
            CsRecordRedisDto csRecordRedisDto = csRecordRedisRepository.findById(roomDto.getCode() + v).orElseThrow(() -> new RoomNotFoundException());
            Boolean[] isCorrectedList = csRecordRedisDto.getIsCorrectList();
            int correctCnt = 0;
            for (int i = 0; i < numProblem; i++) {
                CsRecordProblem csRecordProblem = CsRecordProblem.builder()
                        .csProblem(randomProblem.get(i))
                        .csRecord(saved)
                        .isCorrect(isCorrectedList[i])
                        .build();

                if (isCorrectedList[i]) correctCnt++;
                csRecordProblemRepository.save(csRecordProblem);


            }

            //????????? ?????? ??????
            charChecker(v);

            // ?????? ????????? 3?????? 1??????????????? ???.
            if (correctCnt>=numProblem/3){
                Ability ability = abilityRepository.findByUser_Id(v).get();
                ability.addExp("cs", 1);

                if (rankByPlayer.get(v)==1) ability.addExp("cs", 2);
                else if (rankByPlayer.get(v)>=3) ability.addExp("cs", 1);
            }

            csRecordRedisRepository.deleteById(roomDto.getCode() + v);
        });

    }
    void charChecker(Long userid)
    {
        User user = userRepository.findById(userid).get();

        List<CsRecord> csRecords = csRecordRepository.findAllByUser(user);
        ArrayList<Characters> characterArr = (ArrayList<Characters>) characterRepository.findAll();
        Map<Long,Characters> characters = new HashMap<>();
        for (Characters c:characterArr) {
            characters.put(c.getId(),c);
        }

        int oneCount=0;
        int threeCount=0;

        for (CsRecord csRecord:csRecords)
        {
            if(csRecord.getRanks()<2)
            {
                oneCount++;
                threeCount++;
            }
            else if(csRecord.getRanks()<4)
            {
                threeCount++;
            }
        }

        long charId=18;
        if(threeCount>9 && !userCharacterRepository.findByUserAndCharacters(user,characters.get(charId)).isPresent())
        {
            userCharacterSet(user,charId,characters);
        }
        charId=17;
        if(threeCount>4 && !userCharacterRepository.findByUserAndCharacters(user,characters.get(charId)).isPresent())
        {
            userCharacterSet(user,charId,characters);
        }
        charId=16;
        if(threeCount>0 && !userCharacterRepository.findByUserAndCharacters(user,characters.get(charId)).isPresent())
        {
            userCharacterSet(user,charId,characters);
        }

        charId=15;
        if(oneCount>6 && !userCharacterRepository.findByUserAndCharacters(user,characters.get(charId)).isPresent())
        {
            userCharacterSet(user,charId,characters);
        }
        charId=14;
        if(oneCount>2 && !userCharacterRepository.findByUserAndCharacters(user,characters.get(charId)).isPresent())
        {
            userCharacterSet(user,charId,characters);
        }
        charId=13;
        if(oneCount>0 && !userCharacterRepository.findByUserAndCharacters(user,characters.get(charId)).isPresent())
        {
            userCharacterSet(user,charId,characters);
        }


        charId=12;
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

    public int getWinCount(long userId)
    {
        User user =userRepository.findById(userId).get();
        List<CsRecord> csRecordRecords = csRecordRepository.findAllByUser(user);
        int count =0;
        for (CsRecord cr:csRecordRecords ) {
            if(cr.getRanks()==1)
                count++;

        }
        return count;
    }
}
