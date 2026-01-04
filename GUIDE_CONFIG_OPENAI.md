# 🔐 GUIDE : Configuration de Votre Clé OpenAI

## 📍 VOUS ÊTES ICI : Configuration Locale (Développement)

### ✅ ÉTAPE 1 : Créer le fichier `.env.local`

**Dans le terminal (PowerShell) :**

```powershell
# Créer le fichier .env.local à partir du template
Copy-Item .env.local.example .env.local
```

**OU manuellement :**
1. Créer un nouveau fichier nommé `.env.local` à la racine du projet
2. Copier le contenu de `.env.local.example`

---

### ✅ ÉTAPE 2 : Ajouter Votre Clé OpenAI

1. **Ouvrir `.env.local` dans un éditeur de texte**

2. **Remplacer cette ligne :**
   ```env
   VITE_OPENAI_API_KEY=VOTRE_CLE_OPENAI_ICI
   ```

3. **Par votre vraie clé OpenAI :**
   ```env
   VITE_OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXXXXXXX
   ```

**📍 Où trouver votre clé ?**
- Si vous l'avez déjà : Copiez-la depuis vos notes sécurisées
- Sinon : https://platform.openai.com/api-keys

---

### ✅ ÉTAPE 3 : Ajouter vos infos Supabase

1. **Aller sur Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/[VOTRE_PROJECT_ID]/settings/api
   ```

2. **Copier :**
   - `Project URL` → Coller dans `VITE_SUPABASE_URL`
   - `anon public` key → Coller dans `VITE_SUPABASE_ANON_KEY`

**Exemple :**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnopqrst.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### ✅ ÉTAPE 4 : Redémarrer le serveur

```powershell
# Arrêter le serveur (Ctrl+C)
# Puis relancer
npm run dev
```

---

### ✅ ÉTAPE 5 : Vérifier que ça fonctionne

1. **Ouvrir la console du navigateur** (F12)

2. **Taper dans la console :**
   ```javascript
   console.log(import.meta.env.VITE_OPENAI_API_KEY)
   ```

3. **Résultat attendu :**
   - ✅ Vous voyez votre clé : `sk-proj-...`
   - ❌ Vous voyez `undefined` : Le fichier .env.local n'est pas bien configuré

---

## 🚀 POUR LA PRODUCTION (Vercel)

### Configuration des Variables d'Environnement sur Vercel

1. **Aller sur Vercel Dashboard**
   ```
   https://vercel.com/delricke-techs-projects/wordcraft/settings/environment-variables
   ```

2. **Ajouter chaque variable :**
   
   | Nom | Valeur | Environnement |
   |-----|--------|---------------|
   | `VITE_OPENAI_API_KEY` | `sk-proj-VOTRE_CLE` | Production, Preview, Development |
   | `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview, Development |
   | `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Production, Preview, Development |

3. **Cocher les 3 environnements** pour chaque variable

4. **Cliquer sur `Save`**

5. **Redéployer l'application**
   - Aller dans l'onglet `Deployments`
   - Cliquer sur les 3 points `...` du dernier déploiement
   - Cliquer `Redeploy`

---

## ⚠️ SÉCURITÉ IMPORTANTE

### ❌ NE JAMAIS FAIRE :
- ❌ Commiter `.env.local` sur Git
- ❌ Partager vos clés API publiquement
- ❌ Exposer les clés dans le code source

### ✅ TOUJOURS FAIRE :
- ✅ Garder `.env.local` local uniquement
- ✅ Utiliser des variables d'environnement
- ✅ Révoquer les clés compromises immédiatement

---

## 🔍 VÉRIFICATION `.gitignore`

Le fichier `.env.local` doit être ignoré par Git.

**Vérifier :**
```powershell
Get-Content .gitignore | Select-String "env.local"
```

**Résultat attendu :**
```
.env.local
```

Si absent, ajouter cette ligne dans `.gitignore` :
```
.env.local
```

---

## 🆘 EN CAS DE PROBLÈME

### La clé n'est pas reconnue

1. **Vérifier le format du fichier**
   - Pas d'espaces avant/après `=`
   - Format correct : `VITE_OPENAI_API_KEY=sk-proj-xxx`

2. **Vérifier le nom du fichier**
   - Doit être exactement `.env.local` (avec le point)
   - À la racine du projet (pas dans un sous-dossier)

3. **Redémarrer complètement**
   - Fermer VS Code
   - Rouvrir VS Code
   - Relancer `npm run dev`

### Erreur 401 Unauthorized

- ✅ Votre clé est invalide ou expirée
- 👉 Créer une nouvelle clé sur https://platform.openai.com/api-keys
- 👉 Vérifier que votre compte OpenAI a des crédits

---

**Date:** 04 Janvier 2026  
**Guide:** Configuration Clé API OpenAI Local + Production
