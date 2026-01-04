# 🤖 GUIDE ASSISTANT IA - MULTI-DOCUMENTS

## ✅ NOUVELLE FONCTIONNALITÉ MAJEURE !

Votre Assistant IA peut maintenant **analyser jusqu'à 20 cours simultanément** et répondre à vos questions en se basant sur TOUS les documents importés !

---

## 🎯 CAPACITÉS DE L'ASSISTANT IA

### 📚 Import Multiple
- ✅ **Jusqu'à 20 documents** à la fois
- ✅ **Formats supportés** : PDF, DOCX, TXT, Images (OCR)
- ✅ **Extraction automatique** du contenu de chaque document
- ✅ **Affichage en temps réel** de la progression

### 🧠 Analyse Intelligente
L'IA peut :
- 📖 **Résumer tous les cours** ou un cours spécifique
- 🔍 **Identifier les concepts clés** à travers tous les documents
- 📊 **Comparer différents cours** (points communs, différences)
- ❓ **Répondre à des questions précises** en citant ses sources
- 📝 **Créer des quiz** basés sur les cours importés
- 🎯 **Générer des fiches de révision** synthétiques

---

## 🚀 COMMENT UTILISER

### 1️⃣ Importer vos cours

1. Allez dans **Assistant IA** (menu de gauche)
2. Cliquez sur **"Importer des cours"** dans le panneau de gauche
3. Sélectionnez **jusqu'à 20 fichiers** (PDF, DOCX, TXT, images)
4. Attendez l'extraction (quelques secondes par document)
5. ✅ Les documents apparaissent dans la liste

### 2️⃣ Interroger l'IA

Une fois les documents importés, posez vos questions :

**Exemples de questions :**

#### 📖 Résumés
```
"Résume-moi tous les cours importés"
"Fais-moi un résumé du cours d'anatomie.pdf"
"Quels sont les points principaux abordés ?"
```

#### 🔍 Recherche de concepts
```
"Quels sont les concepts clés dans ces cours ?"
"Explique-moi le concept de photosynthèse"
"Où est mentionné la théorie de la relativité ?"
```

#### 📊 Comparaison
```
"Compare les cours de biologie et de chimie"
"Quelles sont les différences entre ces deux approches ?"
"Quels documents parlent de la même chose ?"
```

#### 📝 Création de contenu
```
"Crée-moi un quiz de 10 questions sur tous ces cours"
"Génère des flashcards pour réviser"
"Fais-moi une fiche de révision synthétique"
```

#### ❓ Questions précises
```
"Quelle est la formule de l'équation de Schrödinger ?"
"Dans quel document est mentionné la bataille de Waterloo ?"
"Explique-moi comment fonctionne la mitochondrie"
```

### 3️⃣ Gérer vos documents

- **Voir les documents** : Panneau de gauche affiche tous les fichiers importés
- **Supprimer un document** : Survolez et cliquez sur la croix ❌
- **Voir les détails** : Taille du fichier + nombre de caractères extraits

---

## 🎨 INTERFACE

### Panneau de gauche - Documents
```
┌─────────────────────────────────┐
│ Documents de cours              │
│ 3/20 documents importés         │
│                                 │
│ [📤 Importer des cours]         │
│                                 │
│ 📄 anatomie.pdf                 │
│    2.4 MB • 15,234 caractères  │
│                                 │
│ 📄 biologie.docx                │
│    856 KB • 8,941 caractères   │
│                                 │
│ 📄 chimie.txt                   │
│    124 KB • 3,522 caractères   │
└─────────────────────────────────┘
```

### Panneau central - Chat
```
┌─────────────────────────────────┐
│ 🤖 Assistant WordCraft          │
│                                 │
│ Vous: Résume tous les cours    │
│                                 │
│ IA: Voici un résumé...          │
│     - anatomie.pdf aborde...    │
│     - biologie.docx explique... │
│     - chimie.txt détaille...    │
│                                 │
│ [Tapez votre question...]  [→]  │
└─────────────────────────────────┘
```

---

## 📊 EXEMPLES D'UTILISATION

### Scénario 1 : Révision avant examen
1. Importez tous vos cours du semestre (max 20)
2. Demandez : *"Résume-moi tous les cours et identifie les concepts clés"*
3. Demandez : *"Crée un quiz de 30 questions pour tester mes connaissances"*
4. Demandez : *"Génère des flashcards pour les formules importantes"*

### Scénario 2 : Recherche spécifique
1. Importez plusieurs documents sur un sujet
2. Demandez : *"Dans quel document est expliqué le cycle de Krebs ?"*
3. Demandez : *"Compare les différentes définitions de ce concept"*

### Scénario 3 : Préparation d'exposé
1. Importez vos sources documentaires
2. Demandez : *"Fais-moi un plan structuré basé sur ces documents"*
3. Demandez : *"Quelles sont les citations importantes à utiliser ?"*

---

## ⚙️ CONFIGURATION REQUISE

### Clé API OpenAI
Pour utiliser l'Assistant IA, vous devez avoir configuré votre clé OpenAI dans `.env` :

```bash
VITE_OPENAI_API_KEY=sk-proj-...votre_clé...
```

### Packages installés ✅
Tous les packages nécessaires sont déjà installés :
- ✅ `pdfjs-dist` - Extraction PDF
- ✅ `mammoth` - Extraction DOCX
- ✅ `tesseract.js` - OCR pour images

---

## 🎯 LIMITES ET BONNES PRATIQUES

### Limites
- ⚠️ **Maximum 20 documents** simultanément
- ⚠️ Chaque document est limité à **~100 000 caractères** pour l'extraction
- ⚠️ L'IA a une fenêtre de contexte limitée (optimisée avec GPT-4o-mini)

### Bonnes pratiques
- ✅ Importez des documents **pertinents** pour votre question
- ✅ Posez des questions **précises** plutôt que trop générales
- ✅ Si trop de documents, **supprimez les moins pertinents**
- ✅ Utilisez les **noms de fichiers** pour référencer un document spécifique

---

## 🆘 DÉPANNAGE

### L'extraction est lente
**Normal !** L'extraction de PDF et images (OCR) peut prendre plusieurs secondes par document. Soyez patient.

### L'IA ne répond pas
1. Vérifiez que `VITE_OPENAI_API_KEY` est dans votre `.env`
2. Vérifiez que vous avez des crédits OpenAI
3. Ouvrez la console du navigateur (F12) pour voir les erreurs

### "Erreur extraction"
- Certains PDF protégés ne peuvent pas être extraits
- Les images floues donnent un OCR de mauvaise qualité
- Essayez de convertir le document en TXT ou PDF non-protégé

### L'IA dit "je n'ai pas accès aux documents"
- Vérifiez que les documents sont bien dans la liste de gauche
- Essayez de réimporter les documents
- Rafraîchissez la page

---

## 🚀 ÉVOLUTIONS FUTURES

Fonctionnalités prévues :
- 🔄 **Sauvegarder les sessions** de documents
- 🔗 **Import depuis la bibliothèque** directement
- 📊 **Statistiques d'analyse** des documents
- 🎨 **Export des réponses** en PDF/Markdown
- 🌐 **Recherche web** intégrée pour compléter les cours

---

## 📝 RÉCAPITULATIF

| Fonctionnalité | État |
|----------------|------|
| Import multiple (20 max) | ✅ Actif |
| PDF, DOCX, TXT | ✅ Supporté |
| Images (OCR) | ✅ Supporté |
| Analyse intelligente | ✅ Actif |
| Questions/réponses | ✅ Actif |
| Création de quiz | ✅ Actif |
| Résumés automatiques | ✅ Actif |
| Comparaison de documents | ✅ Actif |

---

## 🎓 ASTUCE PRO

**Pour une expérience optimale :**

1. Importez vos cours **par thématique** (ex: tous les cours de biologie)
2. Commencez par demander un **résumé global**
3. Puis posez des **questions spécifiques**
4. Utilisez les réponses pour **créer du contenu** (quiz, fiches)
5. **Supprimez les documents** non pertinents pour libérer de l'espace

---

**L'Assistant IA est maintenant votre SUPER professeur personnel qui connaît TOUS vos cours par cœur !** 🧠✨
