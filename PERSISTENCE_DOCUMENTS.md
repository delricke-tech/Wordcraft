# 💾 Persistance des Documents - Assistant IA

**Date** : 5 janvier 2025  
**Statut** : ✅ **PROBLÈME RÉSOLU**

---

## 🎯 Problème Résolu

### Avant
❌ **Sur mobile, quand on rafraîchit la page après l'importation d'un fichier, le fichier disparaît**

- Les documents étaient stockés uniquement dans le state React
- Le state React est réinitialisé à chaque refresh
- Perte de tous les documents importés
- Perte de tous les messages du chat

### Après
✅ **Les documents et messages persistent même après un refresh**

- Sauvegarde automatique dans `localStorage`
- Restauration automatique au chargement
- Fonctionne sur mobile et desktop
- Bouton pour effacer tout si nécessaire

---

## ✅ Solution Implémentée

### 1. **Sauvegarde Automatique dans localStorage**

Chaque fois qu'un document est ajouté ou supprimé, il est automatiquement sauvegardé dans `localStorage` :

```typescript
// 💾 Sauvegarder les documents dans localStorage à chaque modification
useEffect(() => {
  if (uploadedDocuments.length > 0) {
    localStorage.setItem('aiAssistant_uploadedDocuments', JSON.stringify(uploadedDocuments));
    console.log('💾 Documents sauvegardés dans localStorage:', uploadedDocuments.length);
  }
}, [uploadedDocuments]);

// 💾 Sauvegarder les messages dans localStorage à chaque modification
useEffect(() => {
  if (messages.length > 0) {
    localStorage.setItem('aiAssistant_messages', JSON.stringify(messages));
    console.log('💾 Messages sauvegardés dans localStorage:', messages.length);
  }
}, [messages]);
```

---

### 2. **Restauration Automatique au Chargement**

Quand la page se charge (ou se rafraîchit), les documents et messages sont automatiquement restaurés :

```typescript
// 🔄 Restaurer les documents depuis localStorage au chargement
useEffect(() => {
  const savedDocuments = localStorage.getItem('aiAssistant_uploadedDocuments');
  const savedMessages = localStorage.getItem('aiAssistant_messages');
  
  if (savedDocuments) {
    try {
      const parsed = JSON.parse(savedDocuments);
      // Reconvertir les dates
      const documentsWithDates = parsed.map((doc: any) => ({
        ...doc,
        extractedAt: new Date(doc.extractedAt)
      }));
      setUploadedDocuments(documentsWithDates);
      console.log('✅ Documents restaurés depuis localStorage:', documentsWithDates.length);
    } catch (error) {
      console.error('❌ Erreur lors de la restauration des documents:', error);
    }
  }

  if (savedMessages) {
    try {
      const parsed = JSON.parse(savedMessages);
      // Reconvertir les dates
      const messagesWithDates = parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      setMessages(messagesWithDates);
      console.log('✅ Messages restaurés depuis localStorage:', messagesWithDates.length);
    } catch (error) {
      console.error('❌ Erreur lors de la restauration des messages:', error);
    }
  }
}, []);
```

---

### 3. **Nettoyage du localStorage lors de la Suppression**

Quand un document est supprimé, le `localStorage` est mis à jour :

```typescript
const removeDocument = (docId: string) => {
  const newDocuments = uploadedDocuments.filter(doc => doc.id !== docId);
  setUploadedDocuments(newDocuments);
  
  // Mettre à jour localStorage
  if (newDocuments.length === 0) {
    localStorage.removeItem('aiAssistant_uploadedDocuments');
  } else {
    localStorage.setItem('aiAssistant_uploadedDocuments', JSON.stringify(newDocuments));
  }
};
```

---

### 4. **Bouton "Tout Effacer"**

Un nouveau bouton permet d'effacer tous les documents et messages en un clic :

```typescript
// 🗑️ Effacer tout (documents + messages)
const clearAll = () => {
  if (confirm('Voulez-vous vraiment effacer tous les documents et messages ? Cette action est irréversible.')) {
    setUploadedDocuments([]);
    setMessages([]);
    setSelectedDocuments([]);
    localStorage.removeItem('aiAssistant_uploadedDocuments');
    localStorage.removeItem('aiAssistant_messages');
    console.log('🗑️ Tout a été effacé');
  }
};
```

---

## 📊 Données Sauvegardées

### 1. **Documents Importés**
Clé : `aiAssistant_uploadedDocuments`

Contenu :
```json
[
  {
    "id": "doc-1735245678901-0",
    "name": "Cours de Biologie.pdf",
    "type": "application/pdf",
    "size": 1234567,
    "content": "Texte extrait du document...",
    "extractedAt": "2025-01-05T12:34:56.789Z"
  }
]
```

### 2. **Messages du Chat**
Clé : `aiAssistant_messages`

Contenu :
```json
[
  {
    "id": "1735245678901",
    "role": "user",
    "content": "Résume-moi ce cours",
    "timestamp": "2025-01-05T12:34:56.789Z"
  },
  {
    "id": "1735245678902",
    "role": "assistant",
    "content": "Voici le résumé...",
    "timestamp": "2025-01-05T12:35:01.234Z"
  }
]
```

---

## 🔄 Cycle de Vie

### 1. **Import de Document**
```
Utilisateur importe un fichier
  ↓
Extraction du texte
  ↓
Ajout au state React (uploadedDocuments)
  ↓
useEffect détecte le changement
  ↓
💾 Sauvegarde automatique dans localStorage
```

### 2. **Refresh de la Page**
```
Page se charge
  ↓
useEffect de restauration s'exécute
  ↓
Lecture de localStorage
  ↓
Parsing JSON + reconversion des dates
  ↓
✅ Restauration dans le state React
  ↓
Documents et messages réapparaissent
```

### 3. **Suppression de Document**
```
Utilisateur supprime un document
  ↓
Mise à jour du state React
  ↓
Mise à jour de localStorage
  ↓
Si plus de documents : suppression de la clé localStorage
```

---

## 🧪 Tests

### Test 1 : Import + Refresh
1. ✅ Importer un document PDF
2. ✅ Vérifier qu'il apparaît dans la liste
3. ✅ Rafraîchir la page (F5)
4. ✅ Vérifier que le document est toujours là

### Test 2 : Messages + Refresh
1. ✅ Poser une question à l'IA
2. ✅ Recevoir une réponse
3. ✅ Rafraîchir la page
4. ✅ Vérifier que les messages sont toujours là

### Test 3 : Suppression
1. ✅ Importer plusieurs documents
2. ✅ Supprimer un document
3. ✅ Rafraîchir la page
4. ✅ Vérifier que seuls les documents non supprimés sont là

### Test 4 : Tout Effacer
1. ✅ Importer des documents
2. ✅ Cliquer sur "Tout effacer"
3. ✅ Confirmer
4. ✅ Vérifier que tout est effacé
5. ✅ Rafraîchir la page
6. ✅ Vérifier que rien ne revient

---

## 💡 Avantages

### 1. **Persistance**
- ✅ Les documents restent même après un refresh
- ✅ Les messages du chat restent
- ✅ Fonctionne hors ligne

### 2. **Performance**
- ✅ Pas besoin de ré-extraire le texte
- ✅ Chargement instantané
- ✅ Pas de requête serveur

### 3. **Expérience Utilisateur**
- ✅ Pas de perte de données
- ✅ Continuité de la session
- ✅ Fonctionne sur mobile

### 4. **Contrôle**
- ✅ Bouton pour tout effacer
- ✅ Suppression individuelle
- ✅ Logs dans la console

---

## ⚠️ Limitations

### 1. **Taille du localStorage**
- Limite : ~5-10 MB selon les navigateurs
- Solution : Ne pas importer trop de gros documents

### 2. **Pas de Synchronisation**
- Les données sont locales au navigateur
- Pas de sync entre appareils
- Effacé si on vide le cache du navigateur

### 3. **Sécurité**
- Les données sont en clair dans localStorage
- Accessible via JavaScript
- Ne pas stocker de données sensibles

---

## 🔧 Maintenance

### Vider le localStorage manuellement

Dans la console du navigateur :
```javascript
// Effacer uniquement les documents
localStorage.removeItem('aiAssistant_uploadedDocuments');

// Effacer uniquement les messages
localStorage.removeItem('aiAssistant_messages');

// Effacer tout le localStorage
localStorage.clear();
```

### Voir le contenu du localStorage

Dans la console du navigateur :
```javascript
// Voir les documents
console.log(JSON.parse(localStorage.getItem('aiAssistant_uploadedDocuments')));

// Voir les messages
console.log(JSON.parse(localStorage.getItem('aiAssistant_messages')));
```

---

## 📝 Notes Techniques

### Pourquoi reconvertir les dates ?

Les dates sont converties en string lors du `JSON.stringify()`. Il faut les reconvertir en objets `Date` :

```typescript
// Avant (string)
"extractedAt": "2025-01-05T12:34:56.789Z"

// Après (Date object)
extractedAt: new Date("2025-01-05T12:34:56.789Z")
```

### Pourquoi utiliser useEffect ?

`useEffect` permet de réagir aux changements du state et de sauvegarder automatiquement sans avoir à appeler manuellement une fonction de sauvegarde partout.

---

## ✅ Résultat Final

### Avant
- ❌ Refresh = perte de tous les documents
- ❌ Frustration utilisateur
- ❌ Besoin de ré-importer à chaque fois

### Après
- ✅ Refresh = documents toujours là
- ✅ Messages du chat persistants
- ✅ Expérience utilisateur fluide
- ✅ Bouton pour tout effacer si nécessaire

---

**Date de finalisation** : 5 janvier 2025  
**Fichier modifié** : `src/pages/AIAssistant.tsx`  
**Statut** : ✅ **PROBLÈME RÉSOLU**

🎉 **Les documents persistent maintenant même après un refresh !**
