import React from 'react';
import { useWizard } from './WizardContext';
import { QuestionCard } from './QuestionCard';
import { ResultsGrid } from './ResultsGrid';

export const WizardContainer: React.FC = () => {
  const { 
    currentStep, 
    currentStepIndex, 
    totalSteps, 
    nextStep, 
    prevStep, 
    isComplete,
    genomePattern
  } = useWizard();

  if (isComplete) {
    return <ResultsGrid />;
  }

  const progressPercent = ((currentStepIndex) / totalSteps) * 100;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
          <span>Step {currentStepIndex + 1} of {totalSteps}</span>
          <span>{Math.round(progressPercent)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {currentStep.stepTitle}
        </h1>
        <p className="text-gray-600">
          Answer these to help us narrow down your perfect read.
        </p>
      </div>

      <div className="space-y-6 mb-8">
        {currentStep.questions.map((q) => (
          <QuestionCard key={q.traitIndex} question={q} />
        ))}
      </div>

      {/* Debug / Pattern Preview */}
      <div className="mb-8 p-3 bg-gray-50 font-mono text-xs text-gray-500 break-all rounded border">
        Current Pattern: {genomePattern}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          onClick={prevStep}
          disabled={currentStepIndex === 0}
          className={`
            px-6 py-3 rounded-lg font-medium
            ${currentStepIndex === 0 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          Back
        </button>
        
        <button
          onClick={nextStep}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-colors"
        >
          {currentStepIndex === totalSteps - 1 ? 'See Matches' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

