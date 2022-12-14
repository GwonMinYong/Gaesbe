package com.ssafy.gaese.domain.algorithm.dto.redis;


import com.ssafy.gaese.domain.algorithm.dto.AlgoRoomDto;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;

import java.util.List;


@Getter
@Builder
@ToString
@RedisHash(value = "algoRoom", timeToLive = 60*60*24)
public class AlgoRoomRedisDto {

    @Id
    private String roomCode;
    private AlgoRoomDto algoRoomDto;
    public AlgoRoomDto toDto(){
        return AlgoRoomDto.builder()
                .roomCode(this.getRoomCode())
                .no(this.getAlgoRoomDto().getNo())
                .num(this.getAlgoRoomDto().getNum())
                .tier(this.getAlgoRoomDto().getTier())
                .time(this.getAlgoRoomDto().getTime())
                .master(this.getAlgoRoomDto().getMaster())
                .isStart(this.getAlgoRoomDto().isStart())
                .build();
    }


}
