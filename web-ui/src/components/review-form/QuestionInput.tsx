import React from "react";
import { TextField, Rating, FormControl, RadioGroup, FormControlLabel, Radio, Box, Slider } from "@mui/material";

interface ReviewQuestionDto {
  id: string;
  type: string;
  maxPoints?: number;
  options?: string[];
}

interface QuestionInputProps {
  question: ReviewQuestionDto;
  value: string;
  handleAnswerChange: (id: string, value: string) => void;
}

export const QuestionInput: React.FC<QuestionInputProps> = ({ question, value, handleAnswerChange }) => {
  switch (question.type) {
    case 'TEXT':
      return (
        <TextField
          fullWidth
          multiline
          rows={3}
          value={value}
          onChange={e => handleAnswerChange(question.id, e.target.value)}
          placeholder="Enter your feedback..."
        />
      );
    case 'RATING':
      return (
        <Rating
          value={parseFloat(value) || 0}
          max={question.maxPoints || 5}
          onChange={(_, newValue) => handleAnswerChange(question.id, newValue?.toString() || '0')}
        />
      );
    case 'MULTIPLE_CHOICE':
      return (
        <FormControl component="fieldset">
          <RadioGroup
            value={value}
            onChange={e => handleAnswerChange(question.id, e.target.value)}
          >
            {(question.options || []).map(opt => (
              <FormControlLabel key={opt} value={opt} control={<Radio />} label={opt} />
            ))}
          </RadioGroup>
        </FormControl>
      );
    case 'SCALE':
      return (
        <Box sx={{ px: 2 }}>
          <Slider
            value={parseFloat(value) || 0}
            min={0}
            max={question.maxPoints || 10}
            step={1}
            marks
            valueLabelDisplay="auto"
            onChange={(_, val) => handleAnswerChange(question.id, val.toString())}
          />
        </Box>
      );
    default:
      return null;
  }
};
