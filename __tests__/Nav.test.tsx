import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Nav } from '@/components/Nav';

describe('Nav', () => {
  it('renders navigation links', () => {
    render(
      <Nav
        lang="en"
        theme="light"
        currentPage="news"
        onLangChange={() => {}}
        onThemeChange={() => {}}
      />
    );

    expect(screen.getByText('News')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
  });

  it('renders all nav links for news page', () => {
    render(
      <Nav
        lang="en"
        theme="light"
        currentPage="news"
        onLangChange={() => {}}
        onThemeChange={() => {}}
      />
    );

    const newsLink = screen.getByText('News');
    expect(newsLink).toBeInTheDocument();
  });

  it('calls onLangChange when language button is clicked', async () => {
    const onLangChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Nav
        lang="en"
        theme="light"
        currentPage="news"
        onLangChange={onLangChange}
        onThemeChange={() => {}}
      />
    );

    const koButton = screen.getByText('KO');
    await user.click(koButton);

    expect(onLangChange).toHaveBeenCalledWith('ko');
  });

  it('highlights active language', () => {
    const { rerender } = render(
      <Nav
        lang="en"
        theme="light"
        currentPage="news"
        onLangChange={() => {}}
        onThemeChange={() => {}}
      />
    );

    let enButton = screen.getByText('EN');
    expect(enButton).toHaveClass('active');

    rerender(
      <Nav
        lang="ko"
        theme="light"
        currentPage="news"
        onLangChange={() => {}}
        onThemeChange={() => {}}
      />
    );

    const koButton = screen.getByText('KO');
    expect(koButton).toHaveClass('active');
  });

  it('calls onThemeChange when theme button is clicked', async () => {
    const onThemeChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Nav
        lang="en"
        theme="light"
        currentPage="news"
        onLangChange={() => {}}
        onThemeChange={onThemeChange}
      />
    );

    const themeButton = screen.getByLabelText('theme');
    await user.click(themeButton);

    expect(onThemeChange).toHaveBeenCalledWith('dark');
  });

  it('shows correct SVG icon based on theme', () => {
    const { container, rerender } = render(
      <Nav
        lang="en"
        theme="light"
        currentPage="news"
        onLangChange={() => {}}
        onThemeChange={() => {}}
      />
    );

    let svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);

    rerender(
      <Nav
        lang="en"
        theme="dark"
        currentPage="news"
        onLangChange={() => {}}
        onThemeChange={() => {}}
      />
    );

    svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('displays korean labels when lang is ko', () => {
    render(
      <Nav
        lang="ko"
        theme="light"
        currentPage="news"
        onLangChange={() => {}}
        onThemeChange={() => {}}
      />
    );

    expect(screen.getByText('뉴스 분석')).toBeInTheDocument();
    expect(screen.getByText('포트폴리오')).toBeInTheDocument();
  });
});
