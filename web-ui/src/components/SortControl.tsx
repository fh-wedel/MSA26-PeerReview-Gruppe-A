import React from 'react';
import type {SelectChangeEvent} from '@mui/material';
import {Box, FormControl, IconButton, InputLabel, MenuItem, Select} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

export type SortDirection = 'asc' | 'desc';

export interface SortOption {
    label: string;
    value: string;
}

interface SortControlProps {
    options: SortOption[];
    value: string;
    onChange: (value: string) => void;
    direction: SortDirection;
    onDirectionChange: (direction: SortDirection) => void;
}

export const SortControl: React.FC<SortControlProps> = ({options, value, onChange, direction, onDirectionChange}) => {
    const handleSelectChange = (event: SelectChangeEvent) => {
        onChange(event.target.value);
    };

    const toggleDirection = () => {
        onDirectionChange(direction === 'asc' ? 'desc' : 'asc');
    };

    return (
        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
            <FormControl size="small" sx={{minWidth: 150}}>
                <InputLabel id="sort-select-label">Sort by</InputLabel>
                <Select
                    labelId="sort-select-label"
                    value={value}
                    label="Sort by"
                    onChange={handleSelectChange}
                >
                    {options.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <IconButton onClick={toggleDirection} size="small" color="primary">
                {direction === 'asc' ? <ArrowUpwardIcon/> : <ArrowDownwardIcon/>}
            </IconButton>
        </Box>
    );
};

export const sortItems = <T extends Record<string, any>>(items: T[], sortBy: string, direction: SortDirection) => {
    return [...items].sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (valA instanceof Date) valA = valA.getTime();
        if (valB instanceof Date) valB = valB.getTime();

        if (typeof valA === 'string' && typeof valB === 'string') {
            // Check if they are valid ISO dates
            const dateA = Date.parse(valA);
            const dateB = Date.parse(valB);
            if (!isNaN(dateA) && !isNaN(dateB)) {
                valA = dateA;
                valB = dateB;
            } else {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
};
