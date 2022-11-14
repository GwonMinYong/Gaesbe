package com.ssafy.gaese.domain.algorithm.repository;

import com.ssafy.gaese.domain.algorithm.entity.AlgoRecord;
import com.ssafy.gaese.domain.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface AlgoRepository extends JpaRepository<AlgoRecord, Long> {

    Page<AlgoRecord> findByUser(User user,Pageable pageable);
    /*
    select count(*) from gaese.algo_record where user_id = 54 and ranking = 1;
     */
    @Query("SELECT count(a) from AlgoRecord a WHERE a.user=:user AND a.ranking = 1")
    int countFirstRank(User user);
}
