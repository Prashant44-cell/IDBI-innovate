import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MPINSetup from '@/components/auth/MPINSetup';

describe('MPINSetup', () => {
  const mockOnSuccess = jest.fn();
  const mockOnSkip = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create mode correctly', () => {
    render(<MPINSetup onSuccess={mockOnSuccess} onSkip={mockOnSkip} mode="create" />);
    expect(screen.getByText('Set Payment MPIN')).toBeInTheDocument();
    expect(screen.getByText('Create a secure 6-digit PIN for payments')).toBeInTheDocument();
    expect(screen.getByText('Skip for now')).toBeInTheDocument();
  });

  it('renders confirm mode correctly', () => {
    render(<MPINSetup onSuccess={mockOnSuccess} mode="confirm" mpinToConfirm="123456" />);
    expect(screen.getByText('Confirm MPIN')).toBeInTheDocument();
    expect(screen.getByText('Re-enter your 6-digit PIN to confirm')).toBeInTheDocument();
    expect(screen.queryByText('Skip for now')).not.toBeInTheDocument();
  });

  it('allows entering digits and triggers onSuccess when 6 digits are entered in create mode', async () => {
    render(<MPINSetup onSuccess={mockOnSuccess} mode="create" />);
    
    const btn1 = screen.getByText('1');
    const btn2 = screen.getByText('2');
    const btn3 = screen.getByText('3');
    const btn4 = screen.getByText('4');
    const btn5 = screen.getByText('5');
    const btn6 = screen.getByText('6');

    fireEvent.click(btn1);
    fireEvent.click(btn2);
    fireEvent.click(btn3);
    fireEvent.click(btn4);
    fireEvent.click(btn5);
    fireEvent.click(btn6);

    // onSuccess is triggered inside a setTimeout(..., 180), so we must wait
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith('123456');
    });
  });

  it('shows error on mismatch in confirm mode', async () => {
    render(<MPINSetup onSuccess={mockOnSuccess} mode="confirm" mpinToConfirm="123456" />);
    
    // We click 1, 1, 1, 1, 1, 1 instead of 1, 2, 3, 4, 5, 6
    const btn1 = screen.getByText('1');
    for (let i = 0; i < 6; i++) {
      fireEvent.click(btn1);
    }

    await waitFor(() => {
      expect(screen.getByText('PINs do not match. Try again.')).toBeInTheDocument();
    });
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('calls onSkip when skip button is clicked', () => {
    render(<MPINSetup onSuccess={mockOnSuccess} onSkip={mockOnSkip} mode="create" />);
    const skipBtn = screen.getByText('Skip for now');
    fireEvent.click(skipBtn);
    expect(mockOnSkip).toHaveBeenCalled();
  });
});
