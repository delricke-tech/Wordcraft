import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess';
import { AlertCircle, Clock } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { hasAccess, isTrial, daysRemaining, loading } = useSubscriptionAccess();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return <Navigate to="/subscription" replace />;
  }

  // Afficher un bandeau si l'essai se termine bientôt
  const showTrialWarning = isTrial && daysRemaining <= 2;

  return (
    <>
      {showTrialWarning && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2 text-yellow-800">
              <Clock className="w-5 h-5" />
              <span className="font-medium">
                Il vous reste {daysRemaining} jour{daysRemaining > 1 ? 's' : ''} d'essai gratuit
              </span>
            </div>
            <a
              href="/subscription"
              className="text-sm bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition"
            >
              S'abonner maintenant
            </a>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
