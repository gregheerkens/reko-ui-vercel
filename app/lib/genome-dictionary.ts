import { api } from './api';

export interface ExpressionDefinition {
  short: string;
  description: string;
  context: string;
  color: string;
}

export interface TraitDefinition {
  index: number;
  name: string;
  description: string;
  expressions: Record<string, ExpressionDefinition>;
}

interface GenomeDictionaryResponse {
  traits: TraitDefinition[];
}

let dictionaryCache: TraitDefinition[] | null = null;
let dictionaryPromise: Promise<TraitDefinition[]> | null = null;

// Export reset function for testing
export function resetDictionaryCache() {
  dictionaryCache = null;
  dictionaryPromise = null;
}

export async function loadDictionary(): Promise<TraitDefinition[]> {
  if (dictionaryCache) {
    return dictionaryCache;
  }

  if (dictionaryPromise) {
    return dictionaryPromise;
  }

  dictionaryPromise = api
    .get<GenomeDictionaryResponse>('/genome-dictionary')
    .then((response) => {
      dictionaryCache = response.traits;
      return dictionaryCache;
    })
    .catch((error) => {
      dictionaryPromise = null;
      throw error;
    });

  return dictionaryPromise;
}

export function getTrait(index: number): TraitDefinition | null {
  if (!dictionaryCache) {
    return null;
  }

  if (index < 1 || index > 50) {
    return null;
  }

  return dictionaryCache.find((t) => t.index === index) || null;
}

export function getExpression(
  index: number,
  letter: string,
): ExpressionDefinition | null {
  const trait = getTrait(index);
  if (!trait) {
    return null;
  }

  return trait.expressions[letter.toUpperCase()] || null;
}

export function parseGenome(
  sequence: string,
): Array<{ traitIndex: number; expression: string }> {
  if (sequence.length !== 50) {
    throw new Error('Genome sequence must be exactly 50 characters');
  }

  const result: Array<{ traitIndex: number; expression: string }> = [];
  for (let i = 0; i < sequence.length; i++) {
    result.push({
      traitIndex: i + 1, // 1-indexed
      expression: sequence[i],
    });
  }

  return result;
}

