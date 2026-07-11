import React from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

interface ReviewTemplateFieldProps {
  reviewTemplateType: string;
  setReviewTemplateType: (val: string) => void;
  loading: boolean;
  submitting: boolean;
  templates: any[];
}

export const ReviewTemplateField: React.FC<ReviewTemplateFieldProps> = ({
  reviewTemplateType,
  setReviewTemplateType,
  loading,
  submitting,
  templates
}) => {
  return (
    <FormControl fullWidth>
      <InputLabel id="review-template-label">Review Template</InputLabel>
      <Select
        labelId="review-template-label"
        value={reviewTemplateType}
        label="Review Template"
        onChange={(e) => setReviewTemplateType(e.target.value as string)}
        disabled={loading || submitting}
      >
        {templates.length > 0 ? (
          templates.map((template) => (
            <MenuItem key={template.name} value={template.name || ""}>
              {template.title}
            </MenuItem>
          ))
        ) : [
          <MenuItem key="INDIVIDUAL_WORK" value="INDIVIDUAL_WORK">Individual Work</MenuItem>,
          <MenuItem key="GROUP_WORK" value="GROUP_WORK">Group Work</MenuItem>,
          <MenuItem key="BACHELOR_THESIS" value="BACHELOR_THESIS">Bachelor Thesis</MenuItem>,
          <MenuItem key="MASTER_THESIS" value="MASTER_THESIS">Master Thesis</MenuItem>,
          <MenuItem key="SEMINAR" value="SEMINAR">Seminar</MenuItem>,
        ]}
      </Select>
    </FormControl>
  );
};
