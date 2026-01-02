import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  Briefcase,
  Calendar,
  FileText,
  Award,
  Settings,
  UserPlus,
  UserMinus,
  Share2,
  MoreVertical,
  Edit2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Profile as ProfileType, Post } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

type ProfileStats = {
  documentsCount: number;
  cardsCount: number;
  quizzesCount: number;
  followersCount: number;
  followingCount: number;
  postsCount: number;
};

export function Profile() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<ProfileStats>({
    documentsCount: 0,
    cardsCount: 0,
    quizzesCount: 0,
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');

  // Déterminer si c'est son propre profil
  const profileUserId = id || user?.id;
  const isOwnProfile = profileUserId === user?.id;

  useEffect(() => {
    if (profileUserId) {
      fetchProfileData();
    }
  }, [profileUserId]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      // Récupérer le profil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileUserId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Récupérer les posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', profileUserId)
        .order('created_at', { ascending: false })
        .limit(20);

      setPosts(postsData || []);

      // Récupérer les statistiques
      const [documentsResult, cardsResult, quizzesResult, followersResult, followingResult] =
        await Promise.all([
          supabase.from('documents').select('id', { count: 'exact', head: true }).eq('user_id', profileUserId),
          supabase.from('study_cards').select('id', { count: 'exact', head: true }).eq('user_id', profileUserId),
          supabase.from('quizzes').select('id', { count: 'exact', head: true }).eq('user_id', profileUserId),
          supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', profileUserId),
          supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', profileUserId),
        ]);

      setStats({
        documentsCount: documentsResult.count || 0,
        cardsCount: cardsResult.count || 0,
        quizzesCount: quizzesResult.count || 0,
        followersCount: followersResult.count || 0,
        followingCount: followingResult.count || 0,
        postsCount: postsData?.length || 0,
      });

      // Vérifier si on suit déjà cette personne
      if (!isOwnProfile && user) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', profileUserId)
          .single();

        setIsFollowing(!!followData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || !profileUserId) return;

    try {
      if (isFollowing) {
        // Ne plus suivre
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profileUserId);

        setIsFollowing(false);
        setStats((prev) => ({ ...prev, followersCount: Math.max(0, prev.followersCount - 1) }));
        toast.success('Vous ne suivez plus cet utilisateur');
      } else {
        // Suivre
        await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: profileUserId,
        });

        setIsFollowing(true);
        setStats((prev) => ({ ...prev, followersCount: prev.followersCount + 1 }));
        toast.success('Vous suivez maintenant cet utilisateur');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Erreur lors de l\'action');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Profil introuvable</h3>
        <button onClick={() => navigate('/feed')} className="mt-4 text-teal-600 hover:underline">
          Retour au fil d'actualité
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Cover & Profile Picture */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-64 bg-gradient-to-br from-teal-500 via-blue-500 to-purple-600 rounded-t-2xl" />

        {/* Profile Info */}
        <div className="bg-white rounded-b-2xl shadow-lg p-6 -mt-20 relative">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            {/* Avatar & Basic Info */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4">
              {/* Avatar */}
              <div className="relative">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || profile.email}
                    className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white text-4xl font-bold">
                    {(profile.full_name || profile.email)[0].toUpperCase()}
                  </div>
                )}
                {isOwnProfile && (
                  <button
                    onClick={() => navigate('/settings')}
                    className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                    title="Modifier le profil"
                  >
                    <Edit2 size={16} className="text-gray-600" />
                  </button>
                )}
              </div>

              {/* Name & Info */}
              <div className="text-center md:text-left mb-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.full_name || 'Utilisateur'}
                </h1>
                <p className="text-gray-500">{profile.email}</p>
                {profile.bio && <p className="text-gray-700 mt-2 max-w-xl">{profile.bio}</p>}

                {/* Details */}
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                  {profile.study_field && (
                    <span className="flex items-center gap-1">
                      <Briefcase size={16} />
                      {profile.study_field}
                    </span>
                  )}
                  {profile.institution && (
                    <span className="flex items-center gap-1">
                      <MapPin size={16} />
                      {profile.institution}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar size={16} />
                    Membre depuis {new Date().getFullYear()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {isOwnProfile ? (
                <button
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Settings size={18} />
                  Modifier le profil
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFollowToggle}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isFollowing
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-teal-600 text-white hover:bg-teal-700'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus size={18} />
                        Ne plus suivre
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        Suivre
                      </>
                    )}
                  </button>
                  <button className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    <Share2 size={18} />
                  </button>
                  <button className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.postsCount}</p>
              <p className="text-sm text-gray-500">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.followersCount}</p>
              <p className="text-sm text-gray-500">Abonnés</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.followingCount}</p>
              <p className="text-sm text-gray-500">Abonnements</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.documentsCount}</p>
              <p className="text-sm text-gray-500">Documents</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.cardsCount}</p>
              <p className="text-sm text-gray-500">Fiches</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.quizzesCount}</p>
              <p className="text-sm text-gray-500">Quiz</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('posts')}
            className={`pb-4 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'posts'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Publications
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`pb-4 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'about'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            À propos
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'posts' ? (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {isOwnProfile ? 'Aucune publication' : 'Aucune publication pour le moment'}
                </h3>
                <p className="text-gray-500">
                  {isOwnProfile && 'Partagez vos réussites et vos questions avec la communauté !'}
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg p-6 shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white font-medium">
                          {(profile.full_name || profile.email)[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{profile.full_name || profile.email}</p>
                        <p className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-gray-700 whitespace-pre-wrap">{post.content}</p>
                  <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
                    <span>{post.like_count} J'aime</span>
                    <span>{post.comment_count} Commentaires</span>
                    <span>{post.share_count} Partages</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
            <div className="space-y-4">
              {profile.study_field && (
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Domaine d'études</p>
                    <p className="font-medium text-gray-900">{profile.study_field}</p>
                  </div>
                </div>
              )}
              {profile.institution && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Institution</p>
                    <p className="font-medium text-gray-900">{profile.institution}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Rôle</p>
                  <p className="font-medium text-gray-900 capitalize">{profile.role}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
