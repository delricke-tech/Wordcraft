import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Plus,
  Search,
  BarChart2,
  Users,
  BookOpen,
  Pencil,
  Copy,
  MoreVertical,
  TrendingUp,
  X,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type Course = {
  id: string;
  title: string;
  description: string;
  subject: string;
  level: string;
  cover_image: string | null;
  modules: unknown[];
  is_draft: boolean;
  is_published: boolean;
  student_count: number;
  average_rating: number | null;
  created_at: string;
  updated_at: string;
};

export function TeacherDashboard() {
  useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewCourseModal, setShowNewCourseModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'published' | 'drafts'>('published');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('course_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const publishedCourses = courses.filter((c) => c.is_published);
  const draftCourses = courses.filter((c) => !c.is_published);
  const displayCourses = activeTab === 'published' ? publishedCourses : draftCourses;

  const filteredCourses = displayCourses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStudents = courses.reduce((sum, c) => sum + c.student_count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des cours</h1>
          <p className="text-gray-500 mt-1">Creez et gerez vos cours</p>
        </div>
        <button
          onClick={() => setShowNewCourseModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus size={18} />
          Nouveau cours
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Total des cours</span>
            <GraduationCap size={18} className="text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{courses.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Publies</span>
            <BookOpen size={18} className="text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{publishedCourses.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Total etudiants</span>
            <Users size={18} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{totalStudents}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Note moyenne</span>
            <TrendingUp size={18} className="text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">4.8</p>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('published')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'published'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Publies ({publishedCourses.length})
        </button>
        <button
          onClick={() => setActiveTab('drafts')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'drafts'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Brouillons ({draftCourses.length})
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher des cours..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-16">
          <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === 'published' ? 'Aucun cours publie' : 'Aucun brouillon'}
          </h3>
          <p className="text-gray-500 mb-6">
            Creez votre premier cours pour partager vos connaissances avec les etudiants
          </p>
          <button
            onClick={() => setShowNewCourseModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus size={18} />
            Creer un cours
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="h-32 bg-gradient-to-br from-teal-500 to-teal-700 relative">
                {course.cover_image && (
                  <img
                    src={course.cover_image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    course.is_published
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {course.is_published ? 'Publie' : 'Brouillon'}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <Link to={`/teacher/courses/${course.id}`}>
                      <h3 className="font-semibold text-gray-900 hover:text-teal-600">
                        {course.title}
                      </h3>
                    </Link>
                    {course.subject && (
                      <span className="text-sm text-gray-500">{course.subject}</span>
                    )}
                  </div>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical size={16} />
                  </button>
                </div>

                {course.description && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{course.description}</p>
                )}

                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Layers size={14} />
                    {Array.isArray(course.modules) ? course.modules.length : 0} modules
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {course.student_count} etudiants
                  </span>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    Mis a jour le {format(new Date(course.updated_at), 'd MMM', { locale: fr })}
                  </span>
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/teacher/courses/${course.id}`}
                      className="p-1.5 hover:bg-gray-100 rounded"
                      title="Modifier"
                    >
                      <Pencil size={16} className="text-gray-500" />
                    </Link>
                    <Link
                      to={`/teacher/courses/${course.id}/analytics`}
                      className="p-1.5 hover:bg-gray-100 rounded"
                      title="Statistiques"
                    >
                      <BarChart2 size={16} className="text-gray-500" />
                    </Link>
                    <button className="p-1.5 hover:bg-gray-100 rounded" title="Dupliquer">
                      <Copy size={16} className="text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNewCourseModal && (
        <NewCourseModal
          onClose={() => setShowNewCourseModal(false)}
          onCreated={fetchCourses}
        />
      )}
    </div>
  );
}

function NewCourseModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!user || !title) return;

    setLoading(true);
    const { error } = await supabase.from('course_templates').insert({
      teacher_id: user.id,
      title,
      description,
      subject,
      level,
      modules: [],
    });

    if (!error) {
      onCreated();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Creer un nouveau cours</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre du cours</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Introduction a la cardiologie"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve description du cours"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Matiere</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Selectionnez une matiere</option>
                <option value="anatomy">Anatomie</option>
                <option value="physiology">Physiologie</option>
                <option value="pharmacology">Pharmacologie</option>
                <option value="pathology">Pathologie</option>
                <option value="cardiology">Cardiologie</option>
                <option value="neurology">Neurologie</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Niveau</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Selectionnez un niveau</option>
                <option value="beginner">Debutant</option>
                <option value="intermediate">Intermediaire</option>
                <option value="advanced">Avance</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleCreate}
            disabled={!title || loading}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? 'Creation...' : 'Creer le cours'}
          </button>
        </div>
      </div>
    </div>
  );
}
