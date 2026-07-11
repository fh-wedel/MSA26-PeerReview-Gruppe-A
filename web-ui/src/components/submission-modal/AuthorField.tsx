import React from "react";
import { Autocomplete, TextField } from "@mui/material";
import type { UserSummary } from "../../api/communication";
import { validateAuthorsChange } from "../../utils/submissionValidation";

interface AuthorFieldProps {
  authorOptions: UserSummary[];
  selectedAuthors: UserSummary[];
  setSelectedAuthors: (val: UserSummary[]) => void;
  validationError: string;
  setValidationError: (err: string) => void;
  hasAttemptedSubmit: boolean;
  canEditAuthors: boolean;
  isFixedAuthors: boolean;
  authorsLoading: boolean;
  isAdminOrTeacher: boolean;
  currentUserId: string;
  activeTemplate: any;
}

export const AuthorField: React.FC<AuthorFieldProps> = ({
  authorOptions,
  selectedAuthors,
  setSelectedAuthors,
  validationError,
  setValidationError,
  hasAttemptedSubmit,
  canEditAuthors,
  isFixedAuthors,
  authorsLoading,
  isAdminOrTeacher,
  currentUserId,
  activeTemplate
}) => {
  return (
    <Autocomplete
      multiple
      options={authorOptions}
      getOptionLabel={(option) => option.username}
      value={selectedAuthors}
      onChange={(_, newValue) => {
        const err = validateAuthorsChange(newValue, currentUserId, isAdminOrTeacher, isFixedAuthors, activeTemplate);
        if (err && !err.includes('At least')) {
          setValidationError(err);
          return;
        }
        setValidationError(err);
        setSelectedAuthors(newValue);
      }}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      disabled={!canEditAuthors}
      loading={authorsLoading}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Authors *"
          variant="outlined"
          fullWidth
          error={hasAttemptedSubmit && !!validationError}
          helperText={
            validationError ||
            (!canEditAuthors
              ? "Author selection is locked for this template or your role."
              : isFixedAuthors ? "Exactly one author is required." : "Select one or more authors.")
          }
        />
      )}
    />
  );
};
