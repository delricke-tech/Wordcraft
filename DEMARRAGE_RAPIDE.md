# 🚀 Démarrage Rapide - WordCraft IA

## ✅ Statut du Projet

**Le projet est 100% fonctionnel et prêt à être utilisé !**

## 📋 Checklist Avant de Commencer

- [ ] Node.js ≥ 20.16.0 installé
- [ ] Compte Supabase créé
- [ ] Clé API OpenAI obtenue
- [ ] Dépendances installées (`npm install`)

## ⚡ Démarrage en 3 Étapes

### 1️⃣ Configurer l'Environnement

Créez un fichier `.env` à la racine du projet :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anonyme
VITE_OPENAI_API_KEY=sk-votre-clé
VITE_SERPER_API_KEY=votre-clé-serper
```

### 2️⃣ Configurer Supabase

Dans votre tableau de bord Supabase :

1. **Exécuter les migrations SQL**
   - Ouvrir SQL Editor
   - Copier/coller le contenu de `supabase/migrations/00_complete_schema.sql`
   - Exécuter

2. **Créer le bucket Storage**
   - Aller dans Storage
   - Créer un bucket nommé `documents`
   - Le rendre public

3. **Configurer les policies Storage**
   - Dans SQL Editor
   - Copier/coller le contenu de `supabase/storage_policies.sql`
   - Exécuter

### 3️⃣ Lancer l'Application

```bash
npm run dev
```

Le navigateur s'ouvrira automatiquement sur `http://localhost:5173` 🎉

## 🔍 Vérifications Rapides

### Tout fonctionne ?

✅ **Le serveur démarre sans erreur**
```bash
npm run dev
```

✅ **Pas d'erreurs TypeScript**
```bash
npm run typecheck
```

✅ **Pas d'erreurs ESLint**
```bash
npm run lint
```

✅ **La compilation fonctionne**
```bash
npm run build
```

## 🎯 Premiers Pas dans l'Application

### 1. Créer un Compte
- Accédez à `/register`
- Créez un compte avec votre email
- Connectez-vous

### 2. Tester l'Upload de Documents
- Allez dans **Bibliothèque**
- Cliquez sur "Ajouter un document"
- Uploadez un PDF
- Vérifiez qu'il apparaît dans la liste

### 3. Tester la Génération de Flashcards
- Ouvrez un document
- Cliquez sur "Générer des flashcards"
- Attendez la génération (IA)
- Consultez vos flashcards dans **Fiches de Révision**

### 4. Tester la Génération de Quiz
- Ouvrez un document
- Cliquez sur "Générer un quiz"
- Attendez la génération (IA)
- Passez le quiz dans **Quiz**

## 🆘 Problèmes Courants

### ❌ Erreur : "VITE_SUPABASE_URL is not defined"
**Solution :** Vérifiez que le fichier `.env` existe et contient les bonnes variables.

### ❌ Erreur : "Row Level Security" lors de l'upload
**Solution :** Assurez-vous d'avoir exécuté `storage_policies.sql` dans Supabase.

### ❌ Erreur : "Invalid key" lors de l'upload
**Solution :** Cette erreur ne devrait plus apparaître. Les noms de fichiers sont automatiquement nettoyés par `generateUniqueFileName()`.

### ❌ Erreur : "Unauthorized" lors de la génération IA
**Solution :** Vérifiez que `VITE_OPENAI_API_KEY` est correctement configurée dans `.env`.

### ❌ Le PDF ne s'affiche pas
**Solution :** Vérifiez que le bucket Storage `documents` est bien public dans Supabase.

## 📚 Documentation Complète

Pour une vérification détaillée du projet, consultez :
- `VERIFICATION_PROJET.md` - Rapport complet de vérification

## 🔧 Scripts Disponibles

```bash
npm run dev        # Serveur de développement
npm run build      # Compilation production
npm run preview    # Prévisualisation du build
npm run lint       # Vérification ESLint
npm run typecheck  # Vérification TypeScript
```

## 🎨 Fonctionnalités Principales

### 📚 Bibliothèque
- Upload de documents (PDF, DOCX, images)
- Organisation en dossiers
- Favoris
- Viewer PDF intégré
- Extraction de texte automatique

### 🎴 Fiches de Révision
- Création manuelle ou automatique (IA)
- Système de révision espacée
- Suivi de la maîtrise
- Export

### 📝 Quiz
- Génération automatique (IA)
- QCM, Vrai/Faux, Réponses courtes
- Statistiques et historique

### 🤖 Assistant IA
- Chat contextuel
- Génération de contenu
- Recherche web intégrée

### 👥 Collaboration
- Groupes d'étude
- Partage de ressources
- Messages

## 💡 Conseils d'Utilisation

### Pour de Meilleurs Résultats avec l'IA

1. **Documents de Qualité**
   - Utilisez des PDF avec du texte sélectionnable (pas des images scannées)
   - Les documents structurés donnent de meilleurs résultats

2. **Questions Précises**
   - Soyez précis dans vos questions à l'assistant IA
   - Donnez du contexte si nécessaire

3. **Révision Régulière**
   - Utilisez le système de révision espacée
   - Révisez les cartes suggérées quotidiennement

### Gestion des Crédits IA

- Chaque utilisateur commence avec **50 crédits**
- Génération de flashcards : ~10 crédits
- Génération de quiz : ~10 crédits
- Question à l'IA : ~1 crédit

Les crédits se rechargent selon votre abonnement.

## 🚀 Prêt à Commencer !

Vous avez maintenant tout ce qu'il faut pour utiliser WordCraft IA.

**Besoin d'aide ?** Consultez les fichiers de documentation dans le dossier `docs/`.

---

**Bon apprentissage avec WordCraft IA ! 📚✨**
