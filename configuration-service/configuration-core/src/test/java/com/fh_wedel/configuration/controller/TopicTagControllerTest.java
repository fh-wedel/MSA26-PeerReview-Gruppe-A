package com.fh_wedel.configuration.controller;

import com.fh_wedel.configuration.model.api.CreateTopicTagRequest;
import com.fh_wedel.configuration.model.api.TopicTagDto;
import com.fh_wedel.configuration.service.TopicTagService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collection;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TopicTagControllerTest {

    @Mock
    private TopicTagService topicTagService;

    @Mock
    private Authentication authentication;

    @Mock
    private SecurityContext securityContext;

    @InjectMocks
    private TopicTagController controller;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.setContext(securityContext);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void testListTopicTags() {
        TopicTagDto dto = new TopicTagDto();
        when(topicTagService.getAllTags()).thenReturn(List.of(dto));

        ResponseEntity<List<TopicTagDto>> response = controller.listTopicTags();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
    }

    @Test
    void testAddTopicTag_Success_Admin() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        GrantedAuthority auth = mock(GrantedAuthority.class);
        when(auth.getAuthority()).thenReturn("ROLE_Admin");
        when(authentication.getAuthorities()).thenReturn((Collection) List.of(auth));

        CreateTopicTagRequest req = new CreateTopicTagRequest();
        TopicTagDto dto = new TopicTagDto();
        when(topicTagService.addTag(any())).thenReturn(dto);

        ResponseEntity<TopicTagDto> response = controller.addTopicTag(req);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(dto, response.getBody());
    }

    @Test
    void testAddTopicTag_Success_Officer() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        GrantedAuthority auth = mock(GrantedAuthority.class);
        when(auth.getAuthority()).thenReturn("ROLE_ExaminationOffice");
        when(authentication.getAuthorities()).thenReturn((Collection) List.of(auth));

        CreateTopicTagRequest req = new CreateTopicTagRequest();
        TopicTagDto dto = new TopicTagDto();
        when(topicTagService.addTag(any())).thenReturn(dto);

        ResponseEntity<TopicTagDto> response = controller.addTopicTag(req);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
    }

    @Test
    void testAddTopicTag_Forbidden() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        GrantedAuthority auth = mock(GrantedAuthority.class);
        when(auth.getAuthority()).thenReturn("ROLE_User");
        when(authentication.getAuthorities()).thenReturn((Collection) List.of(auth));

        ResponseEntity<TopicTagDto> response = controller.addTopicTag(new CreateTopicTagRequest());

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }

    @Test
    void testAddTopicTag_BadRequest() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        GrantedAuthority auth = mock(GrantedAuthority.class);
        when(auth.getAuthority()).thenReturn("ROLE_Admin");
        when(authentication.getAuthorities()).thenReturn((Collection) List.of(auth));

        when(topicTagService.addTag(any())).thenThrow(new IllegalArgumentException("invalid"));

        ResponseEntity<TopicTagDto> response = controller.addTopicTag(new CreateTopicTagRequest());

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void testDeleteTopicTag_Success() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        GrantedAuthority auth = mock(GrantedAuthority.class);
        when(auth.getAuthority()).thenReturn("ROLE_Admin");
        when(authentication.getAuthorities()).thenReturn((Collection) List.of(auth));

        doNothing().when(topicTagService).deleteTag("tag");

        ResponseEntity<Void> response = controller.deleteTopicTag("tag");

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
    }

    @Test
    void testDeleteTopicTag_Forbidden() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        GrantedAuthority auth = mock(GrantedAuthority.class);
        when(auth.getAuthority()).thenReturn("ROLE_User");
        when(authentication.getAuthorities()).thenReturn((Collection) List.of(auth));

        ResponseEntity<Void> response = controller.deleteTopicTag("tag");

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }

    @Test
    void testDeleteTopicTag_NotFound() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        GrantedAuthority auth = mock(GrantedAuthority.class);
        when(auth.getAuthority()).thenReturn("ROLE_Admin");
        when(authentication.getAuthorities()).thenReturn((Collection) List.of(auth));

        doThrow(new IllegalArgumentException("not found")).when(topicTagService).deleteTag("tag");

        ResponseEntity<Void> response = controller.deleteTopicTag("tag");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }
}
