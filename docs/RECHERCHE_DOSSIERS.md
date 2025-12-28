# 🔍 Recherche dans les Dossiers - Documentation

## ✅ Fonctionnalité Implémentée

La recherche fonctionne maintenant **contextuellement** selon que vous êtes à la racine ou dans un dossier spécifique.

---

## 🎯 Comportement

### À la Racine (Vue Générale)

**Placeholder** :
```
🔍 Rechercher un document ou un dossier...
```

**Résultats** :
- ✅ Affiche **tous les dossiers** correspondants
- ✅ Affiche **tous les documents** (de tous les dossiers) correspondants

**Exemple** :
- Recherche : "bio"
- Résultats :
  - 📁 Dossier "Biologie"
  - 📁 Dossier "Microbiologie"
  - 📄 Document "Introduction à la bio.pdf" (du dossier "Cours")
  - 📄 Document "Bio avancée.pdf" (sans dossier)

---

### Dans un Dossier Spécifique

**Placeholder** :
```
🔍 Rechercher dans "Biologie"...
```

**Résultats** :
- ✅ Affiche **uniquement les documents de ce dossier** correspondants
- ❌ N'affiche **pas les autres dossiers**
- ❌ N'affiche **pas les documents des autres dossiers**

**Badge Contextuel** :
Quand vous tapez dans un dossier, un badge apparaît :
```
📁 Recherche dans : Biologie • 3 résultat(s)
```

**Exemple** :
- Dossier ouvert : "Biologie"
- Recherche : "intro"
- Résultats :
  - ✅ Document "Introduction.pdf" (de "Biologie")
  - ❌ Document "Introduction à la chimie.pdf" (d'un autre dossier)

---

## 🎨 Expérience Utilisateur

### 1. Placeholder Dynamique

Le placeholder change selon le contexte :

| Contexte | Placeholder |
|----------|-------------|
| Racine | "Rechercher un document ou un dossier..." |
| Dossier "Cours" | "Rechercher dans 'Cours'..." |
| Dossier "Examens" | "Rechercher dans 'Examens'..." |

### 2. Badge Contextuel

Visible **uniquement quand** :
- ✅ Vous êtes dans un dossier
- ✅ Vous avez tapé quelque chose dans la recherche

Affiche :
- 📁 Icône de dossier
- Nom du dossier actuel
- Nombre de résultats

### 3. Messages d'État Vide

**À la racine, sans recherche** :
```
📄 Aucun document ou dossier
   Commencez par créer un dossier ou uploader un fichier
```

**À la racine, avec recherche** :
```
🔍 Aucun résultat trouvé
   Aucun document ou dossier ne correspond à "votre_recherche"
   [Effacer la recherche]
```

**Dans un dossier, sans recherche** :
```
📄 Ce dossier est vide
   Uploadez un fichier pour commencer
```

**Dans un dossier, avec recherche** :
```
🔍 Aucun résultat trouvé
   Aucun document dans "Nom du Dossier" ne correspond à "votre_recherche"
   [Effacer la recherche]
```

---

## 🔧 Code Technique

### Logique de Filtrage

```typescript
const filteredDocuments = documents.filter((doc) => {
  // Filtre de recherche
  const matchesSearch = doc.name 
    ? doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    : true;
  
  // Filtre de type
  const matchesFilter = selectedFilter === 'all' || doc.file_type === selectedFilter;
  
  // ✅ Filtre de dossier (combiné avec la recherche)
  const matchesFolder = selectedFolder === null 
    ? doc.folder_id === null || doc.folder_id === undefined  // Racine : documents sans dossier
    : doc.folder_id === selectedFolder;  // Dossier : documents de ce dossier uniquement
  
  return matchesSearch && matchesFilter && matchesFolder;
});
```

**Explication** :
- Si `selectedFolder === null` → Cherche dans tous les documents à la racine
- Si `selectedFolder === 'xyz'` → Cherche **uniquement** dans les documents de ce dossier
- Les trois filtres (`matchesSearch`, `matchesFilter`, `matchesFolder`) sont **combinés** avec `&&`

---

## 🧪 Scénarios de Test

### Test 1 : Recherche à la Racine

**Setup** :
- Créez 2 dossiers : "Biologie" et "Chimie"
- Dans "Biologie" : Ajoutez "Cours Bio.pdf"
- Dans "Chimie" : Ajoutez "Cours Chimie.pdf"
- À la racine : Ajoutez "Notes.pdf"

**Action** :
1. Assurez-vous d'être à la racine
2. Tapez "Cours" dans la recherche

**Résultat attendu** :
- ✅ "Cours Bio.pdf" s'affiche
- ✅ "Cours Chimie.pdf" s'affiche
- ❌ "Notes.pdf" ne s'affiche pas
- ❌ Les dossiers ne s'affichent pas (pas "Cours" dans leur nom)

---

### Test 2 : Recherche dans un Dossier

**Setup** :
- Ouvrez le dossier "Biologie"
- Le dossier contient : "Intro Bio.pdf", "Cours Bio.pdf", "Examen.pdf"

**Action** :
1. Dans "Biologie", tapez "Bio" dans la recherche

**Résultat attendu** :
- ✅ Placeholder : "Rechercher dans 'Biologie'..."
- ✅ Badge : "📁 Recherche dans : Biologie • 2 résultat(s)"
- ✅ "Intro Bio.pdf" s'affiche
- ✅ "Cours Bio.pdf" s'affiche
- ❌ "Examen.pdf" ne s'affiche pas
- ❌ Documents des autres dossiers ne s'affichent pas

---

### Test 3 : Changement de Contexte

**Setup** :
- À la racine, tapez "test" dans la recherche
- 5 résultats s'affichent (différents dossiers)

**Action** :
1. Cliquez sur le dossier "Biologie" (sans effacer la recherche)

**Résultat attendu** :
- ✅ La recherche "test" reste dans la barre
- ✅ Placeholder change : "Rechercher dans 'Biologie'..."
- ✅ Badge apparaît : "📁 Recherche dans : Biologie • X résultat(s)"
- ✅ Seuls les documents de "Biologie" contenant "test" s'affichent

---

### Test 4 : Aucun Résultat dans un Dossier

**Setup** :
- Ouvrez un dossier "Biologie"
- Le dossier contient uniquement "Cours.pdf"

**Action** :
1. Tapez "zzzzz" dans la recherche

**Résultat attendu** :
- ✅ Message : "Aucun document dans 'Biologie' ne correspond à 'zzzzz'"
- ✅ Bouton "Effacer la recherche" visible
- ✅ Badge visible : "📁 Recherche dans : Biologie • 0 résultat(s)"

---

### Test 5 : Effacer et Changer de Dossier

**Setup** :
- Dans "Biologie", recherche active "test"

**Action** :
1. Cliquez sur "Tous les dossiers" (fil d'ariane)

**Résultat attendu** :
- ✅ La recherche "test" reste active
- ✅ Placeholder change : "Rechercher un document ou un dossier..."
- ✅ Badge disparaît
- ✅ Résultats de tous les dossiers s'affichent

---

## 📊 Tableau Comparatif

| Contexte | Placeholder | Badge | Cherche dans | Dossiers visibles |
|----------|-------------|-------|--------------|-------------------|
| Racine | "...document ou dossier" | ❌ Non | Tous les docs | ✅ Oui |
| Dossier "X" | "...dans 'X'" | ✅ Oui | Docs de X uniquement | ❌ Non |

---

## 💡 Cas d'Usage Réels

### Cas 1 : Recherche Large
**Besoin** : "Je cherche tous mes documents sur la biologie, peu importe où ils sont"

**Solution** :
1. Restez à la racine
2. Tapez "biologie"
3. ✅ Tous les documents contenant "biologie" s'affichent, de tous les dossiers

---

### Cas 2 : Recherche Ciblée
**Besoin** : "Je sais que mon document est dans 'Cours', je veux chercher dedans uniquement"

**Solution** :
1. Ouvrez le dossier "Cours"
2. Tapez votre recherche
3. ✅ Seuls les documents de "Cours" s'affichent
4. ✅ Plus rapide, moins de bruit

---

### Cas 3 : Navigation avec Recherche Active
**Besoin** : "Je veux voir où se trouve 'test' dans chaque dossier"

**Solution** :
1. À la racine, tapez "test"
2. Notez les résultats de tous les dossiers
3. Cliquez sur un dossier (recherche reste active)
4. ✅ Vous voyez uniquement les "test" de ce dossier
5. Cliquez sur "Tous les dossiers" pour revenir
6. ✅ La recherche est toujours là

---

## 🎯 Points Clés

1. **Recherche Contextuelle** : 
   - À la racine → Cherche partout
   - Dans un dossier → Cherche dans ce dossier uniquement

2. **Placeholder Dynamique** :
   - Change selon le contexte
   - Indique clairement où vous cherchez

3. **Badge Informatif** :
   - Apparaît uniquement dans un dossier avec recherche active
   - Montre le contexte et le nombre de résultats

4. **Messages Personnalisés** :
   - "Ce dossier est vide" vs "Aucun document ou dossier"
   - "...dans 'X' ne correspond..." vs "Aucun...ne correspond..."

5. **Persistance de la Recherche** :
   - La recherche reste active quand vous changez de dossier
   - Pratique pour comparer les résultats entre dossiers

---

## ✅ Checklist de Vérification

- [x] Recherche fonctionne à la racine
- [x] Recherche fonctionne dans un dossier
- [x] Placeholder change selon le contexte
- [x] Badge apparaît dans les dossiers avec recherche
- [x] Badge affiche le nom du dossier
- [x] Badge affiche le nombre de résultats
- [x] Messages d'état vide contextuels
- [x] Recherche persiste au changement de dossier
- [x] Bouton X efface la recherche
- [x] Filtrage combiné (recherche + dossier + type)

---

**Date de création** : 28 décembre 2024  
**Statut** : ✅ Entièrement fonctionnelle avec contexte intelligent

