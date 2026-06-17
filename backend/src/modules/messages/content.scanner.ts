const FLAGGED_REASON =
  "Sharing contact information or external links is not allowed on this platform.";

const PATTERNS: RegExp[] = [
  // Egyptian mobile: 01[0125] + 8 digits, optional separators
  /01[0125][\s.-]?\d{4}[\s.-]?\d{4}\b/,
  /01[0125]\d{8}\b/,
  // International phone
  /\+\d{1,3}[\s.-]?\d{4,14}\b/,
  /\b00\d{7,15}\b/,
  // WhatsApp
  /whatsapp|واتساب|whats\s*app|wts|watsapp/i,
  // Telegram
  /t\.me\/|telegram|تيليجرام|تيليغرام/i,
  // External URLs
  /https?:\/\/|www\./i,
  /\b[\w-]+\.(com|net|org|io|co|app|me|ly|link)\b/i,
  // Email
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
  // Social handles (@username, min 3 chars)
  /(?:^|[\s([{>])@[a-zA-Z0-9_.]{3,}\b/,
  // Bypass phrases
  /contact\s+me\s+on|call\s+me|تواصل\s+معي|كلمني\s+على|ابعتلي\s+على/i,
  /outside\s+the\s+platform|خارج\s+المنصة|على\s+واتس|على\s+تيليجرام/i,
];

export function scanMessageContent(text: string): {
  flagged: boolean;
  reason: string | null;
} {
  const normalized = text.trim();
  if (!normalized) {
    return { flagged: false, reason: null };
  }

  for (const pattern of PATTERNS) {
    if (pattern.test(normalized)) {
      return { flagged: true, reason: FLAGGED_REASON };
    }
  }

  return { flagged: false, reason: null };
}
