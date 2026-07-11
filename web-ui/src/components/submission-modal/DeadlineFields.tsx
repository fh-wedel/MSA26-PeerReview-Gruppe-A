import React from "react";
import { TextField } from "@mui/material";

interface DeadlineFieldsProps {
  submissionDeadline: Date;
  setSubmissionDeadline: (date: Date) => void;
  reviewDeadline: Date;
  setReviewDeadline: (date: Date) => void;
  isFixedDeadlines: boolean;
  submitting: boolean;
}

export const DeadlineFields: React.FC<DeadlineFieldsProps> = ({
  submissionDeadline,
  setSubmissionDeadline,
  reviewDeadline,
  setReviewDeadline,
  isFixedDeadlines,
  submitting
}) => {
  return (
    <>
      <TextField
        label="Submission Deadline"
        type="date"
        variant="outlined"
        fullWidth
        value={submissionDeadline.toISOString().split('T')[0]}
        onChange={(e) => setSubmissionDeadline(new Date(e.target.value))}
        disabled={isFixedDeadlines || submitting}
        slotProps={{ inputLabel: { shrink: true } }}
        helperText={isFixedDeadlines ? "Submission deadline is fixed for this template." : ""}
      />

      <TextField
        label="Review Deadline"
        type="date"
        variant="outlined"
        fullWidth
        value={reviewDeadline.toISOString().split('T')[0]}
        onChange={(e) => setReviewDeadline(new Date(e.target.value))}
        disabled={isFixedDeadlines || submitting}
        slotProps={{ inputLabel: { shrink: true } }}
        helperText={isFixedDeadlines ? "Review deadline is fixed for this template." : ""}
      />
    </>
  );
};
