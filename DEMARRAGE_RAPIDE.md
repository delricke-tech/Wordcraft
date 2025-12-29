# 🚀 Guide de Démarrage - Chat IA avec Proxy

**Date** : 28 décembre 2024

---

## ⚡ Démarrage Rapide (2 options)

### Option A : Sans proxy (Recommandé pour tester d'abord)

```powershell
cd "C:\Users\HP I5\Downloads\project"
npm run dev
```

Ouvrir : `http://localhost:5173`

**Si ça fonctionne** : ✅ Parfait ! Pas besoin de proxy.

**Si erreur CORS dans la console** : Passer à l'Option B.

---

### Option B : Avec proxy (Si CORS bloque)

**Terminal 1 - Proxy** :
```powershell
cd "C:\Users\HP I5\Downloads\project"
node proxy-server.js
```

**Attendre de voir** :
```
✅ Proxy Supabase Storage ACTIF
🌐 Serveur : http://localhost:3001
```

**Terminal 2 - Application** :
```powershell
cd "C:\Users\HP I5\Downloads\project"
npm run dev
```

**L'app détecte automatiquement le proxy et l'utilise !**

---

## 📋 Corrections appliquées

### 1. ✅ TypeScript ReactMarkdown

**Problème** : `className` non supporté directement

**Solution** : Wrapper avec `<div className="prose...">` 

```typescript
<div className="prose prose-sm prose-invert max-w-none">
  <ReactMarkdown ...>
    {msg.content}
  </ReactMarkdown>
</div>
```

### 2. ✅ Proxy PDF

**Fichier** : `src/services/openaiService.ts`

**Logique** : Essaye le proxy d'abord, fallback direct si non disponible

```typescript
// Proxy : http://localhost:3001/download/[storage_path]
// Fallback : supabase.storage.from('documents').download(storage_path)
```

### 3. ✅ Lecture IA

**Pipeline automatique** :
1. Télécharge PDF via proxy ou direct
2. Extrait texte avec pdfjs-dist
3. Envoie à OpenAI dans system prompt

### 4. ✅ Sécurité storage_path

- ✅ Proxy reçoit : `storage_path`
- ✅ Supabase download : `storage_path`
- ✅ Affichage UI : `name` (avec accents)

### 5. ✅ Glassmorphism

```typescript
background: 'rgba(255, 255, 255, 0.1)'     // Transparence
backdropFilter: 'blur(20px)'               // Flou
border: '1px solid rgba(255, 255, 255, 0.2)' // Bordure fine
```

---

## 🧪 Tests à faire

### Test 1 : Sans proxy
```
1. Lancer : npm run dev
2. Ouvrir un PDF
3. Ouvrir chat (bouton flottant)
4. Console : Chercher "PDF direct depuis Supabase"
5. ✅ Si extraction fonctionne → Pas besoin de proxy
```

### Test 2 : Avec proxy (si Test 1 échoue)
```
1. Terminal 1 : node proxy-server.js
2. Terminal 2 : npm run dev
3. Ouvrir un PDF
4. Console : Chercher "PDF via proxy (CORS contourné)"
5. ✅ Extraction fonctionne
```

### Test 3 : UI Glassmorphism
```
1. Ouvrir un PDF
2. Cliquer sur bouton chat (coin bas droit)
3. ✅ Voir transparence + flou
4. ✅ Nom du document avec accents
5. ✅ 6 suggestions de questions
```

### Test 4 : IA
```
1. Dans le chat, cliquer "Fais-moi un résumé"
2. ✅ Voir "Génération du résumé en cours..."
3. ✅ Résumé affiché en Markdown
4. Poser question : "Quels sont les points clés ?"
5. ✅ Réponse IA basée sur le PDF
```

---

## 🔍 Diagnostic erreurs

### Erreur : "Failed to fetch"

**Cause** : Proxy non démarré ou port occupé

**Solution** :
```powershell
# Vérifier si port 3001 est libre
netstat -ano | findstr :3001

# Si occupé, changer le port dans proxy-server.js ligne 115 :
const PORT = 3002; // Au lieu de 3001
```

### Erreur : "Invalid key"

**Cause** : Utilisation de `name` au lieu de `storage_path`

**Solution** : C'est déjà corrigé partout ! Vérifier la console pour voir quel chemin est utilisé.

### Erreur : "CORS blocked"

**Cause** : Bucket pas public ou RLS trop strict

**Solution** : Lancer le proxy (Option B)

---

## 📂 Fichiers modifiés

| Fichier | Modification | Raison |
|---------|--------------|--------|
| `src/components/ChatPanel.tsx` | Wrapper `<div className>` pour Markdown | Fix TypeScript |
| `src/services/openaiService.ts` | Ajout logique proxy + fallback | Éviter CORS |
| `proxy-server.js` | Créé | Proxy local |

---

## ✅ Checklist déploiement

- [ ] `npm install` exécuté (dépendances à jour)
- [ ] `.env` contient `VITE_OPENAI_API_KEY`
- [ ] Tester sans proxy d'abord (Option A)
- [ ] Si CORS : Lancer proxy (Option B)
- [ ] Vérifier console : "Storage path" utilisé
- [ ] Vérifier UI : Nom avec accents affiché
- [ ] Tester résumé IA
- [ ] Tester questions IA

---

## 🎯 Commandes essentielles

```powershell
# Développement (sans proxy)
npm run dev

# Avec proxy (Terminal 1)
node proxy-server.js

# Avec proxy (Terminal 2)
npm run dev

# Vérifier types TypeScript
npm run typecheck

# Build production
npm run build
```

---

## 🎉 Résumé

**TOUT EST PRÊT !**

1. ✅ TypeScript corrigé
2. ✅ Proxy PDF implémenté
3. ✅ Fallback automatique
4. ✅ storage_path utilisé partout
5. ✅ Glassmorphism actif

**Tester d'abord sans proxy**, lancer le proxy seulement si nécessaire !

---

**Questions ?** Consulter :
- `GUIDE_CORS_SUPABASE.md` - Configuration CORS détaillée
- `CORRECTIONS_FINALES_IA.md` - Détails techniques
- `proxy-server.js` - Code du proxy commenté

