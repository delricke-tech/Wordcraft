import { useState } from 'react';
import {
  Check,
  Zap,
  Crown,
  Building,
  Sparkles,
  Shield,
  Users,
  FileText,
  Video,
  Brain,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Plan = {
  id: string;
  name: string;
  price: number;
  period: string;
  icon: React.ElementType;
  description: string;
  features: string[];
  credits: number;
  highlighted?: boolean;
};

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    period: 'pour toujours',
    icon: Zap,
    description: 'Parfait pour debuter',
    credits: 50,
    features: [
      '50 credits IA/mois',
      'Jusqu\'a 10 documents',
      'Fiches d\'etude basiques',
      'Quiz standards',
      'Acces communautaire',
    ],
  },
  {
    id: 'student_pro',
    name: 'Etudiant Pro',
    price: 9.99,
    period: 'mois',
    icon: Crown,
    description: 'Pour les etudiants serieux',
    credits: 500,
    highlighted: true,
    features: [
      '500 credits IA/mois',
      'Documents illimites',
      'Fiches d\'etude avancees',
      'Quiz adaptatifs',
      'Repetition espacee',
      'Support prioritaire',
      'Outils de collaboration',
    ],
  },
  {
    id: 'teacher',
    name: 'Enseignant',
    price: 19.99,
    period: 'mois',
    icon: Users,
    description: 'Pour les educateurs',
    credits: 1000,
    features: [
      '1000 credits IA/mois',
      'Outils de creation de cours',
      'Analyses des etudiants',
      'Generation de contenu en masse',
      'Modeles personnalises',
      'Integration LMS',
      'Support dedie',
    ],
  },
  {
    id: 'institution',
    name: 'Institution',
    price: 99.99,
    period: 'mois',
    icon: Building,
    description: 'Pour les ecoles et universites',
    credits: 10000,
    features: [
      '10000 credits IA/mois',
      'Utilisateurs illimites',
      'Tableau de bord admin',
      'Integration SSO',
      'Personnalisation de marque',
      'Acces API',
      'Responsable succes dedie',
    ],
  },
];

const creditPacks = [
  { credits: 100, price: 4.99, popular: false },
  { credits: 500, price: 19.99, popular: true },
  { credits: 1000, price: 34.99, popular: false },
];

export function Subscription() {
  const { profile } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [showCreditPacks, setShowCreditPacks] = useState(false);

  const currentPlan = plans.find((p) => p.id === profile?.subscription_tier) || plans[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Abonnement</h1>
        <p className="text-gray-500 mt-1">Gerez votre forfait et votre facturation</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
              <currentPlan.icon size={24} className="text-teal-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Forfait actuel : {currentPlan.name}</h2>
              <p className="text-gray-500">
                {profile?.ai_credits || 0} credits IA restants
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreditPacks(!showCreditPacks)}
            className="flex items-center gap-2 px-4 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50"
          >
            <Sparkles size={18} />
            Acheter des credits
          </button>
        </div>

        {showCreditPacks && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Packs de credits</h3>
            <div className="grid grid-cols-3 gap-4">
              {creditPacks.map((pack) => (
                <div
                  key={pack.credits}
                  className={`relative p-4 border rounded-xl cursor-pointer transition-all hover:border-teal-500 ${
                    pack.popular ? 'border-teal-500 bg-teal-50' : 'border-gray-200'
                  }`}
                >
                  {pack.popular && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-teal-600 text-white text-xs font-medium rounded-full">
                      Populaire
                    </span>
                  )}
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{pack.credits}</p>
                    <p className="text-sm text-gray-500">credits</p>
                    <p className="text-lg font-semibold text-teal-600 mt-2">{pack.price}EUR</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="text-center">
        <div className="inline-flex items-center p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingPeriod === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingPeriod === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Annuel <span className="text-green-600">-20%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const price = billingPeriod === 'yearly' ? plan.price * 0.8 : plan.price;
          const isCurrentPlan = plan.id === profile?.subscription_tier;

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-xl border-2 p-6 transition-all ${
                plan.highlighted
                  ? 'border-teal-500 shadow-lg scale-105'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {plan.highlighted && (
                <span className="inline-block px-3 py-1 bg-teal-600 text-white text-xs font-medium rounded-full mb-4">
                  Le plus populaire
                </span>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  plan.highlighted ? 'bg-teal-100' : 'bg-gray-100'
                }`}>
                  <plan.icon size={20} className={plan.highlighted ? 'text-teal-600' : 'text-gray-600'} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900">{price.toFixed(2)}EUR</span>
                <span className="text-gray-500">/{billingPeriod === 'yearly' ? 'an' : plan.period}</span>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={16} className="text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                disabled={isCurrentPlan}
                className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
                  isCurrentPlan
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : plan.highlighted
                    ? 'bg-teal-600 text-white hover:bg-teal-700'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {isCurrentPlan ? 'Forfait actuel' : 'Passer a ce forfait'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Comparaison des fonctionnalites</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Fonctionnalite</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="text-center py-3 px-4 font-medium text-gray-900">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-3 px-4 text-gray-600 flex items-center gap-2">
                  <Sparkles size={16} /> Credits IA
                </td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center py-3 px-4 font-medium">
                    {plan.credits}/mois
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-600 flex items-center gap-2">
                  <FileText size={16} /> Documents
                </td>
                <td className="text-center py-3 px-4">10</td>
                <td className="text-center py-3 px-4">Illimite</td>
                <td className="text-center py-3 px-4">Illimite</td>
                <td className="text-center py-3 px-4">Illimite</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-600 flex items-center gap-2">
                  <Brain size={16} /> Apprentissage adaptatif
                </td>
                <td className="text-center py-3 px-4 text-gray-400">-</td>
                <td className="text-center py-3 px-4 text-green-500"><Check size={16} className="mx-auto" /></td>
                <td className="text-center py-3 px-4 text-green-500"><Check size={16} className="mx-auto" /></td>
                <td className="text-center py-3 px-4 text-green-500"><Check size={16} className="mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-600 flex items-center gap-2">
                  <Video size={16} /> Sessions video
                </td>
                <td className="text-center py-3 px-4">2/mois</td>
                <td className="text-center py-3 px-4">Illimite</td>
                <td className="text-center py-3 px-4">Illimite</td>
                <td className="text-center py-3 px-4">Illimite</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-600 flex items-center gap-2">
                  <Shield size={16} /> Support prioritaire
                </td>
                <td className="text-center py-3 px-4 text-gray-400">-</td>
                <td className="text-center py-3 px-4 text-green-500"><Check size={16} className="mx-auto" /></td>
                <td className="text-center py-3 px-4 text-green-500"><Check size={16} className="mx-auto" /></td>
                <td className="text-center py-3 px-4 text-green-500"><Check size={16} className="mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
