import { describe, it, expect } from 'vitest';
import { 
  sanitizeHtml, 
  validateEmail, 
  validateWalletAddress, 
  validateRideRequestData 
} from '../utils/inputValidation';

describe('inputValidation', () => {
  describe('sanitizeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(sanitizeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('should return empty string for null or empty input', () => {
      expect(sanitizeHtml('')).toBe('');
    });
  });

  describe('validateEmail', () => {
    it('should return true for valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
    });
  });

  describe('validateWalletAddress', () => {
    it('should return true for valid wallet addresses', () => {
      expect(validateWalletAddress('0x742d35Cc6634C0532925a3b8D93329c7c42A5d00')).toBe(true);
      expect(validateWalletAddress('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')).toBe(true);
    });

    it('should return false for too short or too long addresses', () => {
      expect(validateWalletAddress('0x123')).toBe(false);
      expect(validateWalletAddress('a'.repeat(101))).toBe(false);
    });
  });

  describe('validateRideRequestData', () => {
    it('should validate correctly for valid data', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 2);
      
      const validData = {
        friend_name: 'John Doe',
        start_location: 'Point A',
        end_location: 'Point B',
        requested_time: futureDate
      } as any;
      
      const result = validateRideRequestData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for missing fields', () => {
      const invalidData = {
        friend_name: '',
        start_location: '',
        end_location: ''
      };
      
      const result = validateRideRequestData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('朋友姓名不能为空');
      expect(result.errors).toContain('出发地点不能为空');
      expect(result.errors).toContain('目的地不能为空');
      expect(result.errors).toContain('请选择用车时间');
    });

    it('should return error for past time', () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 2);
      
      const invalidData = {
        friend_name: 'John',
        start_location: 'A',
        end_location: 'B',
        requested_time: pastDate
      } as any;
      
      const result = validateRideRequestData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('用车时间不能是过去的时间');
    });
  });
});
