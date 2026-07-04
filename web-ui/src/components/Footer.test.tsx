import React from 'react';
import {describe, expect, it} from 'vitest';
import {render, screen} from '@testing-library/react';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {Footer} from './Footer';

describe('Footer', () => {
    const theme = createTheme();

    const renderFooter = () => {
        return render(
            <ThemeProvider theme={theme}>
                <Footer/>
            </ThemeProvider>
        );
    };

    it('renders the current year in the copyright text', () => {
        renderFooter();
        const currentYear = new Date().getFullYear();
        expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
    });

    it('renders the FH Wedel link with correct href', () => {
        renderFooter();
        const link = screen.getByText('FH Wedel');
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', 'https://www.fh-wedel.de');
        expect(link).toHaveAttribute('target', '_blank');
    });

    it('renders the GitHub link with correct href', () => {
        renderFooter();
        const link = screen.getByText('GitHub');
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', 'https://github.com/fh-wedel/MSA26-PeerReview-Gruppe-A');
        expect(link).toHaveAttribute('target', '_blank');
    });
});
