package com.ssafy.gaese.domain.algorithm.dto;

import lombok.Getter;

import java.util.List;

@Getter
public class AlgoProblemReq {
    String tier;
    String roomCode;
    List<String> users;
}
