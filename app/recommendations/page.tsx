'use client';

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import {
  loadDictionary,
  getTrait,
  getExpression,
  TraitDefinition,
} from '../lib/genome-dictionary';

export default function RecommendationsPage() {
  const [genomeSequence, setGenomeSequence] = useState<string>(
    ' '.repeat(50).split('').join(''),
  );
  const [algorithm, setAlgorithm] = useState<'exact' | 'hamming' | 'weighted'>('hamming');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dictionaryLoaded, setDictionaryLoaded] = useState(false);
  const [traits, setTraits] = useState<TraitDefinition[]>([]);

  useEffect(() => {
    loadDictionary().then((loadedTraits) => {
      setTraits(loadedTraits);
      setDictionaryLoaded(true);
    });
  }, []);

  const handleExpressionSelect = (traitIndex: number, expression: string) => {
    const newSequence = genomeSequence.split('');
    newSequence[traitIndex - 1] = expression;
    setGenomeSequence(newSequence.join(''));
  };

  const buildGenomeFromSequence = (): string => {
    return genomeSequence.replace(/\s/g, 'X').padEnd(50, 'X').substring(0, 50);
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    const sequence = buildGenomeFromSequence();
    if (sequence.length !== 50) {
      alert('Please select expressions for all 50 traits');
      return;
    }
    setLoading(true);
    try {
      const data = await api.post('/recommendations/query', {
        queryGenomeSequence: sequence,
        algorithm,
        limit: 10,
      });
      setResults(data);
    } catch (error) {
      console.error('Failed to get recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!dictionaryLoaded) {
    return (
      <Layout>
        <div className="px-4 py-8">
          <div className="text-center py-8">Loading genome dictionary...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Get Recommendations</h1>
        <form onSubmit={handleQuery} className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Build Genome by Selecting Traits
              </label>
              <div className="mb-2">
                <p className="text-xs text-gray-500 font-mono mb-2">
                  {genomeSequence.padEnd(50, ' ').substring(0, 50)}
                </p>
                <p className="text-xs text-gray-500">
                  Selected: {genomeSequence.replace(/\s/g, '').length} / 50 traits
                </p>
              </div>
              <div className="overflow-x-auto">
                <div className="flex gap-2 pb-4" style={{ minWidth: 'max-content' }}>
                  {traits.map((trait) => {
                    const currentExpression = genomeSequence[trait.index - 1] || ' ';
                    return (
                      <div
                        key={trait.index}
                        className="flex-shrink-0 border rounded p-2"
                        style={{ minWidth: '120px' }}
                      >
                        <div className="text-xs font-semibold mb-1">
                          {trait.index}. {trait.name}
                        </div>
                        <div className="space-y-1">
                          {Object.entries(trait.expressions).map(([letter, expr]) => {
                            const isSelected = currentExpression === letter;
                            return (
                              <button
                                key={letter}
                                type="button"
                                onClick={() => handleExpressionSelect(trait.index, letter)}
                                className={`w-full text-left px-2 py-1 text-xs rounded ${
                                  isSelected
                                    ? 'ring-2 ring-blue-500 font-bold'
                                    : 'hover:bg-gray-100'
                                }`}
                                style={
                                  isSelected
                                    ? { backgroundColor: expr.color + '40' }
                                    : {}
                                }
                                title={`${expr.description}\n\n${expr.context}`}
                              >
                                <span
                                  className="inline-block w-4 h-4 rounded mr-1 align-middle"
                                  style={{ backgroundColor: expr.color }}
                                />
                                {letter}: {expr.short}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="algorithm" className="block text-sm font-medium text-gray-700">
                Algorithm
              </label>
              <select
                id="algorithm"
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value as any)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              >
                <option value="exact">Exact Match</option>
                <option value="hamming">Hamming Distance</option>
                <option value="weighted">Weighted Similarity</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading || genomeSequence.replace(/\s/g, '').length !== 50}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Get Recommendations'}
            </button>
          </div>
        </form>

        {results && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            <p className="text-gray-600">Found {results.resultBookIds?.length || 0} recommendations</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

