import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
    }
    setProfile(data);
    setLoading(false);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    console.log('🚀 Début de l\'inscription...');
    console.log('📧 Email:', email);
    console.log('👤 Nom complet:', fullName);
    console.log('🌍 Environnement:', import.meta.env.MODE);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        // En développement, ne pas envoyer d'email de confirmation
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    console.log('📡 Réponse Supabase auth.signUp:');
    console.log('  - Utilisateur créé:', data.user ? `✅ ID: ${data.user.id}` : '❌ Aucun');
    console.log('  - Session créée:', data.session ? '✅ Oui' : '❌ Non');
    console.log('  - Email confirmé:', data.user?.email_confirmed_at ? '✅ Oui' : '⏳ En attente');
    
    if (error) {
      console.error('❌ Erreur Supabase lors de l\'inscription:');
      console.error('  - Code:', error.status);
      console.error('  - Message:', error.message);
      console.error('  - Détails complets:', error);
      return { error };
    }

    // Si l'utilisateur est créé mais pas de session (confirmation email requise)
    if (data.user && !data.session) {
      console.log('⏳ Confirmation email requise');
      console.log('💡 L\'utilisateur doit vérifier son email avant de se connecter');
      console.log('📧 Email envoyé à:', data.user.email);
      
      // Vérifier si l'email a été confirmé automatiquement (mode dev)
      if (data.user.email_confirmed_at) {
        console.log('✅ Email auto-confirmé! (Mode développement)');
      }
    }

    // Si l'utilisateur est créé avec une session (confirmation désactivée)
    if (data.user && data.session) {
      console.log('✅ Inscription réussie avec session active!');
      console.log('🎉 L\'utilisateur est automatiquement connecté');
      
      // Créer le profil dans la base de données
      console.log('💾 Création du profil dans la base de données...');
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', data.user.id);

      if (profileError) {
        console.warn('⚠️ Erreur lors de la mise à jour du profil:', profileError);
      } else {
        console.log('✅ Profil mis à jour avec succès');
      }
    }

    console.log('✅ Processus d\'inscription terminé');
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error && profile) {
      setProfile({ ...profile, ...updates });
    }

    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
