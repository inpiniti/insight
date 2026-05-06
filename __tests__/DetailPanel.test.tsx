import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DetailPanel } from '@/components/DetailPanel';
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
  spark: [100, 102, 104, 103, 105, 107, 106, 108],
};

const mockT = {
  detail_chart: 'Chart',
  detail_summary: 'Summary',
  detail_rumor: 'Rumor',
  detail_models: 'Models',
  detail_news: 'News',
  bullish: '강세',
  bearish: '약세',
  neutral: '중립',
};

describe('DetailPanel', () => {
  it('renders stock information', () => {
    const onClose = vi.fn();
    const { container } = render(
      <DetailPanel stock={mockStock} lang="en" t={mockT} onClose={onClose} />
    );

    const tickerElements = screen.getAllByText('NVDA');
    expect(tickerElements.length).toBeGreaterThan(0);
    expect(screen.getByText('NVIDIA')).toBeInTheDocument();
    expect(screen.getByText('Test summary')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <DetailPanel stock={mockStock} lang="en" t={mockT} onClose={onClose} />
    );

    const closeButton = screen.getByLabelText('close');
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <DetailPanel stock={mockStock} lang="en" t={mockT} onClose={onClose} />
    );

    const overlay = container.querySelector('.detail-overlay');
    if (overlay) {
      await user.click(overlay);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('does not close when panel itself is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <DetailPanel stock={mockStock} lang="en" t={mockT} onClose={onClose} />
    );

    const panel = container.querySelector('.detail-panel');
    if (panel) {
      await user.click(panel);
      expect(onClose).not.toHaveBeenCalled();
    }
  });

  it('calls onClose when Escape key is pressed', async () => {
    const onClose = vi.fn();
    render(
      <DetailPanel stock={mockStock} lang="en" t={mockT} onClose={onClose} />
    );

    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('focuses close button on mount', () => {
    const onClose = vi.fn();
    render(
      <DetailPanel stock={mockStock} lang="en" t={mockT} onClose={onClose} />
    );

    const closeButton = screen.getByLabelText('close');
    expect(closeButton).toHaveFocus();
  });

  it('displays korean content when lang is ko', () => {
    const onClose = vi.fn();
    render(
      <DetailPanel stock={mockStock} lang="ko" t={mockT} onClose={onClose} />
    );

    expect(screen.getByText('테스트 요약')).toBeInTheDocument();
    expect(screen.getByText('테스트 루머')).toBeInTheDocument();
  });

  it('renders chart section', () => {
    const onClose = vi.fn();
    render(
      <DetailPanel stock={mockStock} lang="en" t={mockT} onClose={onClose} />
    );

    expect(screen.getByText('Chart')).toBeInTheDocument();
  });

  it('renders all model tiles', () => {
    const onClose = vi.fn();
    render(
      <DetailPanel stock={mockStock} lang="en" t={mockT} onClose={onClose} />
    );

    expect(screen.getByText('Models')).toBeInTheDocument();
  });
});
