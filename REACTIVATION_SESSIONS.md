# 🎥 Guide de Réactivation des Sessions

## 📋 Statut Actuel

✅ **Sessions désactivées temporairement** (05/01/2026)
- Interface mise de côté dans la section "À venir"
- Code fonctionnel toujours présent
- Migration RLS prête à être exécutée

---

## 🔧 Pour Réactiver les Sessions

### Étape 1: Exécuter la Migration SQL

1. Allez dans **Supabase Dashboard** → SQL Editor
2. Exécutez le fichier : `supabase/migrations/20260105000000_add_session_participants_policies.sql`

Ou en ligne de commande :
```bash
supabase db push
```

### Étape 2: Réactiver dans le Menu

Éditez `src/components/layout/Sidebar.tsx` :

**Déplacer de `comingSoonItems` vers `navItems` :**
```typescript
// Dans navItems (ligne ~35)
{ to: '/sessions', icon: Video, label: 'Sessions' },
```

**Retirer de `comingSoonItems` :**
```typescript
// Supprimer cette ligne de comingSoonItems (ligne ~43)
// { to: '/sessions', icon: Video, label: 'Sessions' },
```

### Étape 3: Réactiver le Menu "Créer"

Éditez `src/components/layout/Header.tsx` :

**Décommenter :**
```typescript
// Ligne ~54
{ icon: Video, label: 'Nouvelle session', action: () => navigate('/sessions/new') },
```

### Étape 4: Vérifier la Clé API Daily.co

Dans `.env` :
```bash
VITE_DAILY_API_KEY=votre_cle_daily_co
```

Obtenir une clé : https://dashboard.daily.co/developers

---

## 🐛 Corrections Déjà Effectuées

✅ Colonne `host_id` corrigée dans `Sessions.tsx`
✅ Politiques RLS créées pour `session_participants`
✅ Code backend fonctionnel

---

## 📝 Notes Techniques

### Tables Supabase
- `study_sessions` : Sessions d'étude (avec `host_id`)
- `session_participants` : Participants aux sessions

### Fonctionnalités Disponibles
- Création de sessions vidéo
- Gestion des participants
- Intégration Daily.co pour la vidéo
- Partage de sessions

---

**Date de mise en veille :** 05/01/2026  
**Raison :** Concentration sur fonctionnalités principales (Bibliothèque, Fiches, Quiz, IA)
