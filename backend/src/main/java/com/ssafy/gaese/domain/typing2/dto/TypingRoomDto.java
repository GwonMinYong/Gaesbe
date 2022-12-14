package com.ssafy.gaese.domain.typing2.dto;


import com.ssafy.gaese.domain.typing2.entity.TypingRecord;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;

import java.util.HashMap;
import java.util.HashSet;

@Getter
@Setter
@ToString
@AllArgsConstructor
@NoArgsConstructor
@Builder
@RedisHash(value = "TypingRoom", timeToLive = 3600)
public class TypingRoomDto {
    public enum RoomStatus {
        WAIT, START;
    }

    @Id
    private String code;
    private HashMap<String, Long> players;
    private int realPlayerCount;
    private Long paragraphId;
    private Long masterId;

    private RoomStatus roomStatus;


    private TypingRecord.LangType langType;

    private boolean isEnd;
    private boolean isStart;

    private HashMap<Long, Float> progressByPlayer;

    private HashMap<Long, Integer> point;

//    시작 시간
    private long startTime;
    //speed 계산용 시작시간
    private int startSpeedTime;

    private int paragraphLength;

    private TypingSocketDto.RoomType roomType;


}
