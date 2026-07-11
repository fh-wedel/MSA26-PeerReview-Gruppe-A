import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionInput } from './QuestionInput';
import React from 'react';

describe('QuestionInput', () => {
  it('renders TEXT input', () => {
    const handleAnswerChange = vi.fn();
    const q = { id: 'q1', type: 'TEXT' };
    render(<QuestionInput question={q} value="abc" handleAnswerChange={handleAnswerChange} />);
    const input = screen.getByPlaceholderText('Enter your feedback...');
    fireEvent.change(input, { target: { value: 'def' } });
    expect(handleAnswerChange).toHaveBeenCalledWith('q1', 'def');
  });

  it('renders RATING input', () => {
    const handleAnswerChange = vi.fn();
    const q = { id: 'q2', type: 'RATING', maxPoints: 5 };
    render(<QuestionInput question={q} value="3" handleAnswerChange={handleAnswerChange} />);
    // Testing library's rating component requires specific ways to interact,
    // but verifying it doesn't crash and renders is a good start.
  });

  it('renders MULTIPLE_CHOICE input', () => {
    const handleAnswerChange = vi.fn();
    const q = { id: 'q3', type: 'MULTIPLE_CHOICE', options: ['A', 'B'] };
    render(<QuestionInput question={q} value="A" handleAnswerChange={handleAnswerChange} />);
    const radio = screen.getByLabelText('B');
    fireEvent.click(radio);
    expect(handleAnswerChange).toHaveBeenCalledWith('q3', 'B');
  });

  it('renders SCALE input', () => {
    const handleAnswerChange = vi.fn();
    const q = { id: 'q4', type: 'SCALE', maxPoints: 10 };
    render(<QuestionInput question={q} value="5" handleAnswerChange={handleAnswerChange} />);
  });

  it('renders null for unknown type', () => {
    const handleAnswerChange = vi.fn();
    const q = { id: 'q5', type: 'UNKNOWN' };
    const { container } = render(<QuestionInput question={q} value="" handleAnswerChange={handleAnswerChange} />);
    expect(container.firstChild).toBeNull();
  });
});
