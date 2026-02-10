/**
 * Input Validation & Sanitization — OWASP Best Practices
 * 
 * Schema-based validators for all user inputs.
 * Enforces type checks, length limits, and rejects unexpected characters.
 * 
 * </UV> // if it compiles, ship it ¯\_(ツ)_/¯
 */

// ─── Validation Constants ─────────────────────────────────────────
export const V_LIMITS = {
    GROUP_NAME_MAX: 50,
    GROUP_NAME_MIN: 1,
    MEMBER_NAME_MAX: 30,
    MEMBER_NAME_MIN: 1,
    DESCRIPTION_MAX: 100,
    DESCRIPTION_MIN: 1,
    AMOUNT_MAX: 10_000_000,   // 10M cap — nobody splitting a yacht (yet)
    AMOUNT_MIN: 0.01,
    MEMBERS_MAX: 20,          // per group
    GROUPS_MAX: 50,           // total groups
    EXPENSES_PER_GROUP_MAX: 500,
} as const;

// ─── Sanitization ──────────────────────────────────────────────────
// Strips control chars, leading/trailing whitespace, and collapses internal spaces
export function sanitizeString(input: string): string {
    return input
        .replace(/[\x00-\x1F\x7F]/g, '')   // strip control characters (OWASP A03)
        .replace(/[<>]/g, '')               // strip angle brackets (basic XSS prevention)
        .trim()
        .replace(/\s+/g, ' ');              // collapse multiple spaces
}

// ─── Validation Results ────────────────────────────────────────────
export interface ValidationResult {
    valid: boolean;
    error?: string;
}

function ok(): ValidationResult {
    return { valid: true };
}

function fail(error: string): ValidationResult {
    return { valid: false, error };
}

// ─── Validators ────────────────────────────────────────────────────

/** Validate group name: non-empty, within length, safe characters */
export function validateGroupName(name: string): ValidationResult {
    const clean = sanitizeString(name);
    if (clean.length < V_LIMITS.GROUP_NAME_MIN) {
        return fail('Group name is required.');
    }
    if (clean.length > V_LIMITS.GROUP_NAME_MAX) {
        return fail(`Group name must be under ${V_LIMITS.GROUP_NAME_MAX} characters.`);
    }
    return ok();
}

/** Validate member name: non-empty, within length, safe characters */
export function validateMemberName(name: string): ValidationResult {
    const clean = sanitizeString(name);
    if (clean.length < V_LIMITS.MEMBER_NAME_MIN) {
        return fail('Member name is required.');
    }
    if (clean.length > V_LIMITS.MEMBER_NAME_MAX) {
        return fail(`Member name must be under ${V_LIMITS.MEMBER_NAME_MAX} characters.`);
    }
    // Reject names that are just numbers or special chars
    if (!/[a-zA-Z\u0900-\u097F\u00C0-\u024F]/.test(clean)) {
        return fail('Member name must contain at least one letter.');
    }
    return ok();
}

/** Validate expense description */
export function validateDescription(desc: string): ValidationResult {
    const clean = sanitizeString(desc);
    if (clean.length < V_LIMITS.DESCRIPTION_MIN) {
        return fail('Description is required.');
    }
    if (clean.length > V_LIMITS.DESCRIPTION_MAX) {
        return fail(`Description must be under ${V_LIMITS.DESCRIPTION_MAX} characters.`);
    }
    return ok();
}

/** Validate expense amount: positive number, within sane range */
export function validateAmount(amount: string | number): ValidationResult {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) {
        return fail('Enter a valid number.');
    }
    if (num < V_LIMITS.AMOUNT_MIN) {
        return fail(`Amount must be at least ${V_LIMITS.AMOUNT_MIN}.`);
    }
    if (num > V_LIMITS.AMOUNT_MAX) {
        return fail(`Amount cannot exceed ${V_LIMITS.AMOUNT_MAX.toLocaleString()}.`);
    }
    // Guard against floating point shenanigans — max 2 decimal places
    if (Math.round(num * 100) / 100 !== num) {
        return fail('Amount can have at most 2 decimal places.');
    }
    return ok();
}

/** Validate member count within group limits */
export function validateMemberCount(current: number): ValidationResult {
    if (current >= V_LIMITS.MEMBERS_MAX) {
        return fail(`Maximum ${V_LIMITS.MEMBERS_MAX} members per group.`);
    }
    return ok();
}

/** Validate total group count */
export function validateGroupCount(current: number): ValidationResult {
    if (current >= V_LIMITS.GROUPS_MAX) {
        return fail(`Maximum ${V_LIMITS.GROUPS_MAX} groups. Delete an old group first.`);
    }
    return ok();
}

/** Validate expense count for a group */
export function validateExpenseCount(current: number): ValidationResult {
    if (current >= V_LIMITS.EXPENSES_PER_GROUP_MAX) {
        return fail(`Maximum ${V_LIMITS.EXPENSES_PER_GROUP_MAX} expenses per group.`);
    }
    return ok();
}

/** Validate category is a known enum value */
const VALID_CATEGORIES = ['trip', 'roommates', 'dinner', 'party', 'shopping', 'office', 'custom'] as const;
export function validateCategory(category: string): ValidationResult {
    if (!VALID_CATEGORIES.includes(category as any)) {
        return fail('Invalid category selected.');
    }
    return ok();
}

/** Validate split type */
const VALID_SPLIT_TYPES = ['equal', 'unequal'] as const;
export function validateSplitType(splitType: string): ValidationResult {
    if (!VALID_SPLIT_TYPES.includes(splitType as any)) {
        return fail('Invalid split type.');
    }
    return ok();
}

/** Validate currency is supported */
const VALID_CURRENCIES = ['₹', '$', '€', '£', '¥', '₩'] as const;
export function validateCurrency(currency: string): ValidationResult {
    if (!VALID_CURRENCIES.includes(currency as any)) {
        return fail('Invalid currency.');
    }
    return ok();
}
