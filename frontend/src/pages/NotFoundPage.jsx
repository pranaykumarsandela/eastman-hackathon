import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EmptyState from '../components/EmptyState';
import { HelpCircle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex-1 w-full flex items-center justify-center">
        <EmptyState
          title="Page Not Found (404)"
          message="The page you are looking for does not exist or may have been moved."
          actionText="Return to Catalog"
          actionLink="/"
          icon={HelpCircle}
        />
      </main>
      <Footer />
    </div>
  );
}
