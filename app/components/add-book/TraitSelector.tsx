'use client';

import { TraitDefinition, ExpressionDefinition } from '../../lib/genome-dictionary';

interface TraitSelectorProps {
  trait: TraitDefinition;
  selectedExpression: string | undefined;
  onSelectionChange: (traitIndex: number, expression: string) => void;
}

export default function TraitSelector({
  trait,
  selectedExpression,
  onSelectionChange,
}: TraitSelectorProps) {
  const expressionKeys = Object.keys(trait.expressions).sort();
  const selectedColor = selectedExpression && trait.expressions[selectedExpression]
    ? trait.expressions[selectedExpression].color
    : null;

  return (
    <div
      className="rounded-lg border-2 p-4 bg-white shadow-sm transition-all"
      style={{
        borderColor: selectedColor || '#e5e7eb', // Use genome color or default gray
      }}
    >
      <label
        htmlFor={`trait-${trait.index}`}
        className="block text-sm font-medium text-gray-800 mb-2"
        title={trait.description}
      >
        {trait.index}. {trait.name}
        {!selectedExpression && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={`trait-${trait.index}`}
        value={selectedExpression || ''}
        onChange={(e) => onSelectionChange(trait.index, e.target.value)}
        required
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-800 bg-white"
      >
        <option value="">-- Select --</option>
        {expressionKeys.map((letter) => {
          const expression = trait.expressions[letter];
          return (
            <option key={letter} value={letter} title={expression.description}>
              {letter}: {expression.short} - {expression.description}
            </option>
          );
        })}
      </select>
      {selectedExpression && trait.expressions[selectedExpression] && (
        <div className="flex items-center gap-2 text-xs text-gray-700 mt-2">
          <div
            className="w-4 h-4 rounded border border-gray-300 shrink-0"
            style={{
              backgroundColor: trait.expressions[selectedExpression].color,
            }}
            title={`Color: ${trait.expressions[selectedExpression].color}`}
          />
          <span className="text-gray-800">{trait.expressions[selectedExpression].context}</span>
        </div>
      )}
    </div>
  );
}

