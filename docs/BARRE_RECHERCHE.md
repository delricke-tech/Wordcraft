# 🔍 Barre de Recherche Interactive - Documentation

## ✅ Fonctionnalités Implémentées

### 1. Design Moderne

**Apparence** :
- 🔍 Icône de loupe à gauche (grise)
- ❌ Bouton d'effacement à droite (apparaît seulement si du texte est saisi)
- 🎨 Bordure arrondie (`rounded-xl`)
- 💫 Animation focus avec anneau teal
- 📏 Padding confortable (`py-2.5`)

**Position** :
- Située juste au-dessus de la grille/liste des documents
- Prend toute la largeur disponible (`flex-1`)
- Alignée avec les filtres de type de fichiers

---

### 2. Logique de Filtrage

**État** :
```typescript
const [searchQuery, setSearchQuery] = useState('');
```

**Filtrage en temps réel** :
- ⚡ **Instantané** : Dès qu'une lettre est tapée, la liste se met à jour
- 📁 **Dossiers** : Filtrés par nom
- 📄 **Documents** : Filtrés par nom

**Code de filtrage** :
```typescript
// Filtrer les documents
const filteredDocuments = documents.filter((doc) => {
  const matchesSearch = doc.name 
    ? doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    : true;
  // ... autres filtres
  return matchesSearch && matchesFilter && matchesFolder;
});

// Filtrer les dossiers
const filteredFolders = folders.filter((folder) => {
  const matchesSearch = folder.name
    ? folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    : true;
  return matchesSearch;
});
```

---

### 3. Sensibilité à la Casse

**Fonctionnement** :
- ✅ **Insensible à la casse** : `toLowerCase()` appliqué sur les deux côtés
- ✅ **Supporte les accents** : Recherche sur le nom original stocké en BDD

**Exemples** :
| Recherche | Document | Résultat |
|-----------|----------|----------|
| `bio` | `Biologie.pdf` | ✅ Trouvé |
| `BIO` | `biologie.pdf` | ✅ Trouvé |
| `général` | `Virologie Général.pdf` | ✅ Trouvé |
| `general` | `Virologie Général.pdf` | ❌ Non trouvé* |

*Note : La recherche avec/sans accents dépend de la correspondance exacte. Pour ignorer les accents, il faudrait normaliser les chaînes.

---

### 4. États Vides

**Deux messages différents** :

#### A. Bibliothèque vide (sans recherche)
```
📄 Icône FileText
"Aucun document ou dossier"
"Commencez par créer un dossier ou uploader un fichier"
```

#### B. Recherche sans résultat
```
🔍 Icône Search
"Aucun résultat trouvé"
"Aucun document ou dossier ne correspond à 'votre_recherche'"
[Bouton] Effacer la recherche
```

---

## 🎨 Interface Utilisateur

### Barre de Recherche

**Placeholder** :
```
Rechercher un document ou un dossier...
```

**États visuels** :
1. **Vide** : Bordure grise, icône grise
2. **Focus** : Anneau teal (`ring-2 ring-teal-500`)
3. **Avec texte** : Bouton ❌ apparaît à droite

### Bouton d'Effacement

**Apparence** :
- Icône `X` petite (18px)
- Gris clair au repos
- Gris foncé au survol
- **Visible uniquement** si `searchQuery` n'est pas vide

**Action** :
```typescript
onClick={() => setSearchQuery('')}
```

---

## 🔧 Utilisation

### Recherche Basique

1. **Tapez** dans la barre de recherche
2. **La liste filtre automatiquement** pendant que vous tapez
3. **Résultats** :
   - Les dossiers correspondants s'affichent en haut
   - Les documents correspondants s'affichent en dessous
   - Les éléments non correspondants disparaissent

### Effacer la Recherche

**Méthode 1** : Cliquez sur le bouton ❌ à droite de la barre

**Méthode 2** : Supprimez tout le texte manuellement

**Méthode 3** : Si aucun résultat, cliquez sur "Effacer la recherche"

---

## 🧪 Tests

### Test 1 : Recherche Simple
1. Tapez "test" dans la barre
2. ✅ Seuls les dossiers/documents contenant "test" s'affichent
3. ✅ La recherche est instantanée (pas de délai)

### Test 2 : Insensibilité Casse
1. Créez un document "MonDocument.pdf"
2. Tapez "mondocument"
3. ✅ Le document est trouvé
4. Tapez "MONDOCUMENT"
5. ✅ Le document est trouvé

### Test 3 : Accents
1. Créez un document "Étude Générale.pdf"
2. Tapez "Étude"
3. ✅ Le document est trouvé
4. Tapez "Générale"
5. ✅ Le document est trouvé

### Test 4 : Recherche Partielle
1. Créez un document "Introduction à la Biologie.pdf"
2. Tapez "intro"
3. ✅ Le document est trouvé
4. Tapez "biologie"
5. ✅ Le document est trouvé

### Test 5 : Aucun Résultat
1. Tapez "zzzzzzzzz"
2. ✅ Message "Aucun résultat trouvé" s'affiche
3. ✅ Le bouton "Effacer la recherche" est visible
4. Cliquez sur ce bouton
5. ✅ La recherche est effacée et tous les documents réapparaissent

### Test 6 : Bouton d'Effacement
1. Tapez quelque chose
2. ✅ Le bouton ❌ apparaît à droite
3. Cliquez dessus
4. ✅ La barre se vide
5. ✅ Tous les documents réapparaissent

### Test 7 : Recherche dans un Dossier
1. Ouvrez un dossier
2. Tapez une recherche
3. ✅ Seuls les documents du dossier correspondant à la recherche s'affichent
4. ✅ Le fil d'ariane reste visible

---

## 📊 Comportement Combiné

### Recherche + Dossier
- Si vous êtes dans un dossier, la recherche filtre **uniquement les documents de ce dossier**
- Les dossiers ne sont **pas affichés** quand vous êtes dans un dossier

### Recherche + Filtre de Type
- La recherche s'applique **en plus** du filtre de type (PDF, DOCX, etc.)
- Exemple : Filtre "PDF" + Recherche "test" → Seuls les PDF contenant "test"

---

## 🎯 Comportement Attendu

| Contexte | Recherche | Résultat |
|----------|-----------|----------|
| Racine | "bio" | Tous les dossiers/docs contenant "bio" |
| Dans dossier | "bio" | Docs du dossier contenant "bio" |
| Racine | "" (vide) | Tous les dossiers + docs sans dossier |
| Recherche | "xyz" (0 résultat) | Message "Aucun résultat trouvé" |

---

## 💡 Améliorations Futures

### Normalisation des Accents
Pour rechercher "general" et trouver "Général" :
```typescript
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const matchesSearch = normalizeString(doc.name).includes(normalizeString(searchQuery));
```

### Recherche Avancée
- Recherche par type : `type:pdf biologie`
- Recherche par date : `date:2024-12`
- Recherche par dossier : `folder:"Cours"`

### Historique de Recherche
- Sauvegarder les dernières recherches
- Suggestions pendant la saisie

### Recherche Floue
- Tolérance aux fautes de frappe
- Algorithmes comme Levenshtein distance

---

## ✅ Checklist de Vérification

- [x] Barre de recherche visible en haut de la bibliothèque
- [x] Icône de loupe à gauche
- [x] Placeholder explicite
- [x] Filtrage en temps réel (onChange)
- [x] Insensible à la casse (toLowerCase)
- [x] Recherche sur le nom original avec accents
- [x] Bouton d'effacement (X) qui apparaît/disparaît
- [x] Message distinct pour "aucun résultat"
- [x] Bouton "Effacer la recherche" dans l'état vide
- [x] Fonctionne avec les dossiers ET les documents
- [x] Compatible avec les filtres existants

---

**Date de création** : 28 décembre 2024  
**Statut** : ✅ Complètement fonctionnel

