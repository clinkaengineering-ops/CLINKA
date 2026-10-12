import { render, screen } from '@testing-library/react';
import {
  Button,
  Badge,
  Card,
  Progress,
  StatCard,
  Field,
  Divider,
  Spinner,
  Skeleton,
  SectionHeader,
  Textarea,
  Avatar,
  VerifiedBadge,
  Shell,
} from './UI';

describe('UI Components', () => {
  it('renders Card with children', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('renders Progress bar', () => {
    const { container } = render(<Progress value={50} color="emerald" />);
    const bar = container.querySelector('[style*="width: 50%"]');
    expect(bar).toBeInTheDocument();
  });

  it('renders StatCard with label, value, and change', () => {
    const { rerender } = render(
      <StatCard
        label="Total Bids"
        value="$1,200"
        change="+12%"
        icon={<span data-testid="stat-icon">icon</span>}
      />
    );
    expect(screen.getByText('Total Bids')).toBeInTheDocument();
    expect(screen.getByText('$1,200')).toBeInTheDocument();
    expect(screen.getByTestId('stat-icon')).toBeInTheDocument();

    // accent down
    rerender(
      <StatCard
        label="Loss"
        value="$50"
        change="-5%"
        accent="down"
        icon={<span>icon</span>}
      />
    );
    expect(screen.getByText(/5%/)).toBeInTheDocument();

    // neutral zero
    rerender(
      <StatCard
        label="Zero"
        value="0"
        change="—"
        icon={<span>icon</span>}
      />
    );
    expect(screen.getByText('Zero')).toBeInTheDocument();
  });

  it('renders Field with label and error', () => {
    render(
      <Field label="Username" right={<span>right</span>} error="Required field">
        <input placeholder="Enter username" />
      </Field>
    );
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Required field')).toBeInTheDocument();
    expect(screen.getByText('right')).toBeInTheDocument();
  });

  it('renders Divider with custom label', () => {
    render(<Divider label="AND" />);
    expect(screen.getByText('AND')).toBeInTheDocument();
  });

  it('renders Spinner with aria role', () => {
    render(<Spinner size="lg" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders Skeleton', () => {
    const { container } = render(<Skeleton className="w-12 h-12" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders SectionHeader with title, eyebrow, and subtitle', () => {
    render(
      <SectionHeader
        eyebrow="Overview"
        title="Main Title"
        subtitle="Some descriptive text"
        center
      />
    );
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Main Title')).toBeInTheDocument();
    expect(screen.getByText('Some descriptive text')).toBeInTheDocument();
  });

  it('renders Textarea and supports error prop', () => {
    render(<Textarea placeholder="Notes" error />);
    const textarea = screen.getByPlaceholderText('Notes');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders VerifiedBadge', () => {
    const { container } = render(<VerifiedBadge size={20} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders Avatar with initials and ring', () => {
    render(<Avatar name="John Doe" ring size={48} />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders Badge with all color variants', () => {
    const { rerender } = render(<Badge color="blue">Blue</Badge>);
    expect(screen.getByText('Blue')).toBeInTheDocument();
    rerender(<Badge color="green">Green</Badge>);
    expect(screen.getByText('Green')).toBeInTheDocument();
    rerender(<Badge color="amber">Amber</Badge>);
    expect(screen.getByText('Amber')).toBeInTheDocument();
    rerender(<Badge color="rose">Rose</Badge>);
    expect(screen.getByText('Rose')).toBeInTheDocument();
    rerender(<Badge color="violet">Violet</Badge>);
    expect(screen.getByText('Violet')).toBeInTheDocument();
    rerender(<Badge color="electric">Electric</Badge>);
    expect(screen.getByText('Electric')).toBeInTheDocument();
  });

  it('renders Button with variants and sizes', () => {
    const { rerender } = render(<Button variant="danger" size="lg" icon={<span>icon</span>}>Delete</Button>);
    expect(screen.getByRole('button', { name: /Delete/ })).toBeInTheDocument();
    rerender(<Button variant="ghost" size="sm">Ghost</Button>);
    expect(screen.getByRole('button', { name: 'Ghost' })).toBeInTheDocument();
    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button', { name: 'Secondary' })).toBeInTheDocument();
  });

  it('renders Shell component', () => {
    render(<Shell><div>Inside Shell</div></Shell>);
    expect(screen.getByText('Inside Shell')).toBeInTheDocument();
  });
});
