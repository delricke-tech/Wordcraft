# 🚀 GUIDE DÉPLOIEMENT EDGE FUNCTIONS SUPABASE

## 📋 Ce que nous avons créé

3 Edge Functions pour sécuriser vos appels OpenAI :

1. **`generate-quiz`** - Génère des quiz depuis un texte
2. **`generate-flashcards`** - Génère des flashcards depuis un texte  
3. **`chat-ai`** - Chat IA avec contexte de documents

✅ **Avantages** :
- Clé API OpenAI sécurisée côté serveur
- Plus d'erreur CORS
- Plus sécurisé
- Meilleure gestion des erreurs

---

## 🔧 ÉTAPE 1 : Installer Supabase CLI (5 minutes)

### Windows (PowerShell)

```powershell
# Avec Scoop (recommandé)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# OU avec npm
npm install -g supabase
```

### Vérifier l'installation

```bash
supabase --version
```

Vous devriez voir : `supabase version 1.x.x`

---

## 🔐 ÉTAPE 2 : Configurer votre clé OpenAI (2 minutes)

### A. Aller sur Supabase Dashboard

1. **https://supabase.com/dashboard**
2. Sélectionnez votre projet WordCraft
3. Menu gauche → **Settings** → **Edge Functions**
4. Ou directement : **Project Settings** → **API**

### B. Ajouter les secrets (variables d'environnement)

1. Dans le dashboard, aller dans **Edge Functions** → **Manage secrets**

2. Ajouter votre clé OpenAI :
   ```
   Nom : OPENAI_API_KEY
   Valeur : sk-proj-VOTRE_CLE_OPENAI_ICI
   ```

3. **Cliquer sur `Save`**

### C. Vérifier les autres variables (déjà configurées automatiquement)

Ces variables existent déjà :
- ✅ `SUPABASE_URL` - URL de votre projet
- ✅ `SUPABASE_ANON_KEY` - Clé publique

---

## 📤 ÉTAPE 3 : Déployer les Edge Functions (3 minutes)

### A. Se connecter à Supabase

```bash
# Dans PowerShell, à la racine du projet
cd "C:\Users\HP I5\Downloads\project"

# Se connecter
supabase login
```

Cela ouvrira votre navigateur pour vous connecter.

### B. Lier votre projet

```bash
# Récupérer votre Project Reference ID
# Dashboard Supabase → Settings → General → Reference ID

supabase link --project-ref VOTRE_PROJECT_REF_ID
```

Exemple : `supabase link --project-ref abc defghijklmnopqr`

### C. Déployer les 3 fonctions

```bash
# Déployer generate-quiz
supabase functions deploy generate-quiz

# Déployer generate-flashcards  
supabase functions deploy generate-flashcards

# Déployer chat-ai
supabase functions deploy chat-ai
```

Attendez que chaque déploiement soit terminé ✅

---

## 🧪 ÉTAPE 4 : Tester les fonctions (2 minutes)

### A. Via Supabase Dashboard

1. **Edge Functions** → Voir vos 3 fonctions déployées
2. Cliquer sur une fonction
3. Cliquer sur `Invoke` pour tester

### B. Via curl (terminal)

```bash
# Récupérer votre ANON_KEY depuis Dashboard → Settings → API

# Tester generate-quiz
curl -X POST \
  'https://VOTRE_PROJECT_REF.supabase.co/functions/v1/generate-quiz' \
  -H 'Authorization: Bearer VOTRE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "La photosynthèse est le processus...",
    "documentName": "Test",
    "questionCount": 5
  }'
```

Si vous voyez un JSON avec des questions, ça marche ! ✅

---

## 🔄 ÉTAPE 5 : Mettre à jour votre code frontend (10 minutes)

Maintenant, au lieu d'appeler OpenAI directement, appelez vos Edge Functions.

### Exemple : Modifier le service de génération de quiz

Trouvez le fichier `src/services/quizGenerator.ts` et remplacez :

```typescript
// ❌ AVANT (appel direct OpenAI - erreur CORS)
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ ... })
})
```

```typescript
// ✅ APRÈS (appel via Edge Function - sécurisé)
const { data: { session } } = await supabase.auth.getSession()

const response = await fetch(
  `${supabaseUrl}/functions/v1/generate-quiz`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: extractedText,
      documentName: docName,
      questionCount: count
    })
  }
)

const quizData = await response.json()
```

Voulez-vous que je modifie automatiquement tous les fichiers nécessaires ? 🔧

---

## 📊 RÉCAPITULATIF

### Ce qui a été fait :
- ✅ 3 Edge Functions créées
- ✅ Code TypeScript pour chaque fonction
- ✅ Gestion CORS intégrée
- ✅ Authentification vérifiée

### Ce qu'il reste à faire :
1. [ ] Installer Supabase CLI
2. [ ] Configurer votre clé OpenAI dans les secrets
3. [ ] Déployer les 3 fonctions
4. [ ] Mettre à jour le code frontend
5. [ ] Tester

---

## 🆘 DÉPANNAGE

### Erreur "supabase: command not found"

```bash
# Réinstaller
npm install -g supabase

# Ou vérifier PATH
echo $env:PATH
```

### Erreur "Project not linked"

```bash
# Vérifier que vous êtes dans le bon dossier
cd "C:\Users\HP I5\Downloads\project"

# Relancer link
supabase link --project-ref VOTRE_REF_ID
```

### Erreur "Invalid JWT" lors du test

- Vérifiez que vous utilisez `ANON_KEY` et non `SERVICE_ROLE_KEY`
- Dashboard → Settings → API → `anon` `public`

---

## 🎯 AVANTAGES APRÈS DÉPLOIEMENT

- ✅ **Sécurité** : Clé API cachée côté serveur
- ✅ **CORS** : Plus d'erreur CORS
- ✅ **Performance** : Appels optimisés
- ✅ **Monitoring** : Logs dans Supabase Dashboard
- ✅ **Scalabilité** : Gère automatiquement la charge

---

**Date:** 04 Janvier 2026  
**Priorité:** 🟡 MOYEN (amélioration sécurité)  
**Temps estimé:** 20 minutes

Voulez-vous que je vous guide pas à pas ou que je modifie directement le code frontend ? 🚀
