# 🔧 CORRECTION : Erreur CORS - Appels directs à OpenAI

## ❌ Problème identifié

Lors de l'utilisation des fonctionnalités IA (génération de quiz, flashcards, chat), vous receviez cette erreur dans la console :

```
Access to fetch at 'https://api.openai.com/v1/chat/completions' from origin 
'http://localhost:5173' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' 
header is present on the requested resource.
```

**Cause :** Le code appelait directement l'API OpenAI depuis le navigateur (frontend), ce qui est bloqué par les navigateurs pour des raisons de sécurité.

**Risque de sécurité :** Exposer la clé API OpenAI côté client permet à n'importe qui de l'extraire et de l'utiliser.

---

## ✅ Solution appliquée

Tous les appels directs à OpenAI ont été remplacés par des appels aux **Edge Functions Supabase** qui :
- ✅ Appellent OpenAI depuis le serveur (pas de problème CORS)
- ✅ Sécurisent votre clé API OpenAI (elle reste côté serveur)
- ✅ Gèrent l'authentification automatiquement
- ✅ Respectent les bonnes pratiques de sécurité

### Fichiers modifiés :

| Fichier | Avant | Après | Edge Function |
|---------|-------|-------|---------------|
| `src/services/quizGenerator.ts` | ❌ Appel direct OpenAI | ✅ `supabase.functions.invoke('generate-quiz')` | `generate-quiz` |
| `src/services/flashcardGenerator.ts` | ❌ Appel direct OpenAI | ✅ `supabase.functions.invoke('generate-flashcards')` | `generate-flashcards` |
| `src/pages/AIAssistant.tsx` | ❌ Appel direct OpenAI | ✅ `supabase.functions.invoke('chat-ai')` | `chat-ai` |
| `src/pages/Quizzes.tsx` | ❌ Appel direct OpenAI (2x) | ✅ `supabase.functions.invoke('generate-quiz')` | `generate-quiz` |

---

## 🔍 Étape 1 : Vérifier que la clé OpenAI est configurée

Votre Edge Functions ont besoin de la clé API OpenAI pour fonctionner.

### Option A : Via le Dashboard Supabase (RECOMMANDÉ)

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet : **uexuecubafgfhpfebknt**
3. Dans le menu de gauche, cliquez sur **"Edge Functions"**
4. Cliquez sur **"Manage secrets"** (ou icône d'engrenage ⚙️)
5. Vérifiez qu'il existe un secret nommé : **`OPENAI_API_KEY`**
6. Si absent, cliquez **"Add secret"** :
   - Name: `OPENAI_API_KEY`
   - Value: Votre clé OpenAI `sk-proj-...`
7. Cliquez **"Save"**

### Option B : Via la ligne de commande

```powershell
# Définir le secret
supabase secrets set OPENAI_API_KEY=sk-proj-VOTRE_CLE_ICI

# Vérifier que c'est bien enregistré
supabase secrets list
```

**Résultat attendu :**
```
OPENAI_API_KEY
```

---

## 🔍 Étape 2 : Vérifier que les Edge Functions sont déployées

Les 3 Edge Functions doivent être déployées sur Supabase.

### Vérifier le déploiement :

```powershell
# Re-déployer les 3 fonctions
supabase functions deploy generate-quiz
supabase functions deploy generate-flashcards
supabase functions deploy chat-ai
```

**Résultat attendu pour chaque fonction :**
```
✓ Deployed Functions on project uexuecubafgfhpfebknt: generate-quiz
```

### Alternative : Vérifier dans le Dashboard

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Menu **"Edge Functions"**
4. Vous devriez voir :
   - ✅ `generate-quiz`
   - ✅ `generate-flashcards`
   - ✅ `chat-ai`

---

## 🧪 Étape 3 : Tester les fonctionnalités

Rechargez votre application dans le navigateur (F5) et testez chaque fonctionnalité :

### Test 1 : Génération de Quiz depuis un document

1. Allez dans **"Bibliothèque"**
2. Cliquez sur un document PDF
3. Cliquez sur **"Générer Quiz IA"**
4. Choisissez 5 ou 10 questions
5. Cliquez sur **"Générer"**

**✅ Résultat attendu (console F12) :**
```
🤖 Génération de 5 questions depuis le document...
📝 Texte analysé: XXXX caractères
✅ Quiz généré par l'Edge Function: {...}
✅ Quiz formaté avec succès: {...}
```

**❌ Plus d'erreur CORS !**

---

### Test 2 : Génération de Flashcards

1. Allez dans **"Bibliothèque"**
2. Cliquez sur un document
3. Cliquez sur **"Générer Fiches IA"**
4. Choisissez le nombre de fiches
5. Cliquez sur **"Générer"**

**✅ Résultat attendu (console) :**
```
🤖 Génération de 15 flashcards...
📝 Texte analysé: XXXX caractères
✅ Flashcards générées par l'Edge Function: {...}
```

---

### Test 3 : Assistant IA (Chat)

1. Allez dans **"Assistant IA"**
2. Importez un document (optionnel)
3. Posez une question
4. Envoyez

**✅ Résultat attendu :** Réponse de l'IA sans erreur CORS.

---

### Test 4 : Génération de Quiz par IA (sans document)

1. Allez dans **"Quiz"**
2. Cliquez sur **"+ Créer un quiz"**
3. Choisissez **"Générer avec l'IA"**
4. Entrez un sujet (ex: "La photosynthèse")
5. Cliquez sur **"Générer le quiz"**

**✅ Résultat attendu :** Quiz généré et redirection vers la page de passage du quiz.

---

## 🚨 Si ça ne marche toujours pas

### Erreur : "Non authentifié"

**Cause :** Vous n'êtes pas connecté ou votre session a expiré.

**Solution :** Déconnectez-vous et reconnectez-vous.

---

### Erreur : "Clé OpenAI non configurée"

**Cause :** La clé API OpenAI n'est pas dans les secrets Supabase.

**Solution :** Suivez l'**Étape 1** ci-dessus pour ajouter le secret `OPENAI_API_KEY`.

---

### Erreur : "Erreur lors de la génération : 404"

**Cause :** L'Edge Function n'est pas déployée ou mal nommée.

**Solution :**
```powershell
# Lister les fonctions déployées
supabase functions list

# Re-déployer la fonction manquante
supabase functions deploy generate-quiz
supabase functions deploy generate-flashcards
supabase functions deploy chat-ai
```

---

### Erreur : "Failed to fetch" ou "Network error"

**Cause :** Problème de connexion réseau ou URL Supabase incorrecte.

**Solution :** Vérifiez votre fichier `.env` :
```env
VITE_SUPABASE_URL=https://uexuecubafgfhpfebknt.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key_ici
```

---

### Erreur persistante dans la console

**Solution :**
1. Ouvrez la console du navigateur (F12)
2. Copiez l'erreur complète
3. Vérifiez les logs des Edge Functions dans le Dashboard Supabase :
   - Dashboard → Edge Functions → Cliquez sur une fonction → Onglet "Logs"

---

## 📝 Différences techniques

### ❌ Ancien code (causait CORS)

```typescript
const apiKey = import.meta.env.VITE_OPENAI_API_KEY; // ❌ Clé exposée côté client

const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`, // ❌ Envoyé depuis le navigateur
  },
  body: JSON.stringify({ ... })
});
```

**Problèmes :**
- ❌ Erreur CORS (bloqué par le navigateur)
- ❌ Clé API visible dans le code frontend (risque de sécurité)
- ❌ Coûts non contrôlés (n'importe qui peut utiliser la clé)

---

### ✅ Nouveau code (sécurisé)

```typescript
import { supabase } from '../lib/supabase';

const { data, error } = await supabase.functions.invoke('generate-quiz', {
  body: {
    text: truncatedText,
    documentName: documentTitle,
    questionCount: questionCount
  },
});
```

**Avantages :**
- ✅ Plus d'erreur CORS (appel serveur à serveur)
- ✅ Clé API OpenAI sécurisée (stockée dans les secrets Supabase)
- ✅ Authentification automatique via Supabase
- ✅ Gestion d'erreurs améliorée
- ✅ Respect des bonnes pratiques de sécurité

---

## 🎯 Résumé de la correction

| Élément | Statut |
|---------|--------|
| **Code frontend** | ✅ Modifié (4 fichiers) |
| **Edge Functions** | ✅ Existent (3 fonctions) |
| **Déploiement** | ⚠️ À vérifier (Étape 2) |
| **Clé OpenAI** | ⚠️ À vérifier (Étape 1) |
| **Erreurs CORS** | ✅ Corrigées |
| **Sécurité** | ✅ Améliorée |

---

## 🔐 Sécurité améliorée

### Avant (❌ Non sécurisé)

- Clé API OpenAI dans le fichier `.env` côté client
- Clé visible dans le code source (inspection navigateur)
- N'importe qui peut extraire et utiliser la clé
- Coûts non contrôlés

### Après (✅ Sécurisé)

- Clé API OpenAI dans les secrets Supabase (serveur uniquement)
- Impossible d'accéder à la clé depuis le navigateur
- Authentification requise pour appeler les Edge Functions
- Contrôle des coûts via Supabase

---

## 📞 Support

Si le problème persiste après avoir suivi toutes les étapes :

1. **Vérifiez la console du navigateur** (F12) : Copiez l'erreur complète
2. **Vérifiez les logs Supabase** :
   - Dashboard → Edge Functions → Logs
3. **Vérifiez le déploiement** : `supabase functions list`
4. **Vérifiez les secrets** : `supabase secrets list`

---

**Date de correction :** 4 janvier 2026  
**Fichiers modifiés :**
- `src/services/quizGenerator.ts`
- `src/services/flashcardGenerator.ts`
- `src/pages/AIAssistant.tsx`
- `src/pages/Quizzes.tsx`

**Edge Functions utilisées :**
- `generate-quiz`
- `generate-flashcards`
- `chat-ai`

**Problème résolu :** ✅ Erreurs CORS + Sécurité améliorée
