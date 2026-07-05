import React from "react";
import { FormControl, InputLabel, Select, MenuItem, FormHelperText } from "@mui/material";

interface TopicTagFieldProps {
  topicTag: string;
  setTopicTag: (val: string) => void;
  tagsLoading: boolean;
  submitting: boolean;
  topicTags: any[];
  hasAttemptedSubmit: boolean;
}

export const TopicTagField: React.FC<TopicTagFieldProps> = ({
  topicTag,
  setTopicTag,
  tagsLoading,
  submitting,
  topicTags,
  hasAttemptedSubmit
}) => {
  return (
    <FormControl fullWidth error={hasAttemptedSubmit && !topicTag}>
      <InputLabel id="topic-tag-label">Topic Tag *</InputLabel>
      <Select
        labelId="topic-tag-label"
        value={topicTag}
        label="Topic Tag *"
        onChange={(e) => setTopicTag(e.target.value as string)}
        disabled={tagsLoading || submitting}
      >
        {topicTags.map((tag: any) => (
          <MenuItem key={tag.tagName} value={tag.tagName || ""}>
            {tag.tagName}
          </MenuItem>
        ))}
      </Select>
      {hasAttemptedSubmit && !topicTag && <FormHelperText>Topic tag is required</FormHelperText>}
    </FormControl>
  );
};
