import React from "react";
import { Autocomplete, TextField } from "@mui/material";
import type { UserSummary } from "../../api/communication";

interface CustomReviewerFieldProps {
  canAddCustomReviewer: boolean;
  reviewerOptions: UserSummary[];
  selectedCustomReviewers: UserSummary[];
  setSelectedCustomReviewers: (val: UserSummary[]) => void;
  submitting: boolean;
  reviewersLoading: boolean;
}

export const CustomReviewerField: React.FC<CustomReviewerFieldProps> = ({
  canAddCustomReviewer,
  reviewerOptions,
  selectedCustomReviewers,
  setSelectedCustomReviewers,
  submitting,
  reviewersLoading
}) => {
  if (!canAddCustomReviewer) return null;

  return (
    <Autocomplete
      multiple
      options={reviewerOptions}
      getOptionLabel={(option) => option.username}
      value={selectedCustomReviewers}
      onChange={(_, newValue) => setSelectedCustomReviewers(newValue)}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      disabled={submitting}
      loading={reviewersLoading}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Custom Reviewers (Optional)"
          variant="outlined"
          fullWidth
          helperText="Select specific reviewers to bypass the automatic matching process."
        />
      )}
    />
  );
};
