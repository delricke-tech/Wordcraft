# 🚨 ERREUR 500 PERSISTE - PLAN D'ACTION

## ⚡ ÉTAPE 1 : DIAGNOSTIC (2 minutes)

### Exécuter le diagnostic complet

1. **Aller sur Supabase SQL Editor**
   - https://supabase.com → Votre projet → SQL Editor

2. **Copier-coller ce fichier :**
   - `DIAGNOSTIC_COMPLET_GROUPES.sql`

3. **Cliquer sur Run**

4. **Lire attentivement les résultats** :
   - ✅ = OK
   - ⚠️ = Attention
   - ❌ = Problème à corriger

---

## 🔧 ÉTAPE 2 : CORRECTION (selon diagnostic)

### CAS A : Tables manquantes ou corrompues

**Si le diagnostic dit :**
```
❌ Table "groups" MANQUANTE !
OU
❌ Table "group_members" MANQUANTE !
```

**Solution :**
1. Exécuter `CREATE_TABLES_GROUPES_COMPLET.sql`
2. Attendre 5 secondes
3. Aller à l'étape 3 (Test)

---

### CAS B : Politiques RLS manquantes/incomplètes

**Si le diagnostic dit :**
```
• Table "groups" : 0 politiques RLS
OU
• Table "group_members" : 0 politiques RLS
```

**Solution :**
1. Exécuter `CREATE_TABLES_GROUPES_COMPLET.sql` (crée tout)
2. OU exécuter `FIX_RLS_GROUPS_SIMPLE.sql` (si tables OK)
3. Aller à l'étape 3 (Test)

---

### CAS C : Tout semble OK mais erreur 500 persiste

**Si le diagnostic dit :**
```
✅ Table "groups" existe
✅ Table "group_members" existe
✅ Politiques présentes
```

**Mais erreur 500 quand même...**

**Solutions possibles :**

#### Solution C1 : Problème d'authentification
```sql
-- Vérifier votre profil existe
SELECT * FROM profiles WHERE id = auth.uid();
```
- Si retourne vide → Vous n'êtes pas connecté
- Se déconnecter/reconnecter de l'application

#### Solution C2 : Vider complètement le cache
- `Ctrl+Shift+Delete` → Vider tout le cache
- Fermer/rouvrir le navigateur
- Retourner sur `/groups`

#### Solution C3 : Regarder l'erreur exacte
- Ouvrir Console (`F12`)
- Onglet "Network"
- Actualiser `/groups`
- Cliquer sur la requête rouge
- **Copier le message d'erreur complet**
- Me le transmettre pour analyse

---

## 🧪 ÉTAPE 3 : TEST (1 minute)

### Tester l'application

1. **Retour sur votre app**
2. **Aller sur `/groups`**
3. **Appuyer sur F5**
4. **Vérifier la console** (F12)

### ✅ Si ça marche :
- Plus d'erreur 500
- Page se charge
- Liste des groupes affichée (vide si aucun groupe)
- ✅ **PROBLÈME RÉSOLU !**

### ❌ Si ça ne marche toujours pas :
- Aller à l'étape 4 (Debug avancé)

---

## 🔬 ÉTAPE 4 : DEBUG AVANCÉ (si toujours rien)

### Test 1 : Vérifier qu'on peut lire les tables

```sql
-- Test lecture directe (copier-coller dans SQL Editor)
SELECT * FROM groups LIMIT 5;
SELECT * FROM group_members LIMIT 5;
```

**Si erreur :**
- Les tables sont corrompues
- Exécuter `CREATE_TABLES_GROUPES_COMPLET.sql`

**Si OK :**
- Les tables fonctionnent
- Problème vient de RLS ou frontend

---

### Test 2 : Désactiver temporairement RLS (DANGER !)

```sql
-- ⚠️ UNIQUEMENT POUR TEST ! NE PAS LAISSER EN PROD !
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
```

**Actualiser `/groups` :**
- ✅ Si ça marche → Problème RLS → Exécuter `FIX_RLS_GROUPS_SIMPLE.sql`
- ❌ Si ça ne marche pas → Problème frontend ou réseau

**RÉACTIVER RLS immédiatement après :**
```sql
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
```

---

### Test 3 : Vérifier la connexion à Supabase

```javascript
// Ouvrir Console dans le navigateur (F12)
// Copier-coller ce code :

const { data: testData, error: testError } = await supabase
  .from('profiles')
  .select('id, email')
  .limit(1);

console.log('Test Supabase:', { testData, testError });
```

**Si erreur réseau :**
- Problème de connexion à Supabase
- Vérifier les variables d'environnement (.env)
- Vérifier que l'URL Supabase est correcte

---

### Test 4 : Créer un groupe manuellement

```sql
-- Créer un groupe de test directement en SQL
INSERT INTO groups (name, description, owner_id, is_public)
VALUES (
  'Test Groupe',
  'Groupe créé pour tester',
  (SELECT id FROM profiles LIMIT 1),  -- Utilise le premier profil
  true
);

-- Vérifier qu'il apparaît
SELECT * FROM groups WHERE name = 'Test Groupe';
```

**Actualiser `/groups` :**
- ✅ Si le groupe apparaît → RLS fonctionne !
- ❌ Si le groupe n'apparaît pas → Problème frontend

---

## 📋 CHECKLIST COMPLÈTE

### Avant de continuer, vérifier que :

- [ ] J'ai exécuté `DIAGNOSTIC_COMPLET_GROUPES.sql`
- [ ] J'ai lu les résultats du diagnostic
- [ ] J'ai exécuté `CREATE_TABLES_GROUPES_COMPLET.sql` (si nécessaire)
- [ ] J'ai exécuté `FIX_RLS_GROUPS_SIMPLE.sql` (si nécessaire)
- [ ] J'ai vidé le cache du navigateur (`Ctrl+Shift+R`)
- [ ] Je suis bien connecté à l'application
- [ ] J'ai vérifié la console (`F12`) pour l'erreur exacte
- [ ] J'ai testé les requêtes SQL simples ci-dessus

---

## 🆘 SI RIEN NE FONCTIONNE

### Envoyez-moi ces informations :

1. **Résultat du diagnostic**
   - Copier le résultat de `DIAGNOSTIC_COMPLET_GROUPES.sql`

2. **Message d'erreur exact**
   - Console navigateur (F12) → Copier l'erreur rouge

3. **Résultat de ce test SQL**
   ```sql
   SELECT COUNT(*) as nb_groups FROM groups;
   SELECT COUNT(*) as nb_members FROM group_members;
   SELECT COUNT(*) as nb_profiles FROM profiles;
   SELECT COUNT(*) as nb_policies_groups FROM pg_policies WHERE tablename = 'groups';
   SELECT COUNT(*) as nb_policies_members FROM pg_policies WHERE tablename = 'group_members';
   ```

4. **Capture d'écran**
   - Page `/groups` avec console ouverte montrant l'erreur

---

## 📊 RÉSUMÉ DES FICHIERS

| Fichier | À Exécuter | Quand |
|---------|------------|-------|
| `DIAGNOSTIC_COMPLET_GROUPES.sql` | ✅ OUI | TOUJOURS (en premier) |
| `CREATE_TABLES_GROUPES_COMPLET.sql` | ✅ OUI | Si tables manquantes |
| `FIX_RLS_GROUPS_SIMPLE.sql` | ✅ OUI | Si RLS incorrectes |
| `PLAN_ACTION_ERREUR_500_ROUGE.md` | ❌ NON | Ce guide |

---

## ⏱️ Temps Estimé

- Diagnostic : 2 minutes
- Correction : 3-5 minutes
- Test : 1 minute
- Debug avancé : 5-10 minutes (si nécessaire)

**Total : 5-15 minutes maximum**

---

✨ **Courage ! On va trouver la source du problème !** ✨
