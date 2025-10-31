import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProfitChip } from '../ProfitChip';

describe('ProfitChip', () => {
  it('renders positive profit', () => {
    render(<ProfitChip profit={50} margin={0.3} />);
    expect(screen.getByText(/\+50/)).toBeDefined();
  });

  it('renders zero profit', () => {
    render(<ProfitChip profit={0} margin={0} />);
    expect(screen.getByText(/0/)).toBeDefined();
  });

  it('renders negative profit', () => {
    render(<ProfitChip profit={-25} margin={-0.1} />);
    expect(screen.getByText(/-25/)).toBeDefined();
  });

  it('applies different styles for high margin', () => {
    const { container } = render(<ProfitChip profit={100} margin={0.6} />);
    const chip = container.querySelector('span');
    expect(chip?.className).toContain('emerald');
  });
});

