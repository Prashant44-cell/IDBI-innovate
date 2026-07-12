import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HomeTab from '@/components/dashboard/HomeTab';

// Mock Recharts to avoid rendering complex SVG elements in tests which can cause issues with JSDOM
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    AreaChart: () => <div data-testid="area-chart" />,
  };
});

describe('HomeTab', () => {
  const mockProps = {
    unreadCount: 2,
    setShowNotifications: jest.fn(),
    setActiveTab: jest.fn(),
    portfolioData: [{ name: 'Mon', value: 100 }],
    onQRScan: jest.fn(),
    userName: 'John Doe',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with user name', () => {
    render(<HomeTab {...mockProps} />);
    expect(screen.getByText('Good Morning, John Doe 👋')).toBeInTheDocument();
    expect(screen.getByText('Your wealth is growing steadily.')).toBeInTheDocument();
  });

  it('renders default greeting if no username is provided', () => {
    render(<HomeTab {...mockProps} userName={undefined} />);
    expect(screen.getByText('Good Morning, Friend 👋')).toBeInTheDocument();
  });

  it('calls setShowNotifications when bell icon is clicked', () => {
    render(<HomeTab {...mockProps} />);
    // The bell icon is inside a button. Let's find the button by its accessible role or nearby content.
    // Since there is no aria-label, we can find the button using querySelector or test ID. Let's add a quick mock or click the generic button.
    const buttons = screen.getAllByRole('button');
    // The first button in HomeTab is the notification bell
    fireEvent.click(buttons[0]);
    expect(mockProps.setShowNotifications).toHaveBeenCalledWith(true);
  });

  it('renders quick action buttons and handles clicks', () => {
    render(<HomeTab {...mockProps} />);
    
    const investButton = screen.getByText('Invest').closest('button');
    const saveButton = screen.getByText('Save').closest('button');
    const goalButton = screen.getByText('Goal').closest('button');

    expect(investButton).toBeInTheDocument();
    
    fireEvent.click(investButton!);
    expect(mockProps.setActiveTab).toHaveBeenCalledWith('invest');
    
    fireEvent.click(saveButton!);
    expect(mockProps.setActiveTab).toHaveBeenCalledWith('spending');
    
    fireEvent.click(goalButton!);
    expect(mockProps.setActiveTab).toHaveBeenCalledWith('goals');

    expect(screen.queryByText('Pay QR')).not.toBeInTheDocument();
  });

  it('displays the total balance and monthly stats', () => {
    render(<HomeTab {...mockProps} />);
    expect(screen.getByText('Total Balance')).toBeInTheDocument();
    expect(screen.getByText('₹4,28,500')).toBeInTheDocument();
    expect(screen.getByText('Monthly Income')).toBeInTheDocument();
    expect(screen.getByText('₹85,000')).toBeInTheDocument();
    expect(screen.getByText('Monthly Expenses')).toBeInTheDocument();
    expect(screen.getByText('₹32,400')).toBeInTheDocument();
  });

  it('shows the lifestyle, recharge and AI assistant services', () => {
    render(<HomeTab {...mockProps} />);
    expect(screen.getByText('Lifestyle & Bookings')).toBeInTheDocument();
    expect(screen.getByText('Recharge & Bills')).toBeInTheDocument();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
  });
});
