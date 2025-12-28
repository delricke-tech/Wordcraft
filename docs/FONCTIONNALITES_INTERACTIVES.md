# 🎯 Fonctionnalités Interactives - Guide Complet

## ✅ Fonctionnalités Implémentées

### 1. Supprimer un Document 🗑️

**Fonctionnement** :
- Clic droit sur un document → Menu contextuel → "Supprimer"
- Une modale de confirmation s'ouvre
- À la validation :
  1. ✅ Le fichier est supprimé du **Storage Supabase**
  2. ✅ L'entrée est supprimée de la **base de données**
  3. ✅ Vérification de sécurité : `user_id` doit correspondre
  4. ✅ Toast de confirmation affiché

**Sécurité** :
```typescript
// Double vérification du propriétaire
if (doc.user_id !== user.id) {
  toast.error('Accès refusé');
  return;
}

// Requête avec clause de sécurité
await supabase
  .from('documents')
  .delete()
  .eq('id', documentId)
  .eq('user_id', user.id); // ✅ Impossible de supprimer le document d'un autre utilisateur
```

---

### 2. Supprimer un Dossier 🗑️

**Fonctionnement** :
- Clic droit sur un dossier → Menu contextuel → "Supprimer"
- Une modale de confirmation s'ouvre avec un avertissement
- À la validation :
  1. ✅ Le dossier est supprimé
  2. ✅ Les documents du dossier sont **déplacés à la racine** (grâce à `ON DELETE SET NULL`)
  3. ✅ Si on était dans le dossier, retour automatique à la racine
  4. ✅ Toast de confirmation affiché

**⚠️ Important** :
- Les documents ne sont **jamais supprimés** avec le dossier
- Ils sont automatiquement déplacés à la racine
- Un message dans la modale informe l'utilisateur

---

### 3. Renommer un Document ✏️

**Fonctionnement** :
- Clic droit sur un document → "Renommer"
- Une modale s'ouvre avec le nom actuel pré-rempli
- Saisir le nouveau nom
- À la validation :
  1. ✅ Seul le champ `name` en BDD est modifié
  2. ✅ Le `storage_path` reste **inchangé** (pas de renommage du fichier physique)
  3. ✅ Toast de confirmation avec ancien → nouveau nom

**💡 Règle Importante** :
```typescript
// ✅ BON : On modifie seulement le nom d'affichage
await supabase
  .from('documents')
  .update({ name: newName })  // Seul le nom change
  .eq('id', documentId);

// ❌ MAUVAIS : Ne jamais toucher au storage_path
// Le fichier reste avec son nom nettoyé dans Storage
```

---

### 4. Renommer un Dossier ✏️

**Fonctionnement** :
- Clic droit sur un dossier → "Renommer"
- Même processus que pour les documents
- Le nouveau nom est immédiatement visible pour tous les documents du dossier

---

### 5. Déplacer un Document 📁

**Fonctionnement** :
- Clic droit sur un document → "Déplacer"
- Une modale affiche la liste des dossiers disponibles
- Sélectionner le dossier de destination (ou "Aucun dossier" pour la racine)
- À la validation :
  1. ✅ Le champ `folder_id` du document est mis à jour
  2. ✅ Le document apparaît instantanément dans le nouveau dossier
  3. ✅ Toast de confirmation avec destination

**Options de destination** :
- ⚪ Aucun dossier (Racine) → `folder_id = null`
- 📁 Dossier spécifique → `folder_id = [id_du_dossier]`

---

## 🎨 Interface Utilisateur

### Menu Contextuel

**Pour les Documents** :
- 📥 Télécharger
- ✏️ Renommer
- 📁 Déplacer
- 🗑️ Supprimer (en rouge)

**Pour les Dossiers** :
- ✏️ Renommer
- 🗑️ Supprimer (en rouge)

**Activation** :
- Clic sur l'icône ⋮ (trois points) sur une carte
- Le menu apparaît à côté du curseur
- Clic ailleurs pour fermer

### Modales

**Modale de Suppression** :
- ❌ Icône rouge d'alerte
- Nom de l'élément affiché
- Avertissement pour les dossiers
- Boutons : "Annuler" / "Supprimer" (rouge)

**Modale de Renommage** :
- ✏️ Icône bleue
- Champ pré-rempli avec le nom actuel
- Astuce technique affichée
- Boutons : "Annuler" / "Renommer" (bleu)

**Modale de Déplacement** :
- 📁 Icône ambre
- Nom du document affiché
- Liste scrollable des dossiers
- Boutons : "Annuler" / "Déplacer" (ambre)

---

## 🔐 Sécurité Implémentée

### Vérifications Systématiques

**1. Authentification** :
```typescript
if (!user) {
  toast.error('Vous devez être connecté');
  return;
}
```

**2. Propriété** :
```typescript
if (doc.user_id !== user.id) {
  toast.error('Accès refusé');
  return;
}
```

**3. Double vérification SQL** :
```typescript
// Toutes les requêtes incluent user_id
.eq('user_id', user.id)
```

### Protection au Niveau RLS (Row Level Security)

Même si le frontend est contourné, Supabase RLS empêche :
- ❌ Supprimer le document d'un autre utilisateur
- ❌ Modifier le dossier d'un autre utilisateur
- ❌ Renommer les ressources d'autrui

---

## 🧪 Tests à Effectuer

### Test 1 : Supprimer un Document
1. Créez un document de test
2. Clic droit → Supprimer
3. Confirmez dans la modale
4. ✅ Le document disparaît
5. ✅ Toast "Document supprimé !"
6. ✅ Vérifiez dans Supabase Storage que le fichier est supprimé

### Test 2 : Supprimer un Dossier
1. Créez un dossier avec 2 documents
2. Clic droit sur le dossier → Supprimer
3. Lisez l'avertissement
4. Confirmez
5. ✅ Le dossier disparaît
6. ✅ Les 2 documents sont maintenant à la racine
7. ✅ Toast avec message explicite

### Test 3 : Renommer un Document
1. Clic droit sur un document → Renommer
2. Changez le nom : "Test.pdf" → "Nouveau Test.pdf"
3. Validez
4. ✅ Le nouveau nom s'affiche immédiatement
5. ✅ Toast "Test.pdf → Nouveau Test.pdf"
6. ✅ Le fichier dans Storage garde son nom technique (avec timestamp)

### Test 4 : Renommer un Dossier
1. Créez un dossier "Ancien Nom"
2. Clic droit → Renommer → "Nouveau Nom"
3. ✅ Le dossier affiche le nouveau nom
4. ✅ Ouvrez le dossier : le fil d'ariane affiche "Nouveau Nom"

### Test 5 : Déplacer un Document
1. Créez 2 dossiers : "Dossier A" et "Dossier B"
2. Uploadez un document dans "Dossier A"
3. Ouvrez "Dossier A", clic droit sur le document → Déplacer
4. Sélectionnez "Dossier B"
5. ✅ Le document disparaît de "Dossier A"
6. ✅ Le document apparaît dans "Dossier B"
7. ✅ Toast "Document déplacé → Dossier B"

### Test 6 : Déplacer vers la Racine
1. Depuis un dossier, clic droit sur un document → Déplacer
2. Sélectionnez "Aucun dossier (Racine)"
3. ✅ Le document est maintenant à la racine

### Test 7 : Sécurité (impossible à tester seul)
- Un utilisateur A ne peut pas supprimer/modifier les ressources de l'utilisateur B
- Même en manipulant le frontend, RLS bloque l'action

---

## 📊 Logs Console

Tous les logs sont préfixés avec des emojis pour faciliter le debug :

```
🗑️ Suppression du document: [id]
✅ Fichier supprimé du Storage
✅ Document supprimé de la BDD

✏️ Renommage du document: [id] → [nouveau_nom]
✅ Document renommé

📁 Déplacement du document: [id] → [dossier_id]
✅ Document déplacé

❌ Erreur lors de...
```

---

## 🎯 Récapitulatif

| Action | Documents | Dossiers | Sécurité | Toast |
|--------|-----------|----------|----------|-------|
| **Supprimer** | ✅ BDD + Storage | ✅ Déplace docs à racine | ✅ user_id | ✅ |
| **Renommer** | ✅ name uniquement | ✅ | ✅ user_id | ✅ |
| **Déplacer** | ✅ folder_id | ❌ | ✅ user_id | ✅ |
| **Télécharger** | ✅ | ❌ | ✅ | ❌ |

---

## 🚀 Améliorations Futures

- Drag & Drop pour déplacer les documents
- Sélection multiple pour actions groupées
- Restauration (corbeille temporaire)
- Historique des modifications
- Partage de dossiers entre utilisateurs

---

**Date de création** : 28 décembre 2024  
**Auteur** : Système de gestion de bibliothèque interactive

