import React from 'react';
import { Box, Chip, Typography } from '@mui/material';

interface StatusFilterProps {
  availableStatuses: string[];
  selectedStatuses: string[];
  onChange: (newStatuses: string[]) => void;
}

export const StatusFilter: React.FC<StatusFilterProps> = ({ availableStatuses, selectedStatuses, onChange }) => {
  const toggleStatus = (status: string) => {
    if (selectedStatuses.includes(status)) {
      onChange(selectedStatuses.filter(s => s !== status));
    } else {
      onChange([...selectedStatuses, status]);
    }
  };

  if (availableStatuses.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>Filter by Status:</Typography>
      {availableStatuses.map(status => (
        <Chip
          key={status}
          label={status}
          clickable
          color={selectedStatuses.includes(status) ? 'primary' : 'default'}
          onClick={() => toggleStatus(status)}
          variant={selectedStatuses.includes(status) ? 'filled' : 'outlined'}
        />
      ))}
    </Box>
  );
};

export const filterByStatus = <T extends { status: string }>(items: T[], selectedStatuses: string[]) => {
  if (selectedStatuses.length === 0) return [];
  return items.filter(item => selectedStatuses.includes(item.status));
};

export const sortByStatus = <T extends { status: string }>(items: T[]) => {
  return [...items].sort((a, b) => a.status.localeCompare(b.status));
};
