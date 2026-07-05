package com.fh_wedel.configuration.controller;

import com.fh_wedel.configuration.api.ReviewTemplatePlugin;
import com.fh_wedel.configuration.api.model.ReviewQuestion;
import com.fh_wedel.configuration.api.model.QuestionType;
import com.fh_wedel.configuration.model.api.ReviewTemplateDto;
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
class ReviewTemplatesControllerTest {

    @Mock
    private PluginService pluginService;

    @InjectMocks
    private ReviewTemplatesController controller;

    @Test
    void testGetReviewTemplate_Found() {
        ReviewTemplatePlugin plugin = mock(ReviewTemplatePlugin.class);
        when(plugin.getName()).thenReturn("test-template");
        when(plugin.getTitle()).thenReturn("Test Title");
        when(plugin.getDescription()).thenReturn("Desc");
        when(plugin.isEvaluationCriteriaVisibleToAuthors()).thenReturn(true);
        when(plugin.getMinAuthors()).thenReturn(1);
        when(plugin.getMaxAuthors()).thenReturn(2);
        when(plugin.getMinReviewers()).thenReturn(2);
        when(plugin.getMaxReviewers()).thenReturn(3);
        when(plugin.getSubmissionDurationDays()).thenReturn(14);
        when(plugin.getReviewDurationDays()).thenReturn(7);

        ReviewQuestion q1 = ReviewQuestion.text("q1", "Text?", 10);
        when(plugin.getFeedbackFormTemplate()).thenReturn(List.of(q1));

        when(pluginService.getReviewTemplate("test-template")).thenReturn(Optional.of(plugin));

        ResponseEntity<ReviewTemplateDto> response = controller.getReviewTemplate("test-template");

        assertTrue(response.getStatusCode().is2xxSuccessful());
        ReviewTemplateDto dto = response.getBody();
        assertNotNull(dto);
        assertEquals("test-template", dto.getName());
        assertEquals("Test Title", dto.getTitle());
        assertEquals(1, dto.getFeedbackFormTemplate().size());
        assertEquals("q1", dto.getFeedbackFormTemplate().get(0).getId());
    }

    @Test
    void testGetReviewTemplate_NotFound() {
        when(pluginService.getReviewTemplate("test-template")).thenReturn(Optional.empty());

        ResponseEntity<ReviewTemplateDto> response = controller.getReviewTemplate("test-template");

        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    void testListReviewTemplates() {
        ReviewTemplatePlugin plugin = mock(ReviewTemplatePlugin.class);
        when(plugin.getName()).thenReturn("test-template");
        when(plugin.getTitle()).thenReturn("Test Title");
        when(plugin.getFeedbackFormTemplate()).thenReturn(List.of());

        when(pluginService.getReviewTemplates()).thenReturn(List.of(plugin));

        ResponseEntity<List<ReviewTemplateDto>> response = controller.listReviewTemplates();

        assertTrue(response.getStatusCode().is2xxSuccessful());
        List<ReviewTemplateDto> dtos = response.getBody();
        assertNotNull(dtos);
        assertEquals(1, dtos.size());
        assertEquals("test-template", dtos.get(0).getName());
    }
}
