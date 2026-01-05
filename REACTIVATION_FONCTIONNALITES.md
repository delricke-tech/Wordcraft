# 🔄 Guide de Réactivation des Fonctionnalités

## 📋 Fonctionnalités en Veille

Date de mise en veille : **05/01/2026**

### À Venir (Désactivées Temporairement)
- 📰 **Fil d'actualité** (`/feed`)
- 🧭 **Découvrir** (`/discover`)
- 👥 **Groupes** (`/groups`)
- 💬 **Messages** (`/messages`)
- 🎥 **Sessions** (`/sessions`)
- 🎓 **Mes cours (Enseignant)** (`/teacher/courses`)

### Actives (Fonctionnelles)
- ✅ Tableau de bord
- ✅ Mon profil
- ✅ Bibliothèque
- ✅ Fiches
- ✅ Quiz
- ✅ Assistant IA

---

## 🔧 Pour Réactiver une Fonctionnalité

### 1. Dans le Menu (Sidebar)

**Fichier :** `src/components/layout/Sidebar.tsx`

**Déplacer de `comingSoonItems` vers `navItems` :**

```typescript
// Exemple pour Groupes
const navItems = [
  { to: '/dashboard', icon: Home, label: 'Tableau de bord' },
  { to: '/profile', icon: UserCircle, label: 'Mon profil' },
  { to: '/library', icon: FileText, label: 'Bibliothèque' },
  { to: '/cards', icon: BookOpen, label: 'Fiches' },
  { to: '/quizzes', icon: ClipboardList, label: 'Quiz' },
  { to: '/ai-assistant', icon: Sparkles, label: 'Assistant IA' },
  { to: '/groups', icon: Users, label: 'Groupes' }, // ← Ajouté ici
];

// Retirer de comingSoonItems
const comingSoonItems = [
  { to: '/feed', icon: Rss, label: 'Fil d\'actualité' },
  { to: '/discover', icon: Compass, label: 'Découvrir' },
  // { to: '/groups', icon: Users, label: 'Groupes' }, // ← Retiré d'ici
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/sessions', icon: Video, label: 'Sessions' },
];
```

### 2. Dans le Menu "Créer" (Header)

**Fichier :** `src/components/layout/Header.tsx`

**Décommenter les options :**

```typescript
const createOptions = [
  { icon: Upload, label: 'Importer un document', action: () => navigate('/library?upload=true') },
  { icon: LinkIcon, label: 'Importer une URL', action: () => navigate('/library?import=true') },
  { icon: BookOpen, label: 'Nouvelle fiche', action: () => navigate('/cards/new') },
  { icon: ClipboardList, label: 'Nouveau quiz', action: () => navigate('/quizzes/new') },
  { icon: Users, label: 'Nouveau groupe', action: () => navigate('/groups/new') }, // ← Décommenter
  { icon: Video, label: 'Nouvelle session', action: () => navigate('/sessions/new') }, // ← Décommenter
];
```

---

## 📊 Détails par Fonctionnalité

### 👥 Groupes

**Tables Supabase :**
- `groups` : Informations des groupes
- `group_members` : Membres des groupes
- `group_messages` : Messages dans les groupes

**Politiques RLS :**
✅ Déjà créées et fonctionnelles

**Statut :** Prêt à réactiver (RLS OK)

---

### 💬 Messages

**Tables Supabase :**
- `messages` : Messages privés entre utilisateurs
- `conversations` : Fils de conversation

**Statut :** Nécessite vérification RLS

---

### 📰 Fil d'actualité

**Tables Supabase :**
- `posts` : Publications
- `post_likes` : Likes
- `post_comments` : Commentaires

**Statut :** Nécessite implémentation complète

---

### 🧭 Découvrir

**Description :** Page de découverte de contenu public

**Statut :** Nécessite implémentation complète

---

### 🎥 Sessions

**Voir :** `REACTIVATION_SESSIONS.md` pour le guide complet

**Statut :** Prêt à réactiver (migration SQL créée)

---

### 🎓 Mes cours (Enseignant)

**Tables Supabase :**
- `courses` : Cours créés par les enseignants
- `course_materials` : Matériaux pédagogiques

**Statut :** Nécessite vérification

---

## ✅ Checklist de Réactivation

Pour chaque fonctionnalité :

1. **[ ] Vérifier les tables Supabase**
   - Les tables existent ?
   - RLS activé ?
   - Politiques créées ?

2. **[ ] Exécuter les migrations SQL nécessaires**
   ```bash
   supabase db push
   ```

3. **[ ] Modifier `Sidebar.tsx`**
   - Déplacer de `comingSoonItems` vers `navItems`

4. **[ ] Modifier `Header.tsx`** (si applicable)
   - Décommenter l'option dans `createOptions`

5. **[ ] Vérifier les clés API** (si applicable)
   - Daily.co pour Sessions
   - Autres APIs externes

6. **[ ] Tester la fonctionnalité**
   - Navigation
   - Création
   - Lecture
   - Mise à jour
   - Suppression

---

## 🚀 Réactivation Rapide d'une Fonctionnalité

```bash
# 1. Vérifier la base de données
# Aller dans Supabase Dashboard → SQL Editor

# 2. Modifier le code frontend
# Éditer Sidebar.tsx et Header.tsx

# 3. Relancer l'application
npm run dev

# 4. Tester
```

---

**Dernière mise à jour :** 05/01/2026  
**Raison de la mise en veille :** Concentration sur les fonctionnalités principales
