package com.fh_wedel.configuration.controller;

import com.fh_wedel.configuration.api.ReviewTypePlugin;
import com.fh_wedel.configuration.model.api.ReviewRulesDto;
import com.fh_wedel.configuration.model.api.ReviewTypeDto;
import com.fh_wedel.configuration.service.PluginService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewTypesControllerTest {

    @Mock
    private PluginService pluginService;

    @InjectMocks
    private ReviewTypesController controller;

    @Test
    void testGetReviewType_Found() {
        ReviewTypePlugin plugin = mock(ReviewTypePlugin.class);
        when(plugin.getName()).thenReturn("type-1");
        when(plugin.getTitle()).thenReturn("Type 1");
        when(plugin.getDescription()).thenReturn("Desc");
        when(plugin.isAuthorAnonymous()).thenReturn(true);
        when(plugin.isReviewerAnonymous()).thenReturn(false);
        when(plugin.isAuthorReviewerChatAllowed()).thenReturn(true);

        when(pluginService.getReviewType("type-1")).thenReturn(Optional.of(plugin));

        ResponseEntity<ReviewTypeDto> response = controller.getReviewType("type-1");

        assertTrue(response.getStatusCode().is2xxSuccessful());
        ReviewTypeDto dto = response.getBody();
        assertNotNull(dto);
        assertEquals("type-1", dto.getName());
        assertTrue(dto.getRules().getAuthorAnonymous());
        assertFalse(dto.getRules().getReviewerAnonymous());
        assertTrue(dto.getRules().getAuthorReviewerChatAllowed());
    }

    @Test
    void testGetReviewType_NotFound() {
        when(pluginService.getReviewType("type-1")).thenReturn(Optional.empty());

        ResponseEntity<ReviewTypeDto> response = controller.getReviewType("type-1");

        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    void testGetReviewTypeRules_Found() {
        ReviewTypePlugin plugin = mock(ReviewTypePlugin.class);
        when(plugin.isAuthorAnonymous()).thenReturn(true);
        when(plugin.isReviewerAnonymous()).thenReturn(false);
        when(plugin.isAuthorReviewerChatAllowed()).thenReturn(true);

        when(pluginService.getReviewType("type-1")).thenReturn(Optional.of(plugin));

        ResponseEntity<ReviewRulesDto> response = controller.getReviewTypeRules("type-1");

        assertTrue(response.getStatusCode().is2xxSuccessful());
        ReviewRulesDto dto = response.getBody();
        assertNotNull(dto);
        assertTrue(dto.getAuthorAnonymous());
    }

    @Test
    void testGetReviewTypeRules_NotFound() {
        when(pluginService.getReviewType("type-1")).thenReturn(Optional.empty());

        ResponseEntity<ReviewRulesDto> response = controller.getReviewTypeRules("type-1");

        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    void testListReviewTypes() {
        ReviewTypePlugin plugin = mock(ReviewTypePlugin.class);
        when(plugin.getName()).thenReturn("type-1");
        when(plugin.getTitle()).thenReturn("Type 1");
        when(plugin.getDescription()).thenReturn("Desc");
        when(plugin.isAuthorAnonymous()).thenReturn(true);

        when(pluginService.getReviewTypes()).thenReturn(List.of(plugin));

        ResponseEntity<List<ReviewTypeDto>> response = controller.listReviewTypes();

        assertTrue(response.getStatusCode().is2xxSuccessful());
        List<ReviewTypeDto> dtos = response.getBody();
        assertNotNull(dtos);
        assertEquals(1, dtos.size());
        assertEquals("type-1", dtos.get(0).getName());
    }
}
