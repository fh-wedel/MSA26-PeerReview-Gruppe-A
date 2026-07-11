package com.fh_wedel.configuration.controller;

import com.fh_wedel.configuration.api.ReviewTemplatePlugin;
import com.fh_wedel.configuration.api.model.ReviewQuestion;
import com.fh_wedel.configuration.api.model.QuestionType;
import com.fh_wedel.configuration.model.SubmissionConfiguration;
import com.fh_wedel.configuration.model.api.ReviewQuestionDto;
import com.fh_wedel.configuration.service.ConfigurationService;
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
class SubmissionReviewsControllerTest {

    @Mock
    private ConfigurationService configurationService;

    @Mock
    private PluginService pluginService;

    @InjectMocks
    private SubmissionReviewsController controller;

    @Test
    void testGetFeedbackFormForSubmission_Success() {
        SubmissionConfiguration config = new SubmissionConfiguration();
        config.setReviewTemplateType("template-a");
        when(configurationService.getConfiguration("sub1")).thenReturn(config);

        ReviewTemplatePlugin plugin = mock(ReviewTemplatePlugin.class);
        ReviewQuestion q1 = ReviewQuestion.text("q1", "Q?", 10);
        when(plugin.getFeedbackFormTemplate()).thenReturn(List.of(q1));

        when(pluginService.getReviewTemplate("template-a")).thenReturn(Optional.of(plugin));

        ResponseEntity<List<ReviewQuestionDto>> response = controller.getFeedbackFormForSubmission("sub1");

        assertTrue(response.getStatusCode().is2xxSuccessful());
        List<ReviewQuestionDto> questions = response.getBody();
        assertNotNull(questions);
        assertEquals(1, questions.size());
        assertEquals("q1", questions.get(0).getId());
    }

    @Test
    void testGetFeedbackFormForSubmission_ConfigNotFound() {
        when(configurationService.getConfiguration("sub1")).thenReturn(null);

        ResponseEntity<List<ReviewQuestionDto>> response = controller.getFeedbackFormForSubmission("sub1");

        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    void testGetFeedbackFormForSubmission_PluginNotFound() {
        SubmissionConfiguration config = new SubmissionConfiguration();
        config.setReviewTemplateType("template-a");
        when(configurationService.getConfiguration("sub1")).thenReturn(config);

        when(pluginService.getReviewTemplate("template-a")).thenReturn(Optional.empty());

        ResponseEntity<List<ReviewQuestionDto>> response = controller.getFeedbackFormForSubmission("sub1");

        assertEquals(404, response.getStatusCode().value());
    }
}
