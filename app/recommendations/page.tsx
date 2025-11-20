'use client';

import Layout from '../components/Layout';
import { WizardProvider } from './WizardContext';
import { WizardContainer } from './WizardContainer';

export default function RecommendationsPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <WizardProvider>
          <WizardContainer />
        </WizardProvider>
      </div>
    </Layout>
  );
}
