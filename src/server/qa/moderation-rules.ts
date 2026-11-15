export interface ModerationPrecheckResult {
  allowed: boolean;
  reason?: string;
  flaggedForReview?: boolean;
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b/;
const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9.-]+\.(com|org|net|io|me|co|in|dev)\b)/i;
const DM_REGEX = /\b(dm\s+me|pm\s+me|message\s+me|reach\s+out\s+on\s+telegram|whatsapp\s+me|ping\s+me)\b/i;

/**
 * Deterministic pre-checks for text content across questions, asks, and answers.
 */
export function validateContentForModeration(text: string | null | undefined): ModerationPrecheckResult {
  if (!text || text.trim().length === 0) {
    return { allowed: true };
  }

  const content = text.trim();

  // 1. Check for email addresses
  if (EMAIL_REGEX.test(content)) {
    return {
      allowed: false,
      reason: "Email addresses are prohibited to protect user privacy and avoid spam.",
    };
  }

  // 2. Check for phone numbers
  if (PHONE_REGEX.test(content)) {
    return {
      allowed: false,
      reason: "Phone numbers are prohibited to protect personal privacy.",
    };
  }

  // 3. Check for external messaging handles / "DM me"
  if (DM_REGEX.test(content)) {
    return {
      allowed: false,
      reason: "Direct solicitation ('DM me', WhatsApp/Telegram links) is not permitted. Keep discussions in the verified question threads.",
    };
  }

  // 4. Check for external suspicious links
  if (URL_REGEX.test(content)) {
    // We flag external links for moderation rather than immediate hard block if they might be educational
    return {
      allowed: true,
      flaggedForReview: true,
      reason: "Contains external link; queued for moderation review.",
    };
  }

  return { allowed: true };
}
