import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Calendar } from '@/components/Calendar';

describe('Calendar', () => {
  it('renders calendar for the selected month', () => {
    render(<Calendar selected="2026-04-30" onSelect={() => {}} lang="en" />);
    expect(screen.getByText(/Apr 2026/)).toBeInTheDocument();
  });

  it('calls onSelect when a date is clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Calendar selected="2026-04-30" onSelect={onSelect} lang="en" />);

    const dateButtons = screen.getAllByRole('button').filter((btn) => !btn.querySelector('svg'));
    const firstDate = dateButtons[0];
    await user.click(firstDate);

    expect(onSelect).toHaveBeenCalled();
  });

  it('highlights selected date with aria-pressed', () => {
    render(<Calendar selected="2026-04-15" onSelect={() => {}} lang="en" />);
    const dateButtons = screen.getAllByRole('button').filter((btn) => !btn.querySelector('svg'));
    const selected = dateButtons.find((btn) => btn.getAttribute('aria-pressed') === 'true');
    expect(selected).toBeInTheDocument();
  });

  it('navigates to previous month when prev button is clicked', async () => {
    const user = userEvent.setup();
    render(<Calendar selected="2026-04-30" onSelect={() => {}} lang="en" />);

    const prevButton = screen.getByLabelText('prev');
    await user.click(prevButton);

    expect(screen.getByText(/Mar 2026/)).toBeInTheDocument();
  });

  it('navigates to next month when next button is clicked', async () => {
    const user = userEvent.setup();
    render(<Calendar selected="2026-04-30" onSelect={() => {}} lang="en" />);

    const nextButton = screen.getByLabelText('next');
    await user.click(nextButton);

    expect(screen.getByText(/May 2026/)).toBeInTheDocument();
  });

  it('calls onSelect when Enter key is pressed on a date', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Calendar selected="2026-04-30" onSelect={onSelect} lang="en" />);

    const dateButtons = screen.getAllByRole('button').filter((btn) => !btn.querySelector('svg'));
    const firstDate = dateButtons[0];
    firstDate.focus();
    await user.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalled();
  });

  it('renders korean month name when lang is ko', () => {
    render(<Calendar selected="2026-04-30" onSelect={() => {}} lang="ko" />);
    expect(screen.getByText(/2026년 4월/)).toBeInTheDocument();
  });

  it('renders day headers in correct language', () => {
    const { rerender } = render(
      <Calendar selected="2026-04-30" onSelect={() => {}} lang="en" />
    );
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();

    rerender(<Calendar selected="2026-04-30" onSelect={() => {}} lang="ko" />);
    expect(screen.getByText('일')).toBeInTheDocument();
    expect(screen.getByText('월')).toBeInTheDocument();
  });
});
