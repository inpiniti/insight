import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StockCard } from '@/components/StockCard';
import { Stock } from '@/lib/data';

const mockStock: Stock = {
  rank: 1,
  ticker: 'NVDA',
  name: 'NVIDIA',
  sector: 'Information Tech',
  sentiment: 'bearish',
  confidence: 90,
  consensus: '3/5',
  summary_ko: '테스트 요약',
  summary_en: 'Test summary',
  rumor: 'BUY',
  rumor_note_ko: '테스트 루머',
  rumor_note_en: 'Test rumor',
  models: { xgb: 'neutral', rl: 'up', times: 'down', chrono: 'up', moirai: 'up' },
  price: 1187.42,
  changePct: 2.41,
  newsItems: 5,
  spark: [100, 102, 104, 103, 105],
};

const mockT = {
  consensus: (c: string) => c,
  confidence: '신뢰도',
  bullish: '강세',
  bearish: '약세',
  neutral: '중립',
};

describe('StockCard', () => {
  it('renders stock information correctly', () => {
    const onClick = vi.fn();
    render(
      <StockCard stock={mockStock} lang="en" t={mockT} onClick={onClick} />
    );

    expect(screen.getByText('NVDA')).toBeInTheDocument();
    expect(screen.getByText('NVIDIA')).toBeInTheDocument();
    expect(screen.getByText('Information Tech')).toBeInTheDocument();
    expect(screen.getByText('Test summary')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <StockCard stock={mockStock} lang="en" t={mockT} onClick={onClick} />
    );

    const card = screen.getByRole('button');
    await user.click(card);

    expect(onClick).toHaveBeenCalledWith(mockStock);
  });

  it('calls onClick when Enter key is pressed', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <StockCard stock={mockStock} lang="en" t={mockT} onClick={onClick} />
    );

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalledWith(mockStock);
  });

  it('applies sentiment class to score element', () => {
    const onClick = vi.fn();
    render(
      <StockCard stock={mockStock} lang="en" t={mockT} onClick={onClick} />
    );

    const scoreNum = screen.getByText('90');
    expect(scoreNum).toHaveClass('bearish');
  });

  it('displays korean content when lang is ko', () => {
    const onClick = vi.fn();
    render(
      <StockCard stock={mockStock} lang="ko" t={mockT} onClick={onClick} />
    );

    expect(screen.getByText('테스트 요약')).toBeInTheDocument();
    expect(screen.getByText('테스트 루머')).toBeInTheDocument();
  });

  it('has correct role and tabIndex for accessibility', () => {
    const onClick = vi.fn();
    render(
      <StockCard stock={mockStock} lang="en" t={mockT} onClick={onClick} />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabIndex', '0');
  });
});
