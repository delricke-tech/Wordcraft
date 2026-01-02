# ⚡ INSTALLATION EXPRESS - 5 MINUTES

**Pour ceux qui veulent aller vite !**

---

## 🎯 2 SCRIPTS À EXÉCUTER

### 1️⃣ Script Groupes (OBLIGATOIRE)

**Fichier :** `supabase/migrations/20260102_groups_functions.sql`

1. Ouvrir **Supabase Dashboard**
2. Cliquer **SQL Editor**
3. **Copier-Coller** TOUT le contenu du fichier
4. Cliquer **RUN** ▶️
5. Attendre "Success" ✅

**Ce script fait quoi ?**
- Compte automatiquement les membres des groupes
- Ajoute le créateur comme premier membre
- Active les triggers automatiques

---

### 2️⃣ Script Système Social (OBLIGATOIRE)

**Fichier :** `supabase/migrations/20260102_social_system.sql`

1. Dans **SQL Editor** (nouvelle requête)
2. **Copier-Coller** TOUT le contenu du fichier
3. Cliquer **RUN** ▶️
4. Attendre "Success" ✅

**Ce script fait quoi ?**
- Crée la table `posts` pour les publications
- Active les compteurs de likes et commentaires
- Configure les permissions (RLS)

---

## ✅ VÉRIFICATION RAPIDE

Copiez-collez ceci dans SQL Editor :

```sql
-- Vérifier que tout est installé
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM pg_tables WHERE tablename = 'posts')
    THEN '✅ Table posts créée'
    ELSE '❌ Exécutez le script 20260102_social_system.sql'
  END as posts,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE '%group%') >= 4
    THEN '✅ Triggers groupes OK'
    ELSE '❌ Exécutez le script 20260102_groups_functions.sql'
  END as triggers_groups,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE '%post%') >= 6
    THEN '✅ Triggers posts OK'
    ELSE '❌ Exécutez le script 20260102_social_system.sql'
  END as triggers_posts;
```

**Résultat attendu :** Tous les ✅

---

## 🚀 DÉMARRER L'APPLICATION

```bash
npm run dev
```

Puis testez :
- `/feed` - Créer un post
- `/groups` - Créer un groupe
- `/profile` - Voir votre profil

---

## ❌ EN CAS D'ERREUR

### Erreur : "trigger already exists"

**Solution :** Les scripts gèrent ça automatiquement avec `DROP TRIGGER IF EXISTS`. Relancez le script.

### Erreur : "table already exists"

**Solution :** Le script utilise `CREATE TABLE IF NOT EXISTS`. Pas de problème, continuez.

### Erreur : "permission denied"

**Solution :** Vous devez être admin du projet Supabase.

---

## 📋 CHECKLIST 1 MINUTE

- [ ] Script 1 exécuté (groupes)
- [ ] Script 2 exécuté (posts)
- [ ] Vérification SQL passée ✅
- [ ] `npm run dev` lancé
- [ ] Testé `/feed` → Publier un post

**Si les 5 cases sont cochées, c'est BON ! ✅**

---

**Temps total :** 5 minutes  
**Difficulté :** Facile (copier-coller)
