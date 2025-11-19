/**
 * @jest-environment jsdom
 */

import { TraitDefinition, ExpressionDefinition } from '../../../app/lib/genome-dictionary';

describe('Trait Selection Logic', () => {
  const createMockTrait = (index: number, name: string, expressions: Record<string, ExpressionDefinition>): TraitDefinition => {
    return {
      index,
      name,
      description: `Description for ${name}`,
      expressions,
    };
  };

  const createMockExpression = (short: string, description: string, color: string = '#000000'): ExpressionDefinition => {
    return {
      short,
      description,
      context: `Context for ${short}`,
      color,
    };
  };

  describe('Trait structure', () => {
    it('should have valid trait structure', () => {
      const trait = createMockTrait(1, 'Category', {
        F: createMockExpression('Fiction', 'Fiction books', '#FF0000'),
        N: createMockExpression('Non-Fiction', 'Non-fiction books', '#0000FF'),
      });

      expect(trait.index).toBe(1);
      expect(trait.name).toBe('Category');
      expect(Object.keys(trait.expressions)).toHaveLength(2);
      expect(trait.expressions.F).toBeDefined();
      expect(trait.expressions.N).toBeDefined();
    });

    it('should allow selection of valid expressions', () => {
      const trait = createMockTrait(1, 'Category', {
        F: createMockExpression('Fiction', 'Fiction books'),
        N: createMockExpression('Non-Fiction', 'Non-fiction books'),
      });

      const validExpressions = Object.keys(trait.expressions);
      expect(validExpressions).toContain('F');
      expect(validExpressions).toContain('N');
    });
  });

  describe('Genome sequence building', () => {
    it('should build sequence from trait selections', () => {
      const selections: Record<number, string> = {};
      // Fill all 50 traits
      for (let i = 1; i <= 50; i++) {
        if (i === 1) selections[i] = 'F';
        else if (i === 2) selections[i] = 'M';
        else if (i === 3) selections[i] = 'A';
        else selections[i] = 'X'; // Fill rest with placeholder
      }

      let sequence = '';
      for (let i = 1; i <= 50; i++) {
        sequence += selections[i] || '';
      }

      expect(sequence[0]).toBe('F');
      expect(sequence[1]).toBe('M');
      expect(sequence[2]).toBe('A');
      expect(sequence.length).toBe(50);
    });

    it('should require all 50 traits to be selected', () => {
      const selections: Record<number, string> = {};
      for (let i = 1; i <= 49; i++) {
        selections[i] = 'A';
      }
      // Don't set selection[50]

      const sequence = Array.from({ length: 50 }, (_, i) => selections[i + 1] || '').join('');
      // When joining, empty strings don't add characters, so 49 A's + 1 empty = 49 chars total
      expect(sequence.length).toBe(49); // Only 49 characters because trait 50 is missing
      expect(sequence[48]).toBe('A'); // Last character is 'A' (trait 49)
      // Trait 50 is missing, so the sequence is incomplete
    });

    it('should validate complete sequence', () => {
      const selections: Record<number, string> = {};
      for (let i = 1; i <= 50; i++) {
        selections[i] = 'A';
      }

      const sequence = Array.from({ length: 50 }, (_, i) => selections[i + 1] || '').join('');
      expect(sequence.length).toBe(50);
      expect(sequence.split('').every((char) => char === 'A')).toBe(true);
    });
  });

  describe('Trait ordering', () => {
    it('should sort traits by index', () => {
      const traits: TraitDefinition[] = [
        createMockTrait(3, 'Trait 3', { A: createMockExpression('A', 'A') }),
        createMockTrait(1, 'Trait 1', { A: createMockExpression('A', 'A') }),
        createMockTrait(2, 'Trait 2', { A: createMockExpression('A', 'A') }),
      ];

      const sorted = [...traits].sort((a, b) => a.index - b.index);
      expect(sorted[0].index).toBe(1);
      expect(sorted[1].index).toBe(2);
      expect(sorted[2].index).toBe(3);
    });
  });
});

