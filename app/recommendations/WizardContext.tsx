import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import questionsConfig from '../lib/wizard_questions.json';

// Types
export type WizardQuestion = {
  traitIndex: number;
  question: string;
  variant: string;
  options: { label: string; value: string }[];
};

export type WizardStep = {
  stepTitle: string;
  questions: WizardQuestion[];
};

type WizardContextType = {
  currentStepIndex: number;
  totalSteps: number;
  currentStep: WizardStep;
  answers: Record<number, string>;
  genomePattern: string;
  isComplete: boolean;
  
  // Actions
  setAnswer: (traitIndex: number, value: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetWizard: () => void;
};

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export const WizardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  // Group questions by step from config
  const steps: WizardStep[] = questionsConfig as WizardStep[];
  const totalSteps = steps.length;
  
  const currentStep = steps[currentStepIndex];
  const isComplete = currentStepIndex >= totalSteps;

  // Build 50-char genome pattern
  const genomePattern = useMemo(() => {
    let pattern = "";
    for (let i = 1; i <= 50; i++) {
      const val = answers[i];
      // If answered and not '?', use the letter. Else '?'
      if (val && val !== '?') {
        pattern += val;
      } else {
        pattern += "?";
      }
    }
    return pattern;
  }, [answers]);

  const setAnswer = (traitIndex: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [traitIndex]: value
    }));
  };

  const nextStep = () => {
    if (currentStepIndex < totalSteps) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const resetWizard = () => {
    setCurrentStepIndex(0);
    setAnswers({});
  };

  return (
    <WizardContext.Provider value={{
      currentStepIndex,
      totalSteps,
      currentStep,
      answers,
      genomePattern,
      isComplete,
      setAnswer,
      nextStep,
      prevStep,
      resetWizard
    }}>
      {children}
    </WizardContext.Provider>
  );
};

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
};

