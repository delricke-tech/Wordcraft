# ✅ Suppression Multiple de Quiz Ajoutée

**Date** : 2 janvier 2025, 03h45  
**Statut** : ✅ **FONCTIONNALITÉ AJOUTÉE**

---

## ✨ Nouvelle Fonctionnalité

### Suppression Multiple de Quiz

**Comme pour les fiches**, vous pouvez maintenant sélectionner plusieurs quiz et les supprimer en une seule fois.

---

## 🔧 Modifications Techniques

### Fichier : `src/pages/Quizzes.tsx`

#### 1. États Ajoutés (Lignes 26-27)
```typescript
const [selectedQuizzes, setSelectedQuizzes] = useState<string[]>([]); // IDs sélectionnés
const [selectionMode, setSelectionMode] = useState(false); // Mode sélection activé
```

#### 2. Fonctions de Gestion (Lignes 54-79)

##### Suppression Simple avec Toast
```typescript
const handleDeleteQuiz = async (id: string) => {
  const { error } = await supabase.from('quizzes').delete().eq('id', id);
  if (!error) {
    setQuizzes(quizzes.filter((q) => q.id !== id));
    toast.success('Quiz supprimé !');
  }
};
```

##### Suppression Multiple
```typescript
const handleDeleteSelected = async () => {
  if (selectedQuizzes.length === 0) return;
  
  const confirmed = confirm(`Supprimer ${selectedQuizzes.length} quiz sélectionné(s) ?`);
  if (!confirmed) return;

  const { error } = await supabase
    .from('quizzes')
    .delete()
    .in('id', selectedQuizzes);

  if (!error) {
    setQuizzes(quizzes.filter((q) => !selectedQuizzes.includes(q.id)));
    setSelectedQuizzes([]);
    setSelectionMode(false);
    toast.success(`${selectedQuizzes.length} quiz supprimé(s) !`);
  } else {
    toast.error('Erreur lors de la suppression');
  }
};
```

##### Toggle Sélection
```typescript
const handleToggleQuiz = (id: string) => {
  if (selectedQuizzes.includes(id)) {
    setSelectedQuizzes(selectedQuizzes.filter(qId => qId !== id));
  } else {
    setSelectedQuizzes([...selectedQuizzes, id]);
  }
};
```

#### 3. Boutons Header (Lignes 118-165)

##### Mode Normal
```tsx
{quizzes.length > 0 && (
  <button onClick={() => setSelectionMode(true)}>
    <Trash2 size={18} />
    Sélectionner
  </button>
)}
<button onClick={() => setShowNewQuizModal(true)}>
  <Plus size={18} />
  Nouveau quiz
</button>
```

##### Mode Sélection
```tsx
<button onClick={() => {
  setSelectionMode(false);
  setSelectedQuizzes([]);
}}>
  <X size={18} />
  Annuler
</button>

{selectedQuizzes.length > 0 && (
  <>
    <span>{selectedQuizzes.length} sélectionné(s)</span>
    <button onClick={handleDeleteSelected}>
      <Trash2 size={18} />
      Supprimer ({selectedQuizzes.length})
    </button>
  </>
)}
```

#### 4. Checkboxes sur Cartes (Lignes 238-250)
```tsx
{selectionMode && (
  <div className="absolute top-3 left-3 z-10">
    <input
      type="checkbox"
      checked={selectedQuizzes.includes(quiz.id)}
      onChange={() => handleToggleQuiz(quiz.id)}
      className="w-5 h-5 text-teal-600 rounded border-gray-300"
    />
  </div>
)}
```

#### 5. Bordure Sélection (Ligne 235)
```tsx
<div className={`border-2 ${
  selectedQuizzes.includes(quiz.id) 
    ? 'border-teal-500'  // Sélectionné
    : 'border-gray-200'  // Normal
}`}>
```

#### 6. Boutons Cachés en Mode Sélection (Ligne 310)
```tsx
{!selectionMode && (
  <div className="flex items-center gap-1">
    <Link to={`/quizzes/${quiz.id}/take`}>
      <Play />
    </Link>
    <button onClick={() => handleDeleteQuiz(quiz.id)}>
      <Trash2 />
    </button>
  </div>
)}
```

#### 7. Import Toast (Ligne 20)
```typescript
import { toast } from 'sonner';
```

---

## 🎯 Workflow Utilisateur

### Suppression d'un Seul Quiz
```
1. Voir la liste des quiz
2. Cliquer sur l'icône 🗑️ (en bas de la carte)
3. Quiz supprimé
   ↓
✅ Toast : "Quiz supprimé !"
```

### Suppression Multiple
```
1. Cliquer "Sélectionner" (header)
   → Mode sélection activé
   → Checkboxes ☑️ apparaissent sur chaque carte

2. Cocher les quiz à supprimer
   → Bordure teal-500 sur sélectionnés
   → Compteur : "X sélectionné(s)"

3. Cliquer "Supprimer (X)"
   → Confirmation : "Supprimer X quiz sélectionné(s) ?"
   → Cliquer OK

4. Quiz supprimés
   → Mode sélection désactivé
   → Toast : "X quiz supprimé(s) !"
```

---

## 🎨 Aperçu Visuel

### Mode Normal
```
┌──────────────────────────────────────────┐
│  Quiz                                    │
│                                          │
│  [Sélectionner] [Nouveau quiz]          │
├──────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐         │
│  │ 📋 Quiz 1  │  │ 📋 Quiz 2  │         │
│  │ 10 Q       │  │ 15 Q       │         │
│  │            │  │            │         │
│  │ [▶️] [🗑️]  │  │ [▶️] [🗑️]  │         │
│  └────────────┘  └────────────┘         │
└──────────────────────────────────────────┘
```

### Mode Sélection
```
┌──────────────────────────────────────────┐
│  Quiz                                    │
│                                          │
│  [Annuler] [3 sélectionné(s)]           │
│  [Supprimer (3)]                         │
├──────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐         │
│  │☑️ Quiz 1    │  │☑️ Quiz 2    │         │
│  │ [TEAL]     │  │ [TEAL]     │  ← Bordure
│  │ 10 Q       │  │ 15 Q       │         │
│  └────────────┘  └────────────┘         │
│                                          │
│  ┌────────────┐                          │
│  │☐ Quiz 3    │                          │
│  │ [GRAY]     │  ← Pas sélectionné      │
│  │ 20 Q       │                          │
│  └────────────┘                          │
└──────────────────────────────────────────┘
```

---

## 📊 Comparaison Avant/Après

### AVANT
```
Supprimer 1 quiz     : ✅ Bouton 🗑️
Supprimer plusieurs  : ❌ Pas possible
                       → Cliquer 🗑️ plusieurs fois
```

### APRÈS
```
Supprimer 1 quiz     : ✅ Bouton 🗑️
Supprimer plusieurs  : ✅ Mode sélection
                       → Cocher → Supprimer en masse
```

---

## ✅ Checklist Complète

### États et Fonctions
- [x] État `selectedQuizzes` ajouté
- [x] État `selectionMode` ajouté
- [x] Fonction `handleDeleteSelected`
- [x] Fonction `handleToggleQuiz`
- [x] Import `toast` ajouté

### Interface
- [x] Bouton "Sélectionner" dans header
- [x] Bouton "Annuler" en mode sélection
- [x] Compteur "X sélectionné(s)"
- [x] Bouton "Supprimer (X)"
- [x] Checkboxes sur cartes
- [x] Bordure teal-500 sur sélection
- [x] Boutons Play/Supprimer cachés en mode sélection

### Fonctionnalité
- [x] Cliquer checkbox → Toggle sélection
- [x] Bordure change de couleur
- [x] Compteur se met à jour
- [x] Bouton Supprimer activé si sélection
- [x] Confirmation avant suppression
- [x] Suppression dans Supabase
- [x] Mise à jour de l'affichage
- [x] Toast de confirmation
- [x] Mode désactivé après suppression

---

## 🚫 Aucune Manipulation Supabase

**Correction uniquement côté frontend** :
- ❌ Pas de script SQL
- ❌ Pas de changement de BDD
- ✅ Utilise `.in()` pour suppression multiple

---

## 🧪 Tests de Validation

### Test 1 : Suppression Simple
```bash
1. Aller dans "Quiz"
2. Cliquer 🗑️ sur un quiz
   ↓
✅ Quiz supprimé
✅ Toast : "Quiz supprimé !"
✅ Liste mise à jour
```

### Test 2 : Mode Sélection
```bash
1. Cliquer "Sélectionner"
   ↓
✅ Checkboxes apparaissent
✅ Boutons Play/Supprimer cachés
✅ Mode sélection activé
```

### Test 3 : Sélection Multiple
```bash
1. Mode sélection activé
2. Cocher Quiz 1
3. Cocher Quiz 2
4. Cocher Quiz 3
   ↓
✅ Bordure teal-500 sur 3 cartes
✅ Compteur : "3 sélectionné(s)"
✅ Bouton : "Supprimer (3)"
```

### Test 4 : Suppression Multiple
```bash
1. Sélectionner 3 quiz
2. Cliquer "Supprimer (3)"
3. Confirmer
   ↓
✅ Confirmation : "Supprimer 3 quiz sélectionné(s) ?"
✅ 3 quiz supprimés de Supabase
✅ Toast : "3 quiz supprimé(s) !"
✅ Mode sélection désactivé
✅ Liste mise à jour
```

### Test 5 : Annulation
```bash
1. Mode sélection activé
2. Sélectionner 2 quiz
3. Cliquer "Annuler"
   ↓
✅ Mode sélection désactivé
✅ Sélections réinitialisées
✅ Checkboxes disparaissent
✅ Boutons Play/Supprimer réapparaissent
```

---

## 💡 Fonctionnalités Identiques

Cette implémentation est **identique** à celle des fiches :

### Fiches (`StudyCards.tsx`)
```typescript
const [selectedCards, setSelectedCards] = useState<string[]>([]);
const [selectionMode, setSelectionMode] = useState(false);

const handleDeleteSelected = async () => {
  await supabase.from('study_cards').delete().in('id', selectedCards);
};
```

### Quiz (`Quizzes.tsx`)
```typescript
const [selectedQuizzes, setSelectedQuizzes] = useState<string[]>([]);
const [selectionMode, setSelectionMode] = useState(false);

const handleDeleteSelected = async () => {
  await supabase.from('quizzes').delete().in('id', selectedQuizzes);
};
```

**Interface et UX parfaitement cohérentes** ✅

---

## 🎉 Résumé

### Fonctionnalité Ajoutée
```
✅ Bouton "Sélectionner" dans header
✅ Mode sélection avec checkboxes
✅ Sélection multiple de quiz
✅ Suppression en masse
✅ Toast notifications
✅ Confirmation avant suppression
✅ UX cohérente avec les fiches
```

### Fichier Modifié
- `src/pages/Quizzes.tsx` :
  - États ajoutés (2)
  - Fonctions ajoutées (3)
  - Import toast
  - Boutons header modifiés
  - Checkboxes sur cartes
  - Bordure conditionnelle
  - Boutons cachés en mode sélection

---

**Vous pouvez maintenant supprimer plusieurs quiz à la fois ! 🎉**

_Dernière modification : 2 janvier 2025, 03h45_
