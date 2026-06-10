package com.fh_wedel.communication.service;

import com.fh_wedel.communication.model.api.ChatContext;
import com.fh_wedel.communication.model.api.ChatDetailResponse;
import com.fh_wedel.communication.model.api.ChatListResponse;
import com.fh_wedel.communication.model.api.ChatSummary;
import com.fh_wedel.communication.model.api.Message;
import com.fh_wedel.communication.model.api.SendMessageRequest;
import com.fh_wedel.communication.model.db.ChatMetaItem;
import com.fh_wedel.communication.model.db.MessageItem;
import com.fh_wedel.communication.model.db.ParticipantLinkItem;
import com.fh_wedel.communication.repository.ChatRepository;
import org.openapitools.jackson.nullable.JsonNullable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class ChatService {

    private final ChatRepository chatRepository;
    private final ConcurrentHashMap<String, CopyOnWriteArrayList<SseEmitter>> activeEmitters = new ConcurrentHashMap<>();

    public ChatService(ChatRepository chatRepository) {
        this.chatRepository = chatRepository;
    }

    public SseEmitter subscribe(String userId) {
        SseEmitter emitter = new SseEmitter(60000L);
        activeEmitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        Runnable onDetach = () -> {
            CopyOnWriteArrayList<SseEmitter> list = activeEmitters.get(userId);
            if (list != null) {
                list.remove(emitter);
                if (list.isEmpty()) {
                    activeEmitters.remove(userId);
                }
            }
        };

        emitter.onCompletion(onDetach);
        emitter.onTimeout(onDetach);
        emitter.onError(e -> onDetach.run());

        return emitter;
    }

    private void notifyUser(String userId, String chatId, Message message) {
        CopyOnWriteArrayList<SseEmitter> emitters = activeEmitters.get(userId);
        if (emitters != null) {
            var payload = new java.util.HashMap<String, Object>();
            payload.put("chatId", chatId);
            payload.put("message", message);
            
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event().name("message").data(payload));
                } catch (Exception e) {
                    emitter.completeWithError(e);
                }
            }
        }
    }

    public ChatListResponse listChats(String userId) {
        List<ParticipantLinkItem> links = chatRepository.findParticipantLinks(userId);

        List<ChatSummary> summaries = links.stream().map(link -> {
            ChatSummary summary = new ChatSummary();
            summary.setChatId(link.getChatId());
            summary.setOtherParticipantId(link.getOtherParticipantId());
            summary.setChatType(ChatSummary.ChatTypeEnum.fromValue(link.getChatType()));
            if ("SUBMISSION".equals(link.getChatType()) && link.getSubmissionId() != null) {
                summary.setSubmissionId(JsonNullable.of(link.getSubmissionId()));
            } else {
                summary.setSubmissionId(JsonNullable.undefined());
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

        if (!userId.equals(meta.getParticipantA()) && !userId.equals(meta.getParticipantB())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is not a participant in this chat");
        }

        int pageSize = (limit != null && limit > 0) ? Math.min(limit, 200) : 100;
        ChatRepository.MessagePage page = chatRepository.findMessages(chatId, nextToken, pageSize);

        ChatDetailResponse response = new ChatDetailResponse();
        response.setChatId(meta.getPk().replace("CHAT#", ""));
        response.setParticipantA(meta.getParticipantA());
        response.setParticipantB(meta.getParticipantB());
        response.setChatType(ChatDetailResponse.ChatTypeEnum.fromValue(meta.getChatType()));
        
        if ("SUBMISSION".equals(meta.getChatType()) && meta.getSubmissionId() != null) {
            response.setSubmissionId(JsonNullable.of(meta.getSubmissionId()));
        } else {
            response.setSubmissionId(JsonNullable.undefined());
        }
        
        if (meta.getCreatedAt() != null) {
            response.setCreatedAt(OffsetDateTime.parse(meta.getCreatedAt()));
        }
        
        if (page.nextToken != null) {
            response.setNextToken(JsonNullable.of(page.nextToken));
        } else {
            response.setNextToken(JsonNullable.undefined());
        }

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

    public ChatDetailResponse sendMessage(String senderId, SendMessageRequest request) {
        String recipientId = request.getRecipientId();
        ChatContext context = request.getChatContext();
        
        String contextStr = "GENERAL";
        if (ChatContext.TypeEnum.SUBMISSION.equals(context.getType())) {
            if (context.getSubmissionId() != null && context.getSubmissionId().isPresent()) {
                contextStr = context.getSubmissionId().get();
            }
        }

        String lowerSub = senderId.compareTo(recipientId) <= 0 ? senderId : recipientId;
        String upperSub = senderId.compareTo(recipientId) <= 0 ? recipientId : senderId;
        String seed = lowerSub + ":" + upperSub + ":" + contextStr;
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
        
        String chatTypeValue = context.getType() != null ? context.getType().getValue() : "GENERAL";

        if (metaOpt.isEmpty()) {
            ChatMetaItem meta = ChatMetaItem.builder()
                    .pk("CHAT#" + chatId)
                    .sk("META")
                    .participantA(lowerSub)
                    .participantB(upperSub)
                    .chatType(chatTypeValue)
                    .submissionId(contextStr)
                    .createdAt(now)
                    .lastMessageAt(now)
                    .build();

            ParticipantLinkItem link1 = ParticipantLinkItem.builder()
                    .pk("USER#" + senderId)
                    .sk("CHAT#" + chatId)
                    .chatId(chatId)
                    .otherParticipantId(recipientId)
                    .chatType(chatTypeValue)
                    .submissionId(contextStr)
                    .lastMessageAt(now)
                    .build();

            ParticipantLinkItem link2 = ParticipantLinkItem.builder()
                    .pk("USER#" + recipientId)
                    .sk("CHAT#" + chatId)
                    .chatId(chatId)
                    .otherParticipantId(senderId)
                    .chatType(chatTypeValue)
                    .submissionId(contextStr)
                    .lastMessageAt(now)
                    .build();

            chatRepository.createChatWithFirstMessage(meta, link1, link2, messageItem);
        } else {
            ParticipantLinkItem link1 = ParticipantLinkItem.builder()
                    .pk("USER#" + senderId)
                    .sk("CHAT#" + chatId)
                    .chatId(chatId)
                    .otherParticipantId(recipientId)
                    .chatType(chatTypeValue)
                    .submissionId(contextStr)
                    .lastMessageAt(now)
                    .build();

            ParticipantLinkItem link2 = ParticipantLinkItem.builder()
                    .pk("USER#" + recipientId)
                    .sk("CHAT#" + chatId)
                    .chatId(chatId)
                    .otherParticipantId(senderId)
                    .chatType(chatTypeValue)
                    .submissionId(contextStr)
                    .lastMessageAt(now)
                    .build();

            chatRepository.addMessage(messageItem, link1, link2);
        }

        Message m = new Message();
        m.setMessageId(messageId);
        m.setSenderId(senderId);
        m.setBody(request.getBody());
        m.setSentAt(OffsetDateTime.parse(now));
        
        notifyUser(recipientId, chatId, m);
        notifyUser(senderId, chatId, m);

        return getChat(senderId, chatId, null, 1);
    }
}
