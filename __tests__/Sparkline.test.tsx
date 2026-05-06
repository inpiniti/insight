import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sparkline, DetailChart } from '@/components/Sparkline';

const mockData = [100, 102, 104, 103, 105, 107, 106, 108];

describe('Sparkline', () => {
  it('renders SVG with role="img"', () => {
    render(<Sparkline data={mockData} tone="bullish" />);
    const svg = screen.getByRole('img');
    expect(svg).toBeInTheDocument();
  });

  it('renders with default aria-label when no ticker provided', () => {
    render(<Sparkline data={mockData} tone="bullish" />);
    expect(screen.getByLabelText('price sparkline')).toBeInTheDocument();
  });

  it('renders with ticker in aria-label when provided', () => {
    render(<Sparkline data={mockData} tone="bullish" ticker="AAPL" />);
    expect(screen.getByLabelText('AAPL sparkline')).toBeInTheDocument();
  });

  it('renders area element when showArea is true', () => {
    const { container } = render(
      <Sparkline data={mockData} tone="bullish" showArea={true} />
    );
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(1);
  });

  it('does not render area when showArea is false', () => {
    const { container } = render(
      <Sparkline data={mockData} tone="bullish" showArea={false} />
    );
    const svg = screen.getByRole('img');
    const areaPath = Array.from(svg.querySelectorAll('path')).filter(
      (p) => p.getAttribute('fill') !== 'none'
    );
    expect(areaPath.length).toBe(0);
  });

  it('applies custom height style', () => {
    const { container } = render(
      <Sparkline data={mockData} tone="bullish" height={80} />
    );
    const wrapper = container.querySelector('.spark-wrap');
    expect(wrapper).toHaveStyle('height: 80px');
  });
});

describe('DetailChart', () => {
  it('renders SVG with role="img"', () => {
    render(<DetailChart data={mockData} tone="bullish" />);
    const svg = screen.getByRole('img');
    expect(svg).toBeInTheDocument();
  });

  it('renders with default aria-label when no ticker provided', () => {
    render(<DetailChart data={mockData} tone="bullish" />);
    expect(screen.getByLabelText('30-day chart')).toBeInTheDocument();
  });

  it('renders with ticker in aria-label when provided', () => {
    render(<DetailChart data={mockData} tone="bearish" ticker="MSFT" />);
    expect(screen.getByLabelText('MSFT 30-day chart')).toBeInTheDocument();
  });

  it('renders grid lines', () => {
    const { container } = render(
      <DetailChart data={mockData} tone="neutral" />
    );
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBe(3);
  });

  it('renders endpoint circle', () => {
    const { container } = render(
      <DetailChart data={mockData} tone="bullish" />
    );
    const circle = container.querySelector('circle');
    expect(circle).toBeInTheDocument();
    expect(circle).toHaveAttribute('r', '4');
  });
});
