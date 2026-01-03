# 🔴 FIX : Erreur 42702 - Référence de Colonne Ambiguë

## 🐛 NOUVEAU PROBLÈME DÉTECTÉ

```
Error Code: 42702
Message: "column reference is ambiguous"
Details: "It could refer to either a PL/pgSQL variable or a table column."
```

**Dans la console :**
```
❌ Error fetching data: {code: '42702', details: 'It could refer to either a PL/pgSQL variable...'}
```

---

## 🔍 CAUSE

Dans les fonctions RPC `get_user_suggestions` et `search_users`, certaines colonnes comme `institution` et `study_field` sont référencées de manière ambiguë :

### Problème dans le code original :

```sql
-- ❌ AMBIGU :
SELECT p.*, 
  (p.institution = (SELECT institution FROM profiles WHERE id = for_user_id))
  --                        ^^^^^^^^^^
  --                        Ambigu ! institution de quelle table ?
```

PostgreSQL ne sait pas si `institution` fait référence à :
- La colonne `profiles.institution`
- Une variable PL/pgSQL nommée `institution`

---

## ✅ SOLUTION IMMÉDIATE

### ÉTAPE 1 : Exécuter le Script de Correction

**Fichier créé :** `FIX_FONCTIONS_RPC_AMBIGUÏTE.sql`

**Actions :**

1. **OUVREZ** Supabase Dashboard
   ```
   https://supabase.com/dashboard
   ```

2. **SQL Editor** → Menu gauche 🔧

3. **OUVREZ** le fichier `FIX_FONCTIONS_RPC_AMBIGUÏTE.sql` dans VSCode

4. **COPIEZ TOUT** : `Ctrl+A` → `Ctrl+C`

5. **COLLEZ dans Supabase SQL Editor** : `Ctrl+V`

6. **EXÉCUTEZ** : Bouton **RUN** ▶️

7. **VÉRIFIEZ le message** :
   ```
   ✅✅✅ FONCTIONS CORRIGÉES AVEC SUCCÈS ! ✅✅✅
   ```

---

### ÉTAPE 2 : Actualiser l'Application

1. **Dans votre navigateur** (page `/discover`) :
   - Appuyez sur `F5`

2. **Vérifiez la console** :
   - ✅ Plus d'erreur 42702 !
   - ✅ Les suggestions s'affichent

---

## 🔧 CE QUI A ÉTÉ CORRIGÉ

### 1. Fonction `get_user_suggestions`

**Avant (ambigu) :**
```sql
SELECT 
  p.*,
  (p.institution = (SELECT institution FROM profiles WHERE id = for_user_id))
  --                        ^^^^^^^^^^^ AMBIGU !
```

**Après (corrigé) :**
```sql
DECLARE
  current_user_institution text;
  current_user_study_field text;
BEGIN
  -- Variables déclarées AVANT la requête
  SELECT p.institution, p.study_field 
  INTO current_user_institution, current_user_study_field
  FROM profiles p
  WHERE p.id = for_user_id;

  RETURN QUERY
  SELECT 
    p.id AS user_id,  -- Alias explicites
    p.full_name,
    p.avatar_url,
    p.study_field,
    p.institution,
    (p.institution = current_user_institution) AS common_institution,
    --                ^^^^^^^^^^^^^^^^^^^^^^^^ Variable claire !
```

### 2. Fonction `search_users`

**Ajouts :**
- Alias explicites : `AS user_id`, `AS connections_count`
- `COALESCE()` pour gérer les NULL
- Qualification complète : `p.id`, `p.full_name`, etc.

### 3. Fonction `get_community_feed` (Bonus)

Même traitement pour éviter les ambiguïtés futures.

---

## 📊 RÉSUMÉ DES CORRECTIONS

| Problème | Solution Appliquée |
|----------|-------------------|
| Références ambiguës | Variables `DECLARE` |
| Colonnes sans alias | `AS user_id`, `AS full_name` |
| NULL non gérés | `COALESCE(p.connections_count, 0)` |
| Tables non qualifiées | `p.id`, `c.user_id_1`, `cr.sender_id` |

---

## 🎯 VÉRIFICATION

### Checklist Après Exécution

- [ ] Script SQL exécuté sans erreur
- [ ] Message "FONCTIONS CORRIGÉES AVEC SUCCÈS"
- [ ] Page `/discover` actualisée (F5)
- [ ] **Aucune erreur 42702** dans la console
- [ ] Suggestions s'affichent correctement
- [ ] Onglet "Nouveaux" fonctionne
- [ ] Recherche fonctionne

---

## 🚨 SI L'ERREUR PERSISTE

### Test Manuel de la Fonction

**Dans Supabase SQL Editor :**

```sql
-- Tester get_user_suggestions
SELECT * FROM get_user_suggestions(
  'VOTRE_USER_ID'::uuid,
  10
);
```

**Résultat attendu :**
- Liste d'utilisateurs
- Colonnes : `user_id`, `full_name`, `connections_count`, `suggestion_score`, etc.

**Si erreur :**
- Copiez le message d'erreur complet
- Vérifiez que `FIX_COLONNES_PROFILES.sql` a bien été exécuté avant

---

## 📚 ORDRE D'EXÉCUTION DES SCRIPTS

Si vous recommencez depuis zéro :

1. ✅ `SCRIPT_COMMUNAUTE_SAFE.sql` (tables de base)
2. ✅ `FIX_COLONNES_PROFILES.sql` (ajouter colonnes)
3. ✅ `FIX_FONCTIONS_RPC_AMBIGUÏTE.sql` (corriger fonctions) ← **VOUS ÊTES ICI**

---

## 🎉 APRÈS LA CORRECTION

Votre page `/discover` devrait enfin :

✅ Se charger sans erreur  
✅ Afficher les suggestions intelligentes  
✅ Montrer les badges (même école, domaine)  
✅ Permettre la recherche en temps réel  
✅ Envoyer des demandes de connexion  
✅ **Plus aucune erreur dans la console !**  

---

## 💡 POURQUOI CETTE ERREUR S'EST PRODUITE

1. **Premier problème** : Colonnes manquantes (erreur 400)
   - ✅ Résolu avec `FIX_COLONNES_PROFILES.sql`

2. **Deuxième problème** : Références ambiguës (erreur 42702)
   - ✅ Résolu avec `FIX_FONCTIONS_RPC_AMBIGUÏTE.sql` ← **MAINTENANT**

C'est normal en développement de base de données ! On corrige étape par étape. 🚀

---

**Date :** 3 Janvier 2026  
**Statut :** 🔧 Correction en cours (Étape 2/2)  
**Priorité :** 🔴 URGENTE  

---

## 🎯 ACTION IMMÉDIATE

```
1. OUVRIR : FIX_FONCTIONS_RPC_AMBIGUÏTE.sql
2. COPIER : Ctrl+A, Ctrl+C
3. SUPABASE SQL EDITOR
4. COLLER : Ctrl+V
5. RUN ▶️
6. VOIR : "FONCTIONS CORRIGÉES AVEC SUCCÈS"
7. ACTUALISER : F5 sur /discover
8. VÉRIFIER : Console sans erreur !
```

**Dites-moi quand c'est fait ! 🎉**
