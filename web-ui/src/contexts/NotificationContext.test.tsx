import React from 'react';
import {describe, expect, it} from 'vitest';
import {act, render, screen} from '@testing-library/react';
import {NotificationProvider, useNotification} from './NotificationContext';

const TestComponent = () => {
    const {showError, showSuccess, showWarning} = useNotification();
    return (
        <div>
            <button onClick={() => showError('Error message', 'SYSTEM')}>Error</button>
            <button onClick={() => showSuccess('Success message')}>Success</button>
            <button onClick={() => showWarning('Warning message')}>Warning</button>
        </div>
    );
};

describe('NotificationContext', () => {
    const renderProvider = () => {
        return render(
            <NotificationProvider>
                <TestComponent/>
            </NotificationProvider>
        );
    };

    it('initial state is hidden', () => {
        renderProvider();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('showError displays snackbar with message and source', async () => {
        renderProvider();

        act(() => {
            screen.getByText('Error').click();
        });

        const alert = await screen.findByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(screen.getByText('Error message')).toBeInTheDocument();
        expect(screen.getByText('[SYSTEM]')).toBeInTheDocument();
    });

    it('showSuccess displays snackbar without source', async () => {
        renderProvider();

        act(() => {
            screen.getByText('Success').click();
        });

        const alert = await screen.findByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(screen.getByText('Success message')).toBeInTheDocument();
        expect(screen.queryByText('[SYSTEM]')).not.toBeInTheDocument();
    });
});
