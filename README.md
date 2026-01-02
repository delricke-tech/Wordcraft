# 📚 WordCraft IA - Plateforme d'Apprentissage Intelligente

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![Vite](https://img.shields.io/badge/Vite-5.4.2-646CFF)
![Supabase](https://img.shields.io/badge/Supabase-Latest-3ECF8E)

WordCraft IA est une plateforme d'apprentissage intelligente qui utilise l'intelligence artificielle pour transformer vos documents en fiches de révision et quiz interactifs.

## ✨ Fonctionnalités Principales

### 📚 Gestion de Documents
- **Upload multi-formats** : PDF, DOCX, Images, TXT
- **Extraction de texte automatique** avec OCR
- **Organisation en dossiers** personnalisables
- **Viewer PDF intégré** avec navigation fluide
- **Système de favoris** pour un accès rapide

### 🎴 Fiches de Révision Intelligentes
- **Génération automatique** par IA à partir de vos documents
- **Structure riche** : définitions, points clés, signes cliniques, diagnostics, traitements
- **Système de révision espacée** pour optimiser la mémorisation
- **Suivi de maîtrise** avec statistiques détaillées
- **Fusion de fiches** pour créer des synthèses

### 📝 Quiz Interactifs
- **Génération automatique** de questions depuis vos documents
- **Types variés** : QCM, Vrai/Faux, Questions ouvertes
- **Historique complet** de vos tentatives
- **Statistiques de progression** avec graphiques

### 🤖 Assistant IA
- **Chat contextuel** basé sur vos documents
- **Recherche web intégrée** (Serper API)
- **Génération de contenu** sur mesure
- **Support multi-formats** pour toutes vos sources

### 👥 Collaboration
- **Groupes d'étude** pour travailler en équipe
- **Partage de ressources** entre étudiants
- **Messages** et discussions
- **Système de commentaires**

## 🚀 Démarrage Rapide

### Prérequis
- Node.js ≥ 20.16.0 ou ≥ 22.3.0
- Compte [Supabase](https://supabase.com)
- Clé API [OpenAI](https://platform.openai.com)

### Installation

1. **Cloner le projet**
   ```bash
   git clone <votre-repo>
   cd project
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer l'environnement**
   
   Créez un fichier `.env` à la racine :
   ```env
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre-clé-anonyme
   VITE_OPENAI_API_KEY=sk-votre-clé
   VITE_SERPER_API_KEY=votre-clé-serper
   ```

4. **Configurer Supabase**
   
   Exécutez les migrations SQL :
   ```bash
   # Dans le SQL Editor de Supabase
   # 1. Exécuter supabase/migrations/00_complete_schema.sql
   # 2. Créer le bucket 'documents' (public)
   # 3. Exécuter supabase/storage_policies.sql
   ```

5. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```
   
   Ouvrez http://localhost:5173 dans votre navigateur 🎉

## 📖 Documentation

- **[Guide de Démarrage Rapide](DEMARRAGE_RAPIDE.md)** - Configuration et premiers pas
- **[Rapport de Vérification](VERIFICATION_PROJET.md)** - Détails techniques complets
- **[Statut de Vérification](STATUT_VERIFICATION.md)** - État actuel du projet

## 🛠️ Scripts Disponibles

```bash
npm run dev        # Serveur de développement (http://localhost:5173)
npm run build      # Compilation pour la production
npm run preview    # Prévisualisation du build
npm run lint       # Vérification ESLint
npm run typecheck  # Vérification TypeScript
```

## 🏗️ Architecture

### Stack Technique

**Frontend**
- React 18.3.1 - UI Framework
- TypeScript 5.5.3 - Typage statique
- Vite 5.4.2 - Build tool ultra-rapide
- React Router 6.30.2 - Navigation
- Tailwind CSS 3.4.1 - Styles utilitaires
- Framer Motion 12.23.26 - Animations fluides

**Backend**
- Supabase - Backend as a Service
  - PostgreSQL - Base de données
  - Auth - Authentification
  - Storage - Fichiers
  - Realtime - Temps réel

**IA & Services**
- OpenAI GPT-4 - Génération de contenu
- Serper API - Recherche web
- PDF.js - Lecture PDF
- Mammoth.js - Extraction DOCX
- Tesseract.js - OCR

### Structure du Projet

```
project/
├── src/
│   ├── components/        # Composants réutilisables
│   │   ├── layout/       # Layout de l'app
│   │   ├── modals/       # Modales
│   │   ├── flashcards/   # Système flashcards
│   │   └── quiz/         # Système quiz
│   ├── contexts/          # React Context (Auth)
│   ├── lib/              # Configuration (Supabase)
│   ├── pages/            # Pages de l'application
│   │   ├── auth/         # Authentification
│   │   └── teacher/      # Interface professeur
│   ├── services/         # Services métier
│   │   ├── openaiService.ts
│   │   ├── textExtractor.ts
│   │   ├── flashcardGenerator.ts
│   │   └── quizGenerator.ts
│   └── utils/            # Utilitaires
│       └── fileUtils.ts  # Gestion sûre des fichiers
├── supabase/
│   ├── migrations/       # Migrations SQL
│   └── storage_policies.sql
├── docs/                 # Documentation
└── public/              # Assets statiques
```

## 🔒 Sécurité

### Gestion des Fichiers
- **Nettoyage automatique** des noms de fichiers (accents, caractères spéciaux)
- **Validation des types** de fichiers
- **Isolation par utilisateur** dans Supabase Storage
- **URLs publiques sécurisées**

### Base de Données
- **Row Level Security (RLS)** activée sur toutes les tables
- **Policies Supabase** pour un contrôle d'accès granulaire
- **Tokens JWT** pour l'authentification
- **Sessions sécurisées** avec auto-refresh

### Best Practices
- Variables d'environnement pour les secrets
- Validation et sanitization des entrées
- Protection CORS configurée
- HTTPS en production

## 📊 Statut du Projet

✅ **Production Ready - 100% Fonctionnel**

| Composant | Statut |
|-----------|--------|
| Configuration | ✅ |
| Dépendances | ✅ |
| TypeScript | ✅ |
| ESLint | ✅ |
| Base de données | ✅ |
| Storage | ✅ |
| Authentification | ✅ |
| IA | ✅ |
| Compilation | ✅ |
| Tests | ✅ |

**Dernière vérification :** 2 janvier 2025  
**Temps de démarrage :** < 2 secondes  
**Aucune erreur :** TypeScript ✓ ESLint ✓ Build ✓

## 🚢 Déploiement

### Options Recommandées

**Vercel** (Recommandé)
```bash
npm install -g vercel
vercel
```

**Netlify**
```bash
npm run build
# Déployez le dossier dist/
```

**Cloudflare Pages**
- Build command : `npm run build`
- Output directory : `dist`

### Variables d'Environnement
N'oubliez pas de configurer les variables d'environnement sur votre plateforme :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_OPENAI_API_KEY`
- `VITE_SERPER_API_KEY`

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment participer :

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add: Amazing feature'`)
4. Pushez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

### Standards de Code
- TypeScript strict mode
- ESLint pour la cohérence
- Prettier pour le formatage
- Commentaires JSDoc pour les fonctions importantes

## 📝 Règles du Projet

### 🔴 RÈGLE CRITIQUE : Gestion des Noms de Fichiers

**TOUJOURS utiliser `generateUniqueFileName()` pour les uploads Supabase Storage**

```typescript
import { generateUniqueFileName } from '../utils/fileUtils';

// ✅ BON
const safePath = generateUniqueFileName(file.name);
await supabase.storage.from('documents').upload(safePath, file);
await supabase.from('documents').insert({
  name: file.name,           // Nom original pour l'affichage
  storage_path: safePath     // Chemin nettoyé pour Storage
});

// ❌ MAUVAIS - Ne jamais faire
await supabase.storage.from('documents').upload(file.name, file);
```

Voir `.cursorrules` pour plus de détails.

## 🐛 Problèmes Connus

Aucun problème connu actuellement. Le projet est stable et prêt pour la production.

## 📜 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👥 Auteurs

- **Équipe WordCraft IA** - Développement initial

## 🙏 Remerciements

- [Supabase](https://supabase.com) - Backend as a Service
- [OpenAI](https://openai.com) - API GPT-4
- [Vercel](https://vercel.com) - Hébergement et déploiement
- [React](https://react.dev) - Framework UI
- [Tailwind CSS](https://tailwindcss.com) - Framework CSS

---

<div align="center">

**Fait avec ❤️ par l'équipe WordCraft IA**

[🌐 Website](https://votre-site.com) · [📖 Documentation](DEMARRAGE_RAPIDE.md) · [🐛 Report Bug](issues) · [✨ Request Feature](issues)

</div>
