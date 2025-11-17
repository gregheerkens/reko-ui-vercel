import {
  loadDictionary,
  getTrait,
  getExpression,
  parseGenome,
} from '../../app/lib/genome-dictionary';
import { api } from '../../app/lib/api';

jest.mock('../../app/lib/api');

describe('Genome Dictionary Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadDictionary', () => {
    it('should fetch dictionary from API and cache it', async () => {
      const mockTraits = [
        {
          index: 1,
          name: 'Category',
          description: 'Book category',
          expressions: {
            F: {
              short: 'Fiction',
              description: 'Fiction',
              context: 'Fictional narrative works',
              color: 'hsl(0, 70%, 55%)',
            },
          },
        },
      ];

      (api.get as jest.Mock).mockResolvedValue({ traits: mockTraits });

      const result = await loadDictionary();

      expect(api.get).toHaveBeenCalledWith('/genome-dictionary');
      expect(result).toEqual(mockTraits);
    });

    it('should return cached dictionary on subsequent calls', async () => {
      const mockTraits = [
        {
          index: 1,
          name: 'Category',
          description: 'Book category',
          expressions: {},
        },
      ];

      (api.get as jest.Mock).mockResolvedValue({ traits: mockTraits });

      await loadDictionary();
      const result2 = await loadDictionary();

      expect(api.get).toHaveBeenCalledTimes(1);
      expect(result2).toEqual(mockTraits);
    });
  });

  describe('getTrait', () => {
    it('should return trait for valid index after dictionary loaded', async () => {
      const mockTraits = [
        {
          index: 1,
          name: 'Category',
          description: 'Book category',
          expressions: {},
        },
        {
          index: 2,
          name: 'Book Length',
          description: 'Length of the book',
          expressions: {},
        },
      ];

      (api.get as jest.Mock).mockResolvedValue({ traits: mockTraits });
      await loadDictionary();

      const trait = getTrait(1);
      expect(trait).toEqual(mockTraits[0]);
    });

    it('should return null for invalid index', async () => {
      const mockTraits = [
        {
          index: 1,
          name: 'Category',
          description: 'Book category',
          expressions: {},
        },
      ];

      (api.get as jest.Mock).mockResolvedValue({ traits: mockTraits });
      await loadDictionary();

      expect(getTrait(0)).toBeNull();
      expect(getTrait(51)).toBeNull();
    });
  });

  describe('getExpression', () => {
    it('should return expression for valid trait and letter', async () => {
      const mockTraits = [
        {
          index: 1,
          name: 'Category',
          description: 'Book category',
          expressions: {
            F: {
              short: 'Fiction',
              description: 'Fiction',
              context: 'Fictional narrative works',
              color: 'hsl(0, 70%, 55%)',
            },
          },
        },
      ];

      (api.get as jest.Mock).mockResolvedValue({ traits: mockTraits });
      await loadDictionary();

      const expr = getExpression(1, 'F');
      expect(expr).toEqual(mockTraits[0].expressions.F);
    });

    it('should be case-insensitive', async () => {
      const mockTraits = [
        {
          index: 1,
          name: 'Category',
          description: 'Book category',
          expressions: {
            F: {
              short: 'Fiction',
              description: 'Fiction',
              context: 'Fictional narrative works',
              color: 'hsl(0, 70%, 55%)',
            },
          },
        },
      ];

      (api.get as jest.Mock).mockResolvedValue({ traits: mockTraits });
      await loadDictionary();

      const expr1 = getExpression(1, 'F');
      const expr2 = getExpression(1, 'f');
      expect(expr1).toEqual(expr2);
    });
  });

  describe('parseGenome - Test 8.2', () => {
    it('should parse 50-character sequence into 50 trait/expression pairs', () => {
      const sequence = 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXY';
      const result = parseGenome(sequence);

      expect(result).toHaveLength(50);
      expect(result[0]).toEqual({ traitIndex: 1, expression: 'A' });
      expect(result[49]).toEqual({ traitIndex: 50, expression: 'Y' });
    });

    it('should use 1-indexed trait indices', () => {
      const sequence = 'A'.repeat(50);
      const result = parseGenome(sequence);

      expect(result[0].traitIndex).toBe(1);
      expect(result[49].traitIndex).toBe(50);
    });

    it('should throw error for sequence length < 50', () => {
      const sequence = 'A'.repeat(49);
      expect(() => parseGenome(sequence)).toThrow();
    });

    it('should throw error for sequence length > 50', () => {
      const sequence = 'A'.repeat(51);
      expect(() => parseGenome(sequence)).toThrow();
    });

    it('should correctly map each character to its position', () => {
      const sequence = 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXY';
      const result = parseGenome(sequence);

      for (let i = 0; i < 50; i++) {
        expect(result[i].traitIndex).toBe(i + 1);
        expect(result[i].expression).toBe(sequence[i]);
      }
    });
  });
});

