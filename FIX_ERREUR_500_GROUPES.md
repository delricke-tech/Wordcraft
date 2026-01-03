# 🔴 CORRECTION URGENTE : Erreurs 500 sur le Volet Groupes

## 🐛 PROBLÈME DÉTECTÉ

```
❌ GET group_members - 500 (Internal Server Error)
```

Les **fonctions et triggers des groupes** ne sont **pas installés** dans Supabase !

---

## ✅ SOLUTION : Exécuter le Script Groupes

### 📄 Fichier à Exécuter

**`supabase/migrations/20260102_groups_functions.sql`**

---

## 🚀 ÉTAPES D'EXÉCUTION (2 MINUTES)

### 1. Ouvrir le Fichier

Dans VSCode :
- Allez dans le dossier `supabase/migrations/`
- Ouvrez `20260102_groups_functions.sql`

### 2. Copier le Contenu

- **CTRL+A** (tout sélectionner)
- **CTRL+C** (copier)

### 3. Aller dans Supabase

1. **Ouvrez** : https://supabase.com/dashboard
2. **Cliquez** : SQL Editor (menu gauche 🔧)

### 4. Coller et Exécuter

1. **CTRL+V** (coller le script)
2. **Cliquez RUN** ▶️ (bouton vert en haut)
3. **Attendez** le message de succès

---

## 📋 CE QUE CE SCRIPT FAIT

### Fonctions RPC Créées

✅ `increment_group_members()` - Augmenter compteur membres
✅ `decrement_group_members()` - Diminuer compteur membres

### Triggers Automatiques

✅ Quand un membre **rejoint** un groupe → compteur +1
✅ Quand un membre **quitte** un groupe → compteur -1
✅ Quand le statut d'un membre **change** → compteur mis à jour
✅ Quand un groupe est **créé** → propriétaire ajouté automatiquement comme membre

---

## ✅ RÉSULTAT ATTENDU

Après exécution, dans Supabase SQL Editor vous verrez :

```
Success. No rows returned
```

C'est **normal** ! Ça signifie que le script s'est exécuté sans erreur.

---

## 🔄 APRÈS L'EXÉCUTION

1. **Retournez dans votre navigateur**
2. **Actualisez la page** `/groups` (F5)
3. **Ouvrez la console** (F12) → onglet Console
4. **Résultat attendu :**
   - ✅ **Plus d'erreur 500 !**
   - ✅ **Page `/groups` fonctionne !**
   - ✅ **Liste des groupes s'affiche !**

---

## 🧪 TESTER LE VOLET GROUPES

Après correction, vous pourrez :

✅ **Voir la liste des groupes** (style Bitrix24)
✅ **Créer un nouveau groupe** (bouton "Nouveau groupe")
✅ **Rejoindre un groupe public** (onglet "Découvrir")
✅ **Chatter en temps réel** (clic sur un groupe)
✅ **Gérer les membres** (dans les paramètres du groupe)

---

## 🎯 RÉCAPITULATIF DES SCRIPTS À EXÉCUTER

Pour que **TOUTE l'application** fonctionne, exécutez dans cet ordre :

| Ordre | Script | Corrige | Statut |
|-------|--------|---------|--------|
| 1 | `FIX_COLONNES_PROFILES.sql` | Erreur 400 | ⏳ À faire |
| 2 | `FIX_FONCTIONS_RPC_AMBIGUÏTE.sql` | Erreur 42702 | ⏳ À faire |
| 3 | `supabase/migrations/20260102_groups_functions.sql` | Erreur 500 Groupes | ⏳ À faire |

**Total : 3 scripts à exécuter (5 minutes max)**

---

## 💡 ASTUCE

Si vous voulez **tout corriger d'un coup**, exécutez les 3 scripts **un par un** dans Supabase SQL Editor.

**Entre chaque script :**
- Cliquez sur **"New query"** (+ en haut)
- Collez le script suivant
- RUN ▶️

---

## 🚨 SI PROBLÈME

### "Erreur lors de l'exécution"

Copiez le message d'erreur complet et montrez-le-moi.

### "Toujours erreur 500"

Vérifiez que le script s'est bien exécuté :

```sql
-- Dans Supabase SQL Editor
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%group%';
```

Vous devriez voir :
- `increment_group_members`
- `decrement_group_members`
- `update_group_member_count_on_insert`
- `update_group_member_count_on_delete`
- `update_group_member_count_on_update`
- `add_owner_as_member`

---

**Date :** 3 Janvier 2026  
**Priorité :** 🔴 URGENTE  
**Temps :** 2 minutes
