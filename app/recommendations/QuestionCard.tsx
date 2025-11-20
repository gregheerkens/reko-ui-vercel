import React, { useEffect, useState } from 'react';
import { WizardQuestion, useWizard } from './WizardContext';
import { getExpression, loadDictionary } from '../lib/genome-dictionary';

interface QuestionCardProps {
  question: WizardQuestion;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  const { answers, setAnswer } = useWizard();
  const currentValue = answers[question.traitIndex];
  const [isDictionaryLoaded, setIsDictionaryLoaded] = useState(false);

  useEffect(() => {
    loadDictionary().then(() => setIsDictionaryLoaded(true));
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-4 transition-all hover:shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {question.question}
      </h3>
      <p className="text-sm text-gray-500 mb-4 italic">
        {question.variant}
      </p>

      <div className="flex flex-wrap gap-2">
        {question.options.map((opt) => {
          const isSelected = currentValue === opt.value;
          let style = {};

          if (isDictionaryLoaded && opt.value !== '?') {
             const expr = getExpression(question.traitIndex, opt.value);
             if (expr && isSelected) {
               style = {
                 backgroundColor: expr.color,
                 color: '#fff', // Assuming white text is safe for colored backgrounds; could improve with contrast check
                 borderColor: expr.color
               };
             }
          }

          return (
            <button
              key={opt.value}
              onClick={() => setAnswer(question.traitIndex, opt.value)}
              style={style}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-colors border
                ${isSelected && opt.value === '?' 
                  ? 'bg-gray-600 text-white border-gray-600' 
                  : ''
                }
                ${!isSelected 
                  ? 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200' 
                  : ''
                }
                ${isSelected && opt.value !== '?' && !style.backgroundColor 
                   // Fallback if dictionary not loaded or color missing
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : ''
                }
              `}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
