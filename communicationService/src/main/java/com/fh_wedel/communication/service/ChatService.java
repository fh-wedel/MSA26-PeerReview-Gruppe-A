package com.fh_wedel.communication.service;

import com.fh_wedel.communication.model.api.*;
import com.fh_wedel.communication.model.db.ChatMetaItem;
import com.fh_wedel.communication.model.db.MessageItem;
import com.fh_wedel.communication.model.db.ParticipantLinkItem;
import com.fh_wedel.communication.repository.ChatRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);
    private final ChatRepository chatRepository;
    private final MatchingServiceClient matchingServiceClient;
    private final ConfigurationServiceClient configurationServiceClient;
    private final ConcurrentHashMap<String, CopyOnWriteArrayList<SseEmitter>> activeEmitters = new ConcurrentHashMap<>();

    public ChatService(ChatRepository chatRepository, MatchingServiceClient matchingServiceClient, ConfigurationServiceClient configurationServiceClient) {
        this.chatRepository = chatRepository;
        this.matchingServiceClient = matchingServiceClient;
        this.configurationServiceClient = configurationServiceClient;
    }
    /**
     * Strips Cedar entity type prefix and Cognito pool prefix from a raw principal ID.
     * Handles formats:
     *   - Bare sub UUID:             "abc-123"
     *   - Pool|sub:                  "eu-central-1_abc|abc-123"
     *   - Cedar entity string:       PeerReview::User::"eu-central-1_abc|abc-123"
     */
    static String normalizeUserId(String raw) {
        if (raw == null) return null;
        // Strip Cedar quotes: PeerReview::User::"pool|sub" → pool|sub
        int firstQuote = raw.indexOf('"');
        int lastQuote = raw.lastIndexOf('"');
        String inner = (firstQuote >= 0 && lastQuote > firstQuote)
                ? raw.substring(firstQuote + 1, lastQuote)
                : raw;
        // Strip pool prefix: pool|sub → sub
        int pipeIndex = inner.lastIndexOf('|');
        if (pipeIndex >= 0 && pipeIndex < inner.length() - 1) {
            return inner.substring(pipeIndex + 1);
        }
        return inner;
    }

    public SseEmitter subscribe(String rawUserId) {
        String userId = normalizeUserId(rawUserId);
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or missing user ID");
        }
        log.info("SSE subscribe: raw='{}' normalized='{}' activeEmitterKeys={}", rawUserId, userId, activeEmitters.keySet());
        // Timeout must be < API Gateway's 29s Lambda timeout so idle connections
        // close cleanly and the Lambda proxy's `await response.text()` resolves.
        SseEmitter emitter = new SseEmitter(25000L);
        activeEmitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        Runnable onDetach = () -> {
            CopyOnWriteArrayList<SseEmitter> list = activeEmitters.get(userId);
            if (list != null) {
                list.remove(emitter);
                if (list.isEmpty()) {
                    activeEmitters.remove(userId);
                }
            }
            log.info("SSE detach: userId='{}' remainingEmitterKeys={}", userId, activeEmitters.keySet());
        };

        emitter.onCompletion(onDetach);
        emitter.onTimeout(onDetach);
        emitter.onError(e -> onDetach.run());

        return emitter;
    }

    private void notifyUser(String userId, String chatId, Message message) {
        log.info("notifyUser: userId='{}' chatId='{}' activeEmitterKeys={}", userId, chatId, activeEmitters.keySet());
        CopyOnWriteArrayList<SseEmitter> emitters = activeEmitters.get(userId);
        if (emitters == null || emitters.isEmpty()) {
            log.warn("notifyUser: No active SSE emitters for userId='{}' — recipient may be offline or ID mismatch", userId);
            return;
        }
        log.info("notifyUser: Sending SSE event to {} emitter(s) for userId='{}'", emitters.size(), userId);
        var payload = new java.util.HashMap<String, Object>();
        payload.put("chatId", chatId);
        payload.put("message", message);

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("message").data(payload));
                // Complete the emitter immediately after sending so the Lambda proxy's
                // `await response.text()` resolves and returns the event data to the
                // browser before the 29s API Gateway timeout. The client reconnects
                // automatically via fetchEventSource.
                emitter.complete();
                log.info("notifyUser: Sent and completed emitter for userId='{}'", userId);
            } catch (Exception e) {
                log.warn("notifyUser: Failed to send to emitter for userId='{}': {}", userId, e.getMessage());
                emitter.completeWithError(e);
            }
        }
    }

    /** Notifies all users in the list except the sender. */
    private void notifyUsers(List<String> userIds, String senderId, String chatId, Message message) {
        for (String userId : userIds) {
            if (!userId.equals(senderId)) {
                notifyUser(userId, chatId, message);
            }
        }
    }

    public ChatListResponse listChats(String userId) {
        List<ParticipantLinkItem> links = chatRepository.findParticipantLinks(userId);

        List<ChatSummary> summaries = links.stream().map(link -> {
            ChatSummary summary = new ChatSummary();
            summary.setChatId(link.getChatId());
            summary.setChatType(ChatSummary.ChatTypeEnum.fromValue(link.getChatType()));
            
            if ("SUBMISSION".equals(link.getChatType())) {
                summary.setSubmissionId(link.getSubmissionId());
                // For group chats, otherParticipantId is not meaningful — leave null.
                // The participants list is loaded when the chat detail is opened.
            } else {
                summary.setOtherParticipantId(link.getOtherParticipantId());
                if (link.getSubmissionId() != null && !"GENERAL".equals(link.getSubmissionId())) {
                    summary.setSubmissionId(link.getSubmissionId());
                }
            }
            
            if (link.getLastMessageAt() != null) {
                summary.setLastMessageAt(OffsetDateTime.parse(link.getLastMessageAt()));
            }
            return summary;
        }).collect(Collectors.toList());

        ChatListResponse response = new ChatListResponse();
        response.setChats(summaries);
        return response;
    }

    public ChatDetailResponse getChat(String userId, String chatId, String nextToken, Integer limit) {
        Optional<ChatMetaItem> metaOpt = chatRepository.findChatMeta(chatId);
        if (metaOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Chat not found");
        }

        ChatMetaItem meta = metaOpt.get();

        // Authorization: check user is a participant
        if ("SUBMISSION".equals(meta.getChatType())) {
            if (meta.getParticipants() == null || !meta.getParticipants().contains(userId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is not a participant in this chat");
            }
        } else {
            if (!userId.equals(meta.getParticipantA()) && !userId.equals(meta.getParticipantB())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is not a participant in this chat");
            }
        }

        int pageSize = (limit != null && limit > 0) ? Math.min(limit, 200) : 100;
        ChatRepository.MessagePage page = chatRepository.findMessages(chatId, nextToken, pageSize);

        ChatDetailResponse response = new ChatDetailResponse();
        response.setChatId(meta.getPk().replace("CHAT#", ""));
        response.setChatType(ChatDetailResponse.ChatTypeEnum.fromValue(meta.getChatType()));

        if ("SUBMISSION".equals(meta.getChatType())) {
            response.setParticipants(meta.getParticipants());
            response.setSubmissionId(meta.getSubmissionId());
        } else {
            response.setParticipantA(meta.getParticipantA());
            response.setParticipantB(meta.getParticipantB());
        }
        
        if (meta.getCreatedAt() != null) {
            response.setCreatedAt(OffsetDateTime.parse(meta.getCreatedAt()));
        }
        
        response.setNextToken(page.nextToken);

        List<Message> messages = page.messages.stream().map(item -> {
            Message m = new Message();
            m.setMessageId(item.getSk().substring(item.getSk().lastIndexOf("#") + 1));
            m.setSenderId(item.getSenderId());
            m.setBody(item.getBody());
            if (item.getSentAt() != null) {
                m.setSentAt(OffsetDateTime.parse(item.getSentAt()));
            }
            return m;
        }).collect(Collectors.toList());

        response.setMessages(messages);
        return response;
    }

    public ChatDetailResponse sendMessage(String rawSenderId, SendMessageRequest request) {
        String senderId = normalizeUserId(rawSenderId);
        ChatContext context = request.getChatContext();
        String chatTypeValue = context.getType() != null ? context.getType().getValue() : "GENERAL";

        log.info("sendMessage: normalizedSender='{}' chatType='{}'", senderId, chatTypeValue);

        if (ChatContext.TypeEnum.SUBMISSION.equals(context.getType())) {
            return sendSubmissionMessage(senderId, request);
        } else {
            return sendGeneralMessage(senderId, request);
        }
    }

    // ── GENERAL 1:1 chat ─────────────────────────────────────────────────────

    private ChatDetailResponse sendGeneralMessage(String senderId, SendMessageRequest request) {
        String recipientId = normalizeUserId(request.getRecipientId());
        if (recipientId == null || recipientId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "recipientId is required for GENERAL chats");
        }

        String lowerSub = senderId.compareTo(recipientId) <= 0 ? senderId : recipientId;
        String upperSub = senderId.compareTo(recipientId) <= 0 ? recipientId : senderId;
        String seed = lowerSub + ":" + upperSub + ":GENERAL";
        String chatId = UUID.nameUUIDFromBytes(seed.getBytes(StandardCharsets.UTF_8)).toString();

        String now = ZonedDateTime.now(ZoneOffset.UTC).format(DateTimeFormatter.ISO_INSTANT);
        String messageId = UUID.randomUUID().toString();

        MessageItem messageItem = MessageItem.builder()
                .pk("CHAT#" + chatId)
                .sk("MSG#" + now + "#" + messageId)
                .senderId(senderId)
                .body(request.getBody())
                .sentAt(now)
                .build();

        Optional<ChatMetaItem> metaOpt = chatRepository.findChatMeta(chatId);

        if (metaOpt.isEmpty()) {
            ChatMetaItem meta = ChatMetaItem.builder()
                    .pk("CHAT#" + chatId)
                    .sk("META")
                    .participantA(lowerSub)
                    .participantB(upperSub)
                    .chatType("GENERAL")
                    .submissionId("GENERAL")
                    .createdAt(now)
                    .lastMessageAt(now)
                    .build();

            ParticipantLinkItem link1 = ParticipantLinkItem.builder()
                    .pk("USER#" + senderId)
                    .sk("CHAT#" + chatId)
                    .chatId(chatId)
                    .otherParticipantId(recipientId)
                    .chatType("GENERAL")
                    .submissionId("GENERAL")
                    .lastMessageAt(now)
                    .build();

            ParticipantLinkItem link2 = ParticipantLinkItem.builder()
                    .pk("USER#" + recipientId)
                    .sk("CHAT#" + chatId)
                    .chatId(chatId)
                    .otherParticipantId(senderId)
                    .chatType("GENERAL")
                    .submissionId("GENERAL")
                    .lastMessageAt(now)
                    .build();

            chatRepository.createChatWithFirstMessage(meta, link1, link2, messageItem);
        } else {
            ParticipantLinkItem link1 = ParticipantLinkItem.builder()
                    .pk("USER#" + senderId)
                    .sk("CHAT#" + chatId)
                    .chatId(chatId)
                    .otherParticipantId(recipientId)
                    .chatType("GENERAL")
                    .submissionId("GENERAL")
                    .lastMessageAt(now)
                    .build();

            ParticipantLinkItem link2 = ParticipantLinkItem.builder()
                    .pk("USER#" + recipientId)
                    .sk("CHAT#" + chatId)
                    .chatId(chatId)
                    .otherParticipantId(senderId)
                    .chatType("GENERAL")
                    .submissionId("GENERAL")
                    .lastMessageAt(now)
                    .build();

            chatRepository.addMessage(messageItem, link1, link2);
        }

        Message m = new Message();
        m.setMessageId(messageId);
        m.setSenderId(senderId);
        m.setBody(request.getBody());
        m.setSentAt(OffsetDateTime.parse(now));

        // Only notify the recipient — the sender already has an optimistic UI update
        notifyUser(recipientId, chatId, m);

        return getChat(senderId, chatId, null, 1);
    }

    // ── SUBMISSION group chat ────────────────────────────────────────────────

    private ChatDetailResponse sendSubmissionMessage(String senderId, SendMessageRequest request) {
        ChatContext context = request.getChatContext();
        String submissionId = context.getSubmissionId();

        if (submissionId == null || submissionId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "submissionId is required for SUBMISSION chats");
        }

        // Validate workflow rules
        com.fh_wedel.configuration.client.model.ReviewRulesDto rules = configurationServiceClient.getSubmissionRules(submissionId);
        if (Boolean.FALSE.equals(rules.getAuthorReviewerChatAllowed())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chat is not allowed for this review type");
        }

        // Deterministic chatId keyed by submission only (one group chat per submission)
        String seed = "SUBMISSION:" + submissionId;
        String chatId = UUID.nameUUIDFromBytes(seed.getBytes(StandardCharsets.UTF_8)).toString();

        String now = ZonedDateTime.now(ZoneOffset.UTC).format(DateTimeFormatter.ISO_INSTANT);
        String messageId = UUID.randomUUID().toString();

        MessageItem messageItem = MessageItem.builder()
                .pk("CHAT#" + chatId)
                .sk("MSG#" + now + "#" + messageId)
                .senderId(senderId)
                .body(request.getBody())
                .sentAt(now)
                .build();

        Optional<ChatMetaItem> metaOpt = chatRepository.findChatMeta(chatId);

        List<String> allParticipants;

        if (metaOpt.isEmpty()) {
            // First message: fetch all participants from the Matching Service
            com.fh_wedel.matching.client.model.SubmissionMatchResponse match = matchingServiceClient.getSubmissionMatch(submissionId);
            allParticipants = buildParticipantList(match);

            if (!allParticipants.contains(senderId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a participant in this submission");
            }

            ChatMetaItem meta = ChatMetaItem.builder()
                    .pk("CHAT#" + chatId)
                    .sk("META")
                    .participants(allParticipants)
                    .chatType("SUBMISSION")
                    .submissionId(submissionId)
                    .createdAt(now)
                    .lastMessageAt(now)
                    .build();

            List<ParticipantLinkItem> links = buildParticipantLinks(allParticipants, chatId, submissionId, now);
            chatRepository.createGroupChatWithFirstMessage(meta, links, messageItem);
            
            log.info("Created SUBMISSION group chat: chatId='{}' submissionId='{}' participants={}", 
                    chatId, submissionId, allParticipants);
        } else {
            // Subsequent message: participants are already stored in the meta
            ChatMetaItem meta = metaOpt.get();
            allParticipants = meta.getParticipants();

            if (allParticipants == null || !allParticipants.contains(senderId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a participant in this chat");
            }

            List<ParticipantLinkItem> links = buildParticipantLinks(allParticipants, chatId, submissionId, now);
            chatRepository.addGroupMessage(messageItem, links);
        }

        Message m = new Message();
        m.setMessageId(messageId);
        m.setSenderId(senderId);
        m.setBody(request.getBody());
        m.setSentAt(OffsetDateTime.parse(now));

        // Notify ALL other participants via SSE
        notifyUsers(allParticipants, senderId, chatId, m);

        return getChat(senderId, chatId, null, 1);
    }

    /** Builds a deduplicated participant list from the Matching Service response. */
    private List<String> buildParticipantList(com.fh_wedel.matching.client.model.SubmissionMatchResponse match) {
        List<String> participants = new ArrayList<>();
        if (match.getSubmitterIds() != null) {
            participants.addAll(match.getSubmitterIds());
        }
        if (match.getMatches() != null) {
            for (com.fh_wedel.matching.client.model.MatchEntry entry : match.getMatches()) {
                if (entry.getExaminerId() != null && !participants.contains(entry.getExaminerId())) {
                    participants.add(entry.getExaminerId());
                }
            }
        }
        return participants;
    }

    /** Creates a ParticipantLinkItem for each participant in a group chat. */
    private List<ParticipantLinkItem> buildParticipantLinks(List<String> participants, String chatId, String submissionId, String now) {
        return participants.stream()
                .map(userId -> ParticipantLinkItem.builder()
                        .pk("USER#" + userId)
                        .sk("CHAT#" + chatId)
                        .chatId(chatId)
                        .chatType("SUBMISSION")
                        .submissionId(submissionId)
                        .lastMessageAt(now)
                        .build())
                .collect(Collectors.toList());
    }
}
