export class ChatModeration {
  private static PROFANITY_LIST = [
    'badword1', 'badword2', 'hatespeech', 'spam' // Extensible filter
  ];

  private static lastMessageTime = 0;
  private static MESSAGE_COOLDOWN_MS = 1000; // 1 message per second rate-limit

  /** Sanitize message text with asterisks for prohibited words */
  static filterMessage(text: string): string {
    let sanitized = text;
    for (const word of this.PROFANITY_LIST) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      sanitized = sanitized.replace(regex, '*'.repeat(word.length));
    }
    return sanitized;
  }

  /** Check rate-limit (returns true if allowed, false if spamming) */
  static checkRateLimit(): boolean {
    const now = Date.now();
    if (now - this.lastMessageTime < this.MESSAGE_COOLDOWN_MS) {
      return false; // Spam blocked
    }
    this.lastMessageTime = now;
    return true;
  }
}
