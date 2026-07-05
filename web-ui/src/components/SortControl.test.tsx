import {describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {SortControl, sortItems} from './SortControl';

describe('SortControl component', () => {
    const theme = createTheme();

    const defaultProps = {
        options: [
            {label: 'Name', value: 'name'},
            {label: 'Date', value: 'date'}
        ],
        value: 'name',
        onChange: vi.fn(),
        direction: 'asc' as const,
        onDirectionChange: vi.fn(),
    };

    const renderComponent = (props = defaultProps) => {
        return render(
            <ThemeProvider theme={theme}>
                <SortControl {...props} />
            </ThemeProvider>
        );
    };

    it('renders the "Sort by" label', () => {
        renderComponent();
        expect(screen.getByLabelText('Sort by')).toBeInTheDocument();
    });

    it('calls onDirectionChange when direction toggle is clicked', () => {
        renderComponent();
        const button = screen.getByRole('button', {name: ''}); // The IconButton doesn't have an aria-label, but it's the only button
        fireEvent.click(button);
        expect(defaultProps.onDirectionChange).toHaveBeenCalledWith('desc');
    });
});

describe('sortItems function', () => {
    it('sorts strings alphabetically ascending', () => {
        const items = [{name: 'B'}, {name: 'A'}, {name: 'C'}];
        const sorted = sortItems(items, 'name', 'asc');
        expect(sorted).toEqual([{name: 'A'}, {name: 'B'}, {name: 'C'}]);
    });

    it('sorts strings alphabetically descending', () => {
        const items = [{name: 'B'}, {name: 'A'}, {name: 'C'}];
        const sorted = sortItems(items, 'name', 'desc');
        expect(sorted).toEqual([{name: 'C'}, {name: 'B'}, {name: 'A'}]);
    });

    it('sorts numbers ascending', () => {
        const items = [{count: 2}, {count: 1}, {count: 3}];
        const sorted = sortItems(items, 'count', 'asc');
        expect(sorted).toEqual([{count: 1}, {count: 2}, {count: 3}]);
    });

    it('sorts ISO date strings correctly', () => {
        const items = [{date: '2024-02-01T10:00:00Z'}, {date: '2024-01-01T10:00:00Z'}];
        const sorted = sortItems(items, 'date', 'asc');
        expect(sorted).toEqual([{date: '2024-01-01T10:00:00Z'}, {date: '2024-02-01T10:00:00Z'}]);
    });

    it('does not mutate the original array', () => {
        const items = [{name: 'B'}, {name: 'A'}];
        const sorted = sortItems(items, 'name', 'asc');
        expect(sorted).not.toBe(items);
        expect(items).toEqual([{name: 'B'}, {name: 'A'}]);
    });

    it('returns empty array for empty input', () => {
        expect(sortItems([], 'name', 'asc')).toEqual([]);
    });
});
