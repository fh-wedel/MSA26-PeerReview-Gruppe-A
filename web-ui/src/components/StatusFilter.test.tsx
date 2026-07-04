import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {filterByStatus, sortByStatus, StatusFilter} from './StatusFilter';

describe('StatusFilter component', () => {
    const theme = createTheme();
    const defaultProps = {
        availableStatuses: ['PENDING', 'APPROVED', 'REJECTED'],
        selectedStatuses: ['PENDING'],
        onChange: vi.fn(),
    };

    const renderComponent = (props = defaultProps) => {
        return render(
            <ThemeProvider theme={theme}>
                <StatusFilter {...props} />
            </ThemeProvider>
        );
    };

    it('renders nothing when availableStatuses is empty', () => {
        const {container} = renderComponent({...defaultProps, availableStatuses: []});
        expect(container.firstChild).toBeNull();
    });

    it('renders "Filter by Status:" label', () => {
        renderComponent();
        expect(screen.getByText('Filter by Status:')).toBeInTheDocument();
    });

    it('renders a chip for each available status', () => {
        renderComponent();
        expect(screen.getByText('PENDING')).toBeInTheDocument();
        expect(screen.getByText('APPROVED')).toBeInTheDocument();
        expect(screen.getByText('REJECTED')).toBeInTheDocument();
    });

    it('calls onChange with added status when unselected chip is clicked', () => {
        renderComponent();
        fireEvent.click(screen.getByText('APPROVED'));
        expect(defaultProps.onChange).toHaveBeenCalledWith(['PENDING', 'APPROVED']);
    });

    it('calls onChange with removed status when selected chip is clicked', () => {
        renderComponent();
        fireEvent.click(screen.getByText('PENDING'));
        expect(defaultProps.onChange).toHaveBeenCalledWith([]);
    });
});

describe('StatusFilter pure functions', () => {
    const items = [
        {id: 1, status: 'PENDING'},
        {id: 2, status: 'APPROVED'},
        {id: 3, status: 'REJECTED'},
    ];

    describe('filterByStatus', () => {
        it('returns empty array when no statuses selected', () => {
            expect(filterByStatus(items, [])).toEqual([]);
        });

        it('filters items matching selected statuses', () => {
            expect(filterByStatus(items, ['APPROVED'])).toEqual([{id: 2, status: 'APPROVED'}]);
        });

        it('returns all items when all statuses selected', () => {
            expect(filterByStatus(items, ['PENDING', 'APPROVED', 'REJECTED'])).toEqual(items);
        });
    });

    describe('sortByStatus', () => {
        it('sorts items alphabetically by status', () => {
            const sorted = sortByStatus(items);
            expect(sorted).toEqual([
                {id: 2, status: 'APPROVED'},
                {id: 1, status: 'PENDING'},
                {id: 3, status: 'REJECTED'},
            ]);
        });

        it('does not mutate original array', () => {
            const sorted = sortByStatus(items);
            expect(sorted).not.toBe(items);
        });
    });
});
