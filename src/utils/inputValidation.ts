/**
 * Input validation and sanitization utilities
 */

// XSS Prevention: Sanitize HTML content
export const sanitizeHtml = (input: string): string => {
  if (!input) return '';
  
  // Remove potentially dangerous characters and patterns
  return input
    .replace(/[<>'"&]/g, (match) => {
      const escapeMap: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return escapeMap[match] || match;
    })
    .trim();
};

// Validate and sanitize text input
export const sanitizeTextInput = (input: string, maxLength: number = 1000): string => {
  if (!input) return '';
  
  return sanitizeHtml(input.substring(0, maxLength));
};

// Validate email format
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Validate wallet address format (basic validation)
export const validateWalletAddress = (address: string): boolean => {
  if (!address) return false;
  
  // Basic length and character validation
  const trimmed = address.trim();
  return trimmed.length >= 10 && trimmed.length <= 100 && /^[a-zA-Z0-9]+$/.test(trimmed);
};

// Validate cryptocurrency symbol
export const validateCryptoSymbol = (symbol: string): boolean => {
  if (!symbol) return false;
  
  const trimmed = symbol.trim().toUpperCase();
  return trimmed.length >= 2 && trimmed.length <= 10 && /^[A-Z]+$/.test(trimmed);
};

// Validate phone number (basic international format)
export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return true; // Optional field
  
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Validate and sanitize ride request data
export const validateRideRequestData = (data: any) => {
  const errors: string[] = [];
  
  if (!data.friend_name || data.friend_name.trim().length === 0) {
    errors.push('朋友姓名不能为空');
  }
  
  if (!data.start_location || data.start_location.trim().length === 0) {
    errors.push('出发地点不能为空');
  }
  
  if (!data.end_location || data.end_location.trim().length === 0) {
    errors.push('目的地不能为空');
  }
  
  if (!data.requested_time) {
    errors.push('请选择用车时间');
  } else {
    const requestTime = new Date(data.requested_time);
    if (requestTime < new Date()) {
      errors.push('用车时间不能是过去的时间');
    }
  }
  
  // Validate contact info if provided
  if (data.contact_info && data.contact_info.trim().length > 0) {
    const contact = data.contact_info.trim();
    if (!validateEmail(contact) && !validatePhoneNumber(contact)) {
      errors.push('联系方式格式不正确（请输入有效的邮箱或手机号）');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: {
      friend_name: sanitizeTextInput(data.friend_name, 100),
      start_location: sanitizeTextInput(data.start_location, 200),
      end_location: sanitizeTextInput(data.end_location, 200),
      contact_info: data.contact_info ? sanitizeTextInput(data.contact_info, 100) : null,
      notes: data.notes ? sanitizeTextInput(data.notes, 500) : null,
      requested_time: data.requested_time,
      payment_required: Boolean(data.payment_required),
      payment_amount: data.payment_amount ? Number(data.payment_amount) : null,
      payment_currency: data.payment_currency ? sanitizeTextInput(data.payment_currency, 10) : null
    }
  };
};

// Rate limiting helper (client-side basic implementation)
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }
    
    const keyAttempts = this.attempts.get(key)!;
    
    // Remove old attempts outside the window
    const recentAttempts = keyAttempts.filter(time => time > windowStart);
    this.attempts.set(key, recentAttempts);
    
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true;
  }
}

export const globalRateLimiter = new RateLimiter();