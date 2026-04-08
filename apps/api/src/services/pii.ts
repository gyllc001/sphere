/**
 * PII Detection Service
 *
 * Scans message bodies for personal contact information (email addresses,
 * phone numbers) to block off-platform communication attempts.
 *
 * Returns the first detected PII type so the caller can return a precise error.
 */

// Email address pattern (RFC 5322 simplified)
const EMAIL_PATTERN = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;

// Phone number patterns — matches:
//   +1 (555) 555-5555  |  555-555-5555  |  5555555555  |  +447911123456
//   (555)5555555  |  555.555.5555  |  555 555 5555
const PHONE_PATTERN =
  /(?:\+?[1-9]\d{0,2}[\s.\-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4,9}/;

export interface PiiDetectionResult {
  hasPii: boolean;
  type?: 'email' | 'phone';
  /** Redacted preview for logging — never include in user-facing responses */
  _redactedMatch?: string;
}

export function detectPii(text: string): PiiDetectionResult {
  const emailMatch = EMAIL_PATTERN.exec(text);
  if (emailMatch) {
    return {
      hasPii: true,
      type: 'email',
      _redactedMatch: emailMatch[0].replace(/./g, '*'),
    };
  }

  const phoneMatch = PHONE_PATTERN.exec(text);
  if (phoneMatch) {
    // Require at least 7 digits to avoid false positives on dates/prices
    const digits = phoneMatch[0].replace(/\D/g, '');
    if (digits.length >= 7) {
      return {
        hasPii: true,
        type: 'phone',
        _redactedMatch: phoneMatch[0].replace(/\d/g, '*'),
      };
    }
  }

  return { hasPii: false };
}

/** User-facing error message — non-alarming, explains the policy */
export const PII_BLOCK_MESSAGE =
  "For your protection, we don't allow sharing email addresses or phone numbers. Keep communication on Sphere.";
