import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { Library } from './pages/Library';
import { DocumentView } from './pages/DocumentView';
import { PDFViewerPage } from './pages/PDFViewerPage';
import { StudyCards } from './pages/StudyCards';
import { CardDetail } from './pages/CardDetail';
import { MergeCards } from './pages/MergeCards';
import { Quizzes } from './pages/Quizzes';
import { TakeQuiz } from './pages/TakeQuiz';
import { Groups } from './pages/Groups';
import { GroupDetail } from './pages/GroupDetail';
import { Messages } from './pages/Messages';
import { Sessions } from './pages/Sessions';
import { AIAssistant } from './pages/AIAssistant';
import { Settings } from './pages/Settings';
import { Subscription } from './pages/Subscription';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { MigrationPDF } from './pages/MigrationPDF';
import { AutoFixOrphans } from './pages/AutoFixOrphans';
import { Toaster } from 'sonner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Page d'accueil publique */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Pages d'authentification */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="library" element={<Library />} />
        <Route path="library/:id" element={<DocumentView />} />
        <Route path="library/:id/view" element={<PDFViewerPage />} />
        <Route path="migration-pdf" element={<MigrationPDF />} />
        <Route path="auto-fix-orphans" element={<AutoFixOrphans />} />
        <Route path="cards" element={<StudyCards />} />
        <Route path="cards/new" element={<StudyCards />} />
        <Route path="cards/merge" element={<MergeCards />} />
        <Route path="cards/:id" element={<CardDetail />} />
        <Route path="cards/:id/edit" element={<StudyCards />} />
        <Route path="quizzes" element={<Quizzes />} />
        <Route path="quizzes/new" element={<Quizzes />} />
        <Route path="quizzes/:id/take" element={<TakeQuiz />} />
        <Route path="quizzes/:id/edit" element={<Quizzes />} />
        <Route path="groups" element={<Groups />} />
        <Route path="groups/new" element={<Groups />} />
        <Route path="groups/:id" element={<GroupDetail />} />
        <Route path="messages" element={<Messages />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="sessions/new" element={<Sessions />} />
        <Route path="sessions/:id" element={<Sessions />} />
        <Route path="sessions/:id/join" element={<Sessions />} />
        <Route path="ai-assistant" element={<AIAssistant />} />
        <Route path="settings" element={<Settings />} />
        <Route path="subscription" element={<Subscription />} />
        <Route path="profile" element={<Settings />} />
        <Route path="notifications" element={<Dashboard />} />
        <Route path="teacher/courses" element={<TeacherDashboard />} />
        <Route path="teacher/courses/:id" element={<TeacherDashboard />} />
        <Route path="teacher/courses/:id/analytics" element={<TeacherDashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster 
          position="top-right" 
          richColors 
          expand={false}
          closeButton
          duration={4000}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

