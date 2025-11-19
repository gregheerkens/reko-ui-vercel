import { validateISBN, normalizeISBN } from '../../../app/components/add-book/ISBNLookupBar';

describe('ISBN Validation', () => {
  describe('normalizeISBN', () => {
    it('should remove dashes and spaces from ISBN', () => {
      expect(normalizeISBN('0-123-45678-9')).toBe('0123456789');
      expect(normalizeISBN('978 0 123 45678 9')).toBe('9780123456789');
      expect(normalizeISBN('0123456789')).toBe('0123456789');
    });
  });

  describe('validateISBN', () => {
    it('should validate ISBN-10', () => {
      expect(validateISBN('0123456789')).toBe(true);
      expect(validateISBN('0-123-45678-9')).toBe(true);
      expect(validateISBN('0 123 45678 9')).toBe(true);
    });

    it('should validate ISBN-13', () => {
      expect(validateISBN('9780123456789')).toBe(true);
      expect(validateISBN('978-0-123-45678-9')).toBe(true);
      expect(validateISBN('978 0 123 45678 9')).toBe(true);
    });

    it('should reject invalid ISBNs', () => {
      expect(validateISBN('12345')).toBe(false);
      expect(validateISBN('012345678')).toBe(false); // 9 digits
      expect(validateISBN('01234567890')).toBe(false); // 11 digits
      expect(validateISBN('978012345678')).toBe(false); // 12 digits
      expect(validateISBN('97801234567890')).toBe(false); // 14 digits
      expect(validateISBN('abc123')).toBe(false);
      expect(validateISBN('')).toBe(false);
    });
  });
});

