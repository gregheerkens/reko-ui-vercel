'use client';

import { TraitDefinition } from '../../lib/genome-dictionary';
import TraitSelector from './TraitSelector';
import { TraitSelection } from './types';

interface TraitSelectorGridProps {
  traits: TraitDefinition[];
  selections: TraitSelection;
  onSelectionChange: (traitIndex: number, expression: string) => void;
}

export default function TraitSelectorGrid({
  traits,
  selections,
  onSelectionChange,
}: TraitSelectorGridProps) {
  // Sort traits by index to ensure correct order
  const sortedTraits = [...traits].sort((a, b) => a.index - b.index);

  // Count selected traits
  const selectedCount = Object.keys(selections).filter(
    (key) => selections[parseInt(key, 10)]
  ).length;

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-800 font-medium">
        Selected: {selectedCount} / 50 traits
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedTraits.map((trait) => (
          <TraitSelector
            key={trait.index}
            trait={trait}
            selectedExpression={selections[trait.index]}
            onSelectionChange={onSelectionChange}
          />
        ))}
      </div>
    </div>
  );
}

