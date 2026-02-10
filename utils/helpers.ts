const MEMBER_COLORS = [
    '#6C63FF', '#FF6584', '#00C48C', '#FFAA00', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#EF4444',
    '#84CC16', '#A855F7', '#F43F5E', '#22D3EE', '#FB923C',
];

export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function getMemberColor(index: number): string {
    return MEMBER_COLORS[index % MEMBER_COLORS.length];
}

export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function formatCurrency(amount: number, currency: string = '₹'): string {
    return `${currency}${Math.abs(amount).toFixed(2)}`;
}

export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;

    return date.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
}

export function formatDateFull(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}
