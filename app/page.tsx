import Layout from './components/Layout';
import Link from 'next/link';

export default function Home() {
  return (
    <Layout>
      <div className="px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Reko
          </h1>
          <p className="text-xl text-gray-900 mb-8">
            Discover your next favorite book through genome-based recommendations
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/books"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Books
            </Link>
            <Link
              href="/recommendations"
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Get Recommendations
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
