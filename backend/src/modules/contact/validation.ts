export function isTruthyConsent(value: unknown): boolean {
	if (value === true || value === 1) {
		return true;
	}
	if (typeof value === 'string') {
		return ['true', 'on', '1', 'yes'].includes(value.toLowerCase());
	}
	return false;
}

export function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function asOptionalString(value: unknown): string | undefined {
	if (typeof value !== 'string') {
		return undefined;
	}
	const trimmed = value.trim();
	return trimmed.length ? trimmed : undefined;
}
