import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';

import { appTheme } from '../theme/theme';
import { CalendarFeedback } from './CalendarFeedback';

describe('CalendarFeedback', () => {
  const renderComponent = (props: Partial<React.ComponentProps<typeof CalendarFeedback>> = {}) => {
    const defaultProps: React.ComponentProps<typeof CalendarFeedback> = {
      error: '',
      suggestion: null,
      suggestionLabel: 'Suggested time',
      suggestionActionLabel: 'Use suggested time',
      viewTimeZone: 'UTC',
      onUseSuggestedTime: undefined,
      isMobile: false,
    };

    return render(
      <ThemeProvider theme={appTheme}>
        <CalendarFeedback {...defaultProps} {...props} />
      </ThemeProvider>
    );
  };

  it('renders an error alert when error text is provided', () => {
    renderComponent({
      error: 'Overlap detected',
    });

    expect(screen.getByText('Overlap detected')).toBeInTheDocument();
  });

  it('renders the formatted suggested time range', () => {
    renderComponent({
      suggestion: {
        startUtc: '2026-04-10T09:00:00.000Z',
        endUtc: '2026-04-10T10:00:00.000Z',
      },
    });

    expect(screen.getByText(/Suggested time:/)).toBeInTheDocument();
    expect(screen.getByText(/Apr 10, 2026/)).toBeInTheDocument();
  });

  it('renders suggested time info and calls the action callback', async () => {
    const user = userEvent.setup();
    const onUseSuggestedTime = vi.fn();

    renderComponent({
      suggestion: {
        startUtc: '2026-04-10T09:00:00.000Z',
        endUtc: '2026-04-10T10:00:00.000Z',
      },
      onUseSuggestedTime,
    });

    expect(screen.getByText(/Suggested time:/)).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Use suggested time' })
    );

    expect(onUseSuggestedTime).toHaveBeenCalledWith({
      startUtc: '2026-04-10T09:00:00.000Z',
      endUtc: '2026-04-10T10:00:00.000Z',
    });
  });
});