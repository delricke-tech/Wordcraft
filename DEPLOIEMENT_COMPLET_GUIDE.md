# 🚀 DÉPLOIEMENT COMPLET - GUIDE RAPIDE

## ⚠️ IMPORTANT : Comprendre l'architecture

```
┌─────────────────────────────────────────────────────────┐
│  VOTRE APPLICATION                                       │
│                                                          │
│  Frontend (React/Vite) ──────┐                         │
│  peut être sur Vercel        │                         │
│  ou localhost                │                         │
└──────────────────────────────┼──────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────┐
│  SUPABASE (Backend)                                     │
│                                                          │
│  ✅ Edge Functions (backend serverless)                │
│     - generate-quiz                                     │
│     - generate-flashcards                               │
│     - chat-ai                                           │
│                                                          │
│  ✅ Base de données PostgreSQL                         │
│  ✅ Storage (fichiers)                                  │
│  ✅ Auth (authentification)                            │
└─────────────────────────────────────────────────────────┘
                               │
                               ▼
                         ┌─────────┐
                         │ OpenAI  │
                         │   API   │
                         └─────────┘
```

**Les Edge Functions DOIVENT être sur Supabase (pas Vercel) !**

---

## 🎯 ÉTAPE 1 : Déployer les Edge Functions sur SUPABASE

### Option A : Via Dashboard (RECOMMANDÉ - 5 minutes)

1. **Allez sur le Dashboard Supabase** :
   👉 [https://supabase.com/dashboard/project/uexuecubafgfhpfebknt/functions](https://supabase.com/dashboard/project/uexuecubafgfhpfebknt/functions)

2. **Pour `generate-quiz` :**
   - Si la fonction existe : Cliquez dessus → **"Settings"** → **"Edit function"**
   - Si elle n'existe pas : **"Create a new function"** → Nom : `generate-quiz`
   
3. **Copiez TOUT le contenu du fichier** :
   ```
   C:\Users\HP I5\Downloads\project\supabase\functions\generate-quiz\index.ts
   ```

4. **Collez dans l'éditeur du Dashboard**

5. **Cliquez "Deploy"**

6. **Répétez pour** :
   - `generate-flashcards` (fichier : `supabase\functions\generate-flashcards\index.ts`)
   - `chat-ai` (fichier : `supabase\functions\chat-ai\index.ts`)

---

### Option B : Copier-coller direct (PLUS RAPIDE)

Je vous donne le contenu exact à copier-coller :

#### 🔹 Fonction 1 : `generate-quiz`

<details>
<summary>📋 Cliquez pour voir le code à copier</summary>

```typescript
// Contenu disponible dans : supabase/functions/generate-quiz/index.ts
```
</details>

Créez la fonction dans le Dashboard et collez ce code.

---

## 🎯 ÉTAPE 2 : Vérifier la clé OpenAI

1. **Dashboard Supabase** → **"Edge Functions"** → **"Manage secrets"** (icône ⚙️)

2. **Vérifiez qu'il existe** :
   - Name : `OPENAI_API_KEY`
   - Value : `sk-proj-...` (votre clé)

3. **Si absent** :
   - Cliquez **"New secret"**
   - Name : `OPENAI_API_KEY`
   - Value : Collez votre clé OpenAI complète
   - **"Save"**

---

## 🎯 ÉTAPE 3 : Tester l'application

1. **Rechargez votre application locale** : `http://localhost:5173` (F5)

2. **Testez la génération de quiz** :
   - Allez dans Bibliothèque
   - Sélectionnez un document
   - Cliquez "Générer Quiz IA"

3. **Regardez la console** (F12) :
   - ✅ Si ça marche : Vous verrez "✅ Quiz généré"
   - ❌ Si erreur : Vous verrez maintenant le **message d'erreur détaillé**

---

## 🎯 ÉTAPE 4 (OPTIONNEL) : Déployer le frontend sur Vercel

**Note :** Votre application fonctionne déjà en local. Déployer sur Vercel est optionnel pour la rendre accessible en ligne.

### Si vous voulez déployer sur Vercel :

1. **Allez sur** [https://vercel.com](https://vercel.com)

2. **Importez votre projet** :
   - "New Project" → "Import Git Repository"
   - Sélectionnez votre repository GitHub/GitLab

3. **Configurez les variables d'environnement** :
   ```
   VITE_SUPABASE_URL=https://uexuecubafgfhpfebknt.supabase.co
   VITE_SUPABASE_ANON_KEY=votre_anon_key_ici
   ```

4. **Déployez** : Vercel va automatiquement build et déployer

---

## 🔍 Vérifier les logs Supabase

Si vous avez une erreur après déploiement :

1. **Dashboard Supabase** → **"Edge Functions"**
2. **Cliquez sur** `generate-quiz`
3. **Onglet "Logs"**
4. Vous verrez exactement ce qui ne va pas

---

## ✅ Checklist de déploiement

- [ ] Edge Function `generate-quiz` déployée sur Supabase
- [ ] Edge Function `generate-flashcards` déployée sur Supabase
- [ ] Edge Function `chat-ai` déployée sur Supabase
- [ ] Secret `OPENAI_API_KEY` configuré dans Supabase
- [ ] Application testée en local (fonctionne ?)
- [ ] (Optionnel) Frontend déployé sur Vercel

---

## 🚨 Erreurs courantes

| Problème | Solution |
|----------|----------|
| "Cannot deploy via CLI" | Utilisez le Dashboard Supabase (Option A) |
| "Clé OpenAI non configurée" | Ajoutez `OPENAI_API_KEY` dans les secrets |
| "Erreur 400" | Vérifiez les logs dans Dashboard Supabase |
| "Non authentifié" | Reconnectez-vous dans l'application |

---

## 📞 Besoin d'aide ?

1. **Déployez d'abord via Dashboard Supabase** (Étape 1)
2. **Testez** (Étape 3)
3. **Si erreur** : Copiez le message complet de la console et envoyez-le moi

---

**Ordre de priorité :**
1. ✅ **URGENT** : Déployer les Edge Functions sur Supabase (Étape 1)
2. ✅ **URGENT** : Vérifier la clé OpenAI (Étape 2)
3. ✅ **URGENT** : Tester (Étape 3)
4. ⏸️ **OPTIONNEL** : Déployer sur Vercel (Étape 4)

---

**Date :** 4 janvier 2026
