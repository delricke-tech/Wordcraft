import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  Image as ImageIcon,
  Smile,
  TrendingUp,
  Users,
  Award,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Post as PostType, Profile } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

type PostWithProfile = PostType & {
  profiles: Profile;
  isLiked?: boolean;
};

export function Feed() {
  const { user, profile: currentProfile } = useAuth();
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'following'>('all');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchPosts();
    subscribeToNewPosts();
  }, [activeFilter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            email,
            avatar_url,
            study_field,
            institution
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      // Filtrer par abonnements
      if (activeFilter === 'following' && user) {
        const { data: followsData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        const followingIds = followsData?.map((f) => f.following_id) || [];
        if (followingIds.length > 0) {
          query = query.in('user_id', followingIds);
        } else {
          setPosts([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Vérifier les likes de l'utilisateur
      if (user && data) {
        const postIds = data.map((p) => p.id);
        const { data: likesData } = await supabase
          .from('likes')
          .select('target_id')
          .eq('user_id', user.id)
          .eq('target_type', 'post')
          .in('target_id', postIds);

        const likedPostIds = new Set(likesData?.map((l) => l.target_id) || []);

        const postsWithLikes = data.map((post) => ({
          ...post,
          isLiked: likedPostIds.has(post.id),
        }));

        setPosts(postsWithLikes);
      } else {
        setPosts(data || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Erreur lors du chargement du fil');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNewPosts = () => {
    const subscription = supabase
      .channel('public-posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        async (payload) => {
          // Récupérer le profil de l'auteur
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', payload.new.user_id)
            .single();

          const newPost = {
            ...payload.new,
            profiles: profileData,
            isLiked: false,
          } as PostWithProfile;

          setPosts((prev) => [newPost, ...prev]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user || posting) return;

    try {
      setPosting(true);

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: newPostContent.trim(),
        post_type: 'status',
        visibility: 'public',
      });

      if (error) throw error;

      setNewPostContent('');
      toast.success('Publication partagée !');
      fetchPosts(); // Rafraîchir
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Impossible de publier');
    } finally {
      setPosting(false);
    }
  };

  const handleLikeToggle = async (post: PostWithProfile) => {
    if (!user) return;

    try {
      if (post.isLiked) {
        // Retirer le like
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('target_type', 'post')
          .eq('target_id', post.id);

        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? { ...p, like_count: Math.max(0, p.like_count - 1), isLiked: false }
              : p
          )
        );
      } else {
        // Ajouter un like
        await supabase.from('likes').insert({
          user_id: user.id,
          target_type: 'post',
          target_id: post.id,
        });

        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id ? { ...p, like_count: p.like_count + 1, isLiked: true } : p
          )
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Erreur lors du like');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette publication ?')) return;

    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);

      if (error) throw error;

      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success('Publication supprimée');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Impossible de supprimer');
    }
  };

  const handleSharePost = async (originalPost: PostWithProfile) => {
    if (!user) return;

    try {
      // Créer une nouvelle publication de type "share"
      const shareContent = `${originalPost.profiles?.full_name || 'Un utilisateur'} a partagé : "${originalPost.content.substring(0, 100)}${originalPost.content.length > 100 ? '...' : ''}"`;
      
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: shareContent,
        post_type: 'share',
        visibility: 'public',
        shared_resource_id: originalPost.id,
        shared_resource_type: 'post',
      });

      if (error) throw error;

      // Incrémenter le compteur de partages du post original
      await supabase
        .from('posts')
        .update({ share_count: originalPost.share_count + 1 })
        .eq('id', originalPost.id);

      // Mettre à jour localement
      setPosts((prev) =>
        prev.map((p) =>
          p.id === originalPost.id ? { ...p, share_count: p.share_count + 1 } : p
        )
      );

      toast.success('Publication partagée !');
      fetchPosts(); // Rafraîchir pour voir le nouveau post
    } catch (error) {
      console.error('Error sharing post:', error);
      toast.error('Impossible de partager');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Create Post Card */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex gap-3">
          {currentProfile?.avatar_url ? (
            <img
              src={currentProfile.avatar_url}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white font-medium">
              {(currentProfile?.full_name || currentProfile?.email || 'U')[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Quoi de neuf ?"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none text-gray-900 placeholder-gray-400"
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
                  <ImageIcon size={20} />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
                  <Smile size={20} />
                </button>
              </div>
              <button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || posting}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {posting ? 'Publication...' : 'Publier'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveFilter('all')}
          className={`pb-4 px-4 font-medium border-b-2 transition-colors ${
            activeFilter === 'all'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={18} />
            Tous les posts
          </div>
        </button>
        <button
          onClick={() => setActiveFilter('following')}
          className={`pb-4 px-4 font-medium border-b-2 transition-colors ${
            activeFilter === 'following'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={18} />
            Abonnements
          </div>
        </button>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune publication</h3>
          <p className="text-gray-500">
            {activeFilter === 'following'
              ? 'Suivez des personnes pour voir leurs publications ici'
              : 'Soyez le premier à partager quelque chose !'}
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="bg-white rounded-2xl shadow p-6">
            {/* Post Header */}
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <Link to={`/profile/${post.user_id}`}>
                  {post.profiles?.avatar_url ? (
                    <img
                      src={post.profiles.avatar_url}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white font-medium hover:opacity-80 transition-opacity">
                      {(post.profiles?.full_name || post.profiles?.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </Link>
                <div>
                  <Link
                    to={`/profile/${post.user_id}`}
                    className="font-semibold text-gray-900 hover:underline"
                  >
                    {post.profiles?.full_name || post.profiles?.email || 'Utilisateur'}
                  </Link>
                  {post.profiles?.study_field && (
                    <p className="text-sm text-gray-500">{post.profiles.study_field}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })}
                  </p>
                </div>
              </div>

              {post.user_id === user?.id && (
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                  title="Supprimer cette publication"
                >
                  <X size={16} />
                  <span>Supprimer</span>
                </button>
              )}
            </div>

            {/* Post Content */}
            <p className="mt-4 text-gray-800 whitespace-pre-wrap">{post.content}</p>

            {/* Post Actions */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => handleLikeToggle(post)}
                  className={`flex items-center gap-2 transition-colors ${
                    post.isLiked ? 'text-teal-600' : 'text-gray-500 hover:text-teal-600'
                  }`}
                >
                  <ThumbsUp size={20} fill={post.isLiked ? 'currentColor' : 'none'} />
                  <span className="font-medium">{post.like_count}</span>
                </button>

                <button className="flex items-center gap-2 text-gray-500 hover:text-teal-600 transition-colors">
                  <MessageCircle size={20} />
                  <span className="font-medium">{post.comment_count}</span>
                </button>

                <button
                  onClick={() => handleSharePost(post)}
                  className="flex items-center gap-2 text-gray-500 hover:text-teal-600 transition-colors"
                  title="Partager cette publication"
                >
                  <Share2 size={20} />
                  <span className="font-medium">{post.share_count}</span>
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
