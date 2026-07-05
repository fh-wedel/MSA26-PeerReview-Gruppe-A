import React, { useEffect, useState } from 'react';
import { useNotification } from "../contexts/NotificationContext";
import { QuestionInput } from "./review-form/QuestionInput";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Rating,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Slider,
  CircularProgress,
  Alert
} from '@mui/material';
import { configurationApiClient, responseApiClient } from '../api/clients';
import type { ReviewQuestionDto } from '../api/generated/configuration';

interface ReviewFormModalProps {
  open: boolean;
  onClose: () => void;
  submissionId: string;
  onSubmitted: () => void;
}

export const ReviewFormModal: React.FC<ReviewFormModalProps> = ({
  open,
  onClose,
  submissionId,
  onSubmitted
}) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [questions, setQuestions] = useState<ReviewQuestionDto[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [overallComments, setOverallComments] = useState('');
  const [finalGrade, setFinalGrade] = useState('');


  useEffect(() => {
    if (open && submissionId) {
      setLoading(true);
      setError(null);
      configurationApiClient.submissions.getFeedbackFormForSubmission(submissionId)
        .then(res => {
          if (res.data) {
            setQuestions(res.data);
            // initialize answers
            const initial: Record<string, string> = {};
            res.data.forEach(q => {
              if (q.type === 'RATING' || q.type === 'SCALE') {
                initial[q.id] = '0';
              } else {
                initial[q.id] = '';
              }
            });
            setAnswers(initial);
          }
        })
        .catch(err => {
          console.error("Failed to load schema", err);
          setError("Failed to load review schema.");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // reset
      setQuestions([]);
      setAnswers({});
      setOverallComments('');
      setFinalGrade('');
    }
  }, [open, submissionId]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    for (const q of questions) {
      if (q.required && (!answers[q.id] || answers[q.id] === '0')) {
        setError(`Please answer the required question: ${q.text}`);
        return;
      }
    }
    if (!overallComments.trim()) {
      setError("Please provide overall comments.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const answerPayload = Object.keys(answers).map(qId => ({
        questionId: qId,
        answer: answers[qId]
      }));

      await responseApiClient.results.resultsCreate({
        submissionId: submissionId,
        reviewComments: overallComments,
        finalGrade: finalGrade,
        answers: answerPayload
      });
      onSubmitted();
      onClose();
    } catch (e) {
      console.error("Failed to submit review", e);
      setError("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = (q: ReviewQuestionDto) => {
    return (
      <QuestionInput
        question={q}
        value={answers[q.id] || ''}
        handleAnswerChange={handleAnswerChange}
      />
    );
  };

  return (
    <Dialog open={open} onClose={!submitting ? onClose : undefined} fullWidth maxWidth="md">
      <DialogTitle>Submit Review</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {error && <Alert severity="error">{error}</Alert>}
            
            {questions.map(q => (
              <Box key={q.id}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
                  {q.text} {q.required && <span style={{ color: 'red' }}>*</span>}
                </Typography>
                {renderQuestionInput(q)}
              </Box>
            ))}

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
                Final Grade (Optional)
              </Typography>
              <TextField
                fullWidth
                value={finalGrade}
                onChange={e => setFinalGrade(e.target.value)}
                placeholder="e.g. A, 1.0, 95/100"
              />
            </Box>

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
                Overall Comments <span style={{ color: 'red' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={overallComments}
                onChange={e => setOverallComments(e.target.value)}
                placeholder="Summary of the review..."
              />
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit} 
          disabled={loading || submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
