import React from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

interface ReviewTypeFieldProps {
  reviewType: string;
  setReviewType: (val: string) => void;
  loading: boolean;
  submitting: boolean;
  types: any[];
}

export const ReviewTypeField: React.FC<ReviewTypeFieldProps> = ({
  reviewType,
  setReviewType,
  loading,
  submitting,
  types
}) => {
  return (
    <FormControl fullWidth>
      <InputLabel id="review-type-label">Review Type</InputLabel>
      <Select
        labelId="review-type-label"
        value={reviewType}
        label="Review Type"
        onChange={(e) => setReviewType(e.target.value as string)}
        disabled={loading || submitting}
      >
        {types.length > 0 ? (
          types.map((plugin) => (
            <MenuItem key={plugin.name} value={plugin.name}>
              {plugin.title}
            </MenuItem>
          ))
        ) : [
          <MenuItem key="SINGLE_BLIND" value="SINGLE_BLIND">Single Blind Review</MenuItem>,
          <MenuItem key="DOUBLE_BLIND" value="DOUBLE_BLIND">Double Blind Review</MenuItem>,
          <MenuItem key="OPEN_REVIEW" value="OPEN_REVIEW">Open Review</MenuItem>,
        ]}
      </Select>
    </FormControl>
  );
};
