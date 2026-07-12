import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import MPINVerify from '@/components/auth/MPINVerify';

describe('MPINVerify', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();
  const mockVerifyFn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const paymentInfo = {
    merchant: 'Test Merchant',
    amount: 1500,
    upiId: 'test@merchant',
  };

  it('renders payment info correctly', () => {
    render(
      <MPINVerify
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        verifyFn={mockVerifyFn}
        paymentInfo={paymentInfo}
      />
    );
    expect(screen.getByText('Enter MPIN')).toBeInTheDocument();
    expect(screen.getByText('Authorize this payment')).toBeInTheDocument();
    expect(screen.getByText('Test Merchant')).toBeInTheDocument();
    expect(screen.getByText('test@merchant')).toBeInTheDocument();
    expect(screen.getByText('₹1,500')).toBeInTheDocument();
  });

  it('calls onCancel when close icon is clicked', () => {
    render(
      <MPINVerify
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        verifyFn={mockVerifyFn}
      />
    );
    // The X icon is inside a button
    const buttons = screen.getAllByRole('button');
    // First button is the close button
    fireEvent.click(buttons[0]);
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('triggers onSuccess when correct MPIN is entered', async () => {
    mockVerifyFn.mockReturnValueOnce(true); // correct MPIN

    render(
      <MPINVerify
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        verifyFn={mockVerifyFn}
      />
    );

    const btn1 = screen.getByText('1');
    for (let i = 0; i < 6; i++) {
      fireEvent.click(btn1); // enter 111111
    }

    await waitFor(() => {
      expect(mockVerifyFn).toHaveBeenCalledWith('111111');
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('shows error when incorrect MPIN is entered and increments attempts', async () => {
    jest.useFakeTimers();
    mockVerifyFn.mockReturnValue(false);

    render(
      <MPINVerify
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        verifyFn={mockVerifyFn}
      />
    );

    const btn1 = screen.getByText('1');
    
    // Attempt 1
    for (let i = 0; i < 6; i++) { fireEvent.click(btn1); }
    act(() => {
      jest.advanceTimersByTime(200); // Trigger verify timeout (180ms)
    });
    await waitFor(() => {
      expect(screen.getByText('Incorrect MPIN. Please try again.')).toBeInTheDocument();
    });
    act(() => {
      jest.advanceTimersByTime(600); // Clear digits timeout (600ms)
    });

    // Attempt 2
    for (let i = 0; i < 6; i++) { fireEvent.click(btn1); }
    act(() => {
      jest.advanceTimersByTime(200);
    });
    await waitFor(() => {
      expect(screen.getByText('Incorrect MPIN. Please try again.')).toBeInTheDocument();
    });
    act(() => {
      jest.advanceTimersByTime(600);
    });

    // Attempt 3
    for (let i = 0; i < 6; i++) { fireEvent.click(btn1); }
    act(() => {
      jest.advanceTimersByTime(200);
    });
    await waitFor(() => {
      expect(screen.getByText('Wrong MPIN. 0 attempts remaining. Account may be locked.')).toBeInTheDocument();
    });

    jest.useRealTimers();
  });
});
