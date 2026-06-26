package com.fh_wedel.user.controller;

import com.fh_wedel.user.service.CachedUserService;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnExpression("!'${aws.sqs.request.queue-name}'.isBlank()")
@RequiredArgsConstructor
@Slf4j
public class SqsCacheInvalidationListener {

    private final CachedUserService cachedUserService;

    @SqsListener("${aws.sqs.request.queue-name}")
    public void receiveMessage(String message) {
        log.info("Received cache invalidation request from SQS: {}", message);
        try {
            // Evict all caches. We can do this by calling a method annotated with @CacheEvict
            cachedUserService.invalidateAllCaches();
            log.info("Successfully invalidated all user caches.");
        } catch (Exception e) {
            log.error("Failed to invalidate caches: {}", e.getMessage(), e);
        }
    }
}
