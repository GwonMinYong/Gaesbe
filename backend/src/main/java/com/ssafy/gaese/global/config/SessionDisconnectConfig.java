package com.ssafy.gaese.global.config;

import com.ssafy.gaese.domain.algorithm.application.AlgoService;
import com.ssafy.gaese.domain.algorithm.dto.AlgoSocketDto;
import com.ssafy.gaese.domain.chat.application.ChatService;
import com.ssafy.gaese.domain.cs.application.CsRoomService;
import com.ssafy.gaese.domain.cs.dto.CsSocketDto;
import com.ssafy.gaese.domain.cs.dto.redis.CsRoomDto;
import com.ssafy.gaese.domain.cs.repository.CsRoomRedisRepository;
import com.ssafy.gaese.domain.friends.application.FriendSocketService;
import com.ssafy.gaese.domain.friends.dto.FriendSocketDto;
import com.ssafy.gaese.domain.typing2.application.Typing2RoomService;
import com.ssafy.gaese.domain.typing2.dto.TypingRoomDto;
import com.ssafy.gaese.domain.typing2.dto.TypingSocketDto;
import com.ssafy.gaese.domain.typing2.repository.TypingRoomRedisRepository;
import com.ssafy.gaese.global.Dto.BaseSocketDto;
import com.ssafy.gaese.global.redis.SocketInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.messaging.support.NativeMessageHeaderAccessor;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Optional;

@Configuration
@RequiredArgsConstructor
@Log4j2
public class SessionDisconnectConfig {


    private final SocketInfo socketInfo;

    private final CsRoomService csRoomService;
    private final Typing2RoomService typingRoomService2;
    private final FriendSocketService friendSocketService;
    private final ChatService chatService;
    private final AlgoService algoService;

    private final CsRoomRedisRepository csRoomRedisRepository;
    private final TypingRoomRedisRepository typingRoomRedisRepository;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        System.out.println("=====================================");
        MessageHeaderAccessor accessor = NativeMessageHeaderAccessor.getAccessor(event.getMessage(), SimpMessageHeaderAccessor.class);
        System.out.println("socket header" + accessor.getMessageHeaders().toString());
    }

    @EventListener
    public void onDisconnectEvent(SessionDisconnectEvent event) throws Exception
    {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        String sId = headerAccessor.getSessionId();

        System.out.println("[Disconnected] websocket session id : "+ sId);

        String sessionId=event.getSessionId();
        System.out.println("???????????? ????????? ?????? : "+ sessionId);

        String s = socketInfo.geSocketInfo(sessionId);
        if (s==null){
            return;
        }
        //?????? : {id},{roomCode},{gameType},{nickName}
        String[] info = s.split(",");

        System.out.println("????????? ?????? ?????? : "+ s);
        //?????? ????????? ????????? ????????? ??????
        switch (info[2])
        {
            
            case "Cs":
                System.out.println("cs?????? ?????? : "+ sessionId);
                CsSocketDto csSocketDto = CsSocketDto.builder()
                        .type(BaseSocketDto.Type.LEAVE)
                        .userId(Long.parseLong(info[0]))
                        .roomCode(info[1])
                        .sessionId(sessionId)
                        .build();

                System.out.println("******************????????????"+info[0]);
                csRoomService.deleteRecord(info[1],Long.parseLong(info[0]));

                System.out.println("******************?????????"+info[0]);
                socketInfo.stopPlayGame(Long.parseLong(info[0]));

                System.out.println("******************??? ??????"+info[0]);
                // ????????? ???????????? ??????, ????????? ?????? ??????????????? ?????? , ?????? ????????? ???????????? leave
                Optional<CsRoomDto> csRoomOpt = csRoomRedisRepository.findById(csSocketDto.getRoomCode());
                if (csRoomOpt.isPresent()) csRoomService.enterOrLeave(csSocketDto);
                // ????????? ?????? ????????? ?????? ??????
                break;
            case "Typing2":
                System.out.println("??????????????? ?????? sessionId: "+ sessionId);
                System.out.println("??????????????? ?????? userId: "+ Long.parseLong(info[0]));
                TypingSocketDto typingSocketDto = TypingSocketDto.builder()
                        .type(TypingSocketDto.Type.LEAVE)
                        .userId(Long.parseLong(info[0]))
                        .roomCode(info[1])
                        .sessionId(sessionId)
                        .build();

                socketInfo.stopPlayGame(Long.parseLong(info[0]));

                Optional<TypingRoomDto> typingRoomOpt = typingRoomRedisRepository.findById(typingSocketDto.getRoomCode());
                if (typingRoomOpt.isPresent()) typingRoomService2.enterOrLeave(typingSocketDto);
                break;
            case "Algo" :
                System.out.println("???????????? ?????? : "+ sessionId);
                AlgoSocketDto algoSocketDto = AlgoSocketDto.builder()
                        .sessionId(sessionId)
                        .roomCode(info[1])
                        .userId(Long.valueOf(info[0])).nickname(info[3]).build();

                algoService.leaveRoom(algoSocketDto,info[0]);
                // ????????? ?????? ????????? ?????? ??????
                socketInfo.stopPlayGame(Long.parseLong(info[0]));
                break;

            case "Friend" :
                System.out.println("friend?????? ?????? : "+ sessionId);
                FriendSocketDto friendSocketDto = FriendSocketDto.builder()
                        .sessionId(sessionId)
                        .userId(Long.parseLong(info[0])).build();

                friendSocketService.userLeave(friendSocketDto);
                break;
            default: break;
        }

        socketInfo.delSocketInfo(sessionId);
    }



}
