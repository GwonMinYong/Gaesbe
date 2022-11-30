package com.ssafy.gaese.domain.algorithm.controller;

import com.ssafy.gaese.domain.algorithm.application.AlgoProblemService;
import com.ssafy.gaese.domain.algorithm.application.AlgoService;
import com.ssafy.gaese.domain.algorithm.application.AlgoSocketService;
import com.ssafy.gaese.domain.algorithm.dto.*;
import com.ssafy.gaese.domain.algorithm.entity.AlgoRecord;
import com.ssafy.gaese.global.redis.SocketInfo;
import com.ssafy.gaese.security.model.CustomUserDetails;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.models.auth.In;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.swing.text.html.Option;
import java.io.IOException;
import java.text.ParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Api(value="Algorithm", tags={"Algorithm"})
@RestController
@Slf4j
@RequestMapping("/algo")
@RequiredArgsConstructor
public class AlgorithmController {

    private final AlgoService algoService;
    private final AlgoSocketService algoSocketService;
    private final AlgoProblemService algoProblemService;
    private final SocketInfo socketInfo;

    @GetMapping("/room")
    @ApiOperation(value = "생성된 알고리즘 방 조회", notes = "생성된 알고리즘 방 조회")
    public ResponseEntity<HashMap<String,List<AlgoRoomDto>>> roomList(){
        return ResponseEntity.ok().body(algoService.getRooms());
    }

    @PostMapping("/room")
    @ApiOperation(value = "알고리즘 방 생성", notes = "방 생성")
    public ResponseEntity<AlgoRoomDto> createRoom(
            @RequestBody  AlgoRoomDto algoRoomDto){
        return ResponseEntity.ok().body(algoService.createRoom(algoRoomDto));
    }

    @DeleteMapping("/room/{code}")
    @ApiOperation(value = "알고리즘 방 삭제", notes = "방 삭제")
    public ResponseEntity<String> deleteRoom(@PathVariable String code){
        algoService.deleteRoom(code);
        return ResponseEntity.ok().body("방 삭제 성공");
    }


    @PostMapping("/record")
    @ApiOperation(value = "알고리즘 게임 기록 등록", notes = "알고리즘 게임 기록 등록")
    public ResponseEntity<String> createRecord(@RequestBody AlgoRecordReq algoRecordReq,
                                               @AuthenticationPrincipal CustomUserDetails userDetails){
        algoService.createAlgoRecord(algoRecordReq, userDetails.getId());

        String msg = "";
        if(algoRecordReq.getRanking()==1) msg = " 축하합니다 ! ";
        else if(algoRecordReq.getRanking()<5) msg = " 수고하셨습니다 ! ";
        else msg = "아쉽지만 다음에 다시 도전 ! ";

        HashMap<String,Object> res = new HashMap<>();
        res.put("roomCode",algoRecordReq.getRoomCode());
        res.put("ranking",algoRecordReq.getRanking());
        res.put("msg",msg);
        return ResponseEntity.ok().body(msg);
    }

    @GetMapping("/play")
    @ApiOperation(value = "게임 중인지 확인")
    public ResponseEntity<Boolean> confirmPlay( @AuthenticationPrincipal CustomUserDetails userDetails){

        if(socketInfo.isPlayGame(userDetails.getId())){
            return ResponseEntity.ok().body(false);
        }
        return ResponseEntity.ok().body(true);
    }

    @GetMapping("/record")
    @ApiOperation(value = "알고리즘 게임 기록 조회", notes = "사용자별 알고리즘 게임 기록 조회")
    public ResponseEntity<Page<AlgoRecordDto>> recordList(Pageable pageable,
                                                          @AuthenticationPrincipal CustomUserDetails userDetails){
        return ResponseEntity.ok().body(algoService.recordList(pageable, userDetails.getId()));
    }

    @GetMapping("/confirm/{roomCode}")
    @ApiOperation(value="입장 가능 여부 판단", notes = "입장 가능 여부 판단")
    public ResponseEntity<HashMap<String,Object>> confirmEnter(@PathVariable String roomCode,
                                                @AuthenticationPrincipal CustomUserDetails userDetails){
        HashMap<String,Object> res = new HashMap<>();
        int result = algoService.confirmRoomEnter(roomCode,userDetails.getId());
        res.put("result", algoService.confirmRoomEnter(roomCode,userDetails.getId())>0?true:false);
        res.put("msg", result == 1 ? "입장" :
                        result == 0 ?  "이미 다른 게임 중 입니다." :
                        result == -1 ? "인원이 다 찼습니다." :"이미 시작 중인 방입니다." );
        return ResponseEntity.ok().body(res);
    }

    @GetMapping("/user/problem/{roomCode}/{userBjId}")
    @ApiOperation(value="사용자 푼 문제 크롤링")
    public ResponseEntity<String> getUserProblems(@PathVariable String userBjId, @PathVariable String roomCode){
        algoProblemService.getSolvedProblem(roomCode, userBjId);
        return ResponseEntity.ok().body("success");
    }

    @PostMapping("/solve/{roomCode}")
    @ApiOperation(value="문제 맞춤 여부 확인")
    public ResponseEntity<Object> checkSolve(@PathVariable String roomCode,
                                             @AuthenticationPrincipal CustomUserDetails userDetails,
                                             @RequestBody AlgoSolveReq algoSolveReq) throws ParseException {
        int result = algoProblemService.confirmSolve(algoSolveReq);
        HashMap<String,Object> res = new HashMap<>();
        res.put("result",result);
        if( result == 1 ) {
            algoProblemService.saveUserTime(algoSolveReq.getProblemId(),roomCode,userDetails.getId());
            res.put("msg","맞았습니다 !");
        }else{
            res.put("msg","제출이 확인되지 않았습니다.");
        }

        return ResponseEntity.ok().body(res);
    }

    @GetMapping("/bj")
    @ApiOperation(value="백중 아이디 저장 유무 확인")
    public ResponseEntity<Object> bjIdCheck(@AuthenticationPrincipal CustomUserDetails userDetails) {

        String bjId = algoService.checkBjId(userDetails.getId());

        HashMap<String , String> res = new HashMap<>();
        res.put("bjId",bjId);
        return ResponseEntity.ok().body(res);
    }
    @GetMapping("/bj/code")
    @ApiOperation(value="백중 아이디 연동 코드 전송")
    public ResponseEntity<Object> creatCode(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok().body(algoService.createCode(userDetails.getId()));
    }

    @GetMapping("/bj/code/confirm/{bjId}")
    @ApiOperation(value="백중 아이디 연동 확인")
    public ResponseEntity<Object> confirmCode(@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable String bjId) {
        return ResponseEntity.ok().body(algoService.confirmCode(userDetails.getId(),bjId));
    }

    @GetMapping("/record/rank")
    @ApiOperation(value="알고리즘 게임 1 등 횟수 반환 ")
    public ResponseEntity<Integer>  getFirstCnt(@AuthenticationPrincipal CustomUserDetails userDetails) throws IOException, ExecutionException, InterruptedException {
        return ResponseEntity.ok().body(algoService.getFirstCnt(userDetails.getId()));
    }

    @GetMapping("/record/code/{roomCode}")
    @ApiOperation(value="알고리즘 게임 코드들 반환 ([{userID:Long, code:Str},{userID:Long, code:Str}])")
    public ResponseEntity<List<AlgoRecordCodeDto>>  getCodes(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                @PathVariable String roomCode) throws IOException, ExecutionException, InterruptedException {
        return ResponseEntity.ok().body(algoService.getAllCodes(roomCode));
    }


}
