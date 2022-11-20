package com.ssafy.gaese.domain.friends.dto;


import lombok.*;

@Getter
@Setter
@ToString
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FriendInviteGameDto {
    private Long userId;
    private Long fromUserId;
    private String gameType;
    private String roomCode;
}
