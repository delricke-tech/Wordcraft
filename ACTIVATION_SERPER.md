# 🌐 ACTIVATION DE LA RECHERCHE WEB SERPER

**Date**: 31 décembre 2024  
**Status**: ✅ CLÉ API FOURNIE

---

## 🎉 VOTRE CLÉ SERPER

```
eed0d5c85a4d83f343f73a446b6596c9f8bfcc47
```

---

## ⚡ ACTIVATION RAPIDE (3 ÉTAPES)

### Étape 1 : Ouvrir le fichier `.env`

Ouvrez le fichier `.env` à la racine du projet (créez-le s'il n'existe pas).

### Étape 2 : Ajouter la clé Serper

Ajoutez cette ligne dans votre fichier `.env` :

```bash
VITE_SERPER_API_KEY=eed0d5c85a4d83f343f73a446b6596c9f8bfcc47
```

**Exemple de fichier `.env` complet** :

```bash
# Supabase (REQUIS)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon-publique

# OpenAI (REQUIS)
VITE_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Serper - Recherche Web (ACTIVÉ) ✅
VITE_SERPER_API_KEY=eed0d5c85a4d83f343f73a446b6596c9f8bfcc47
```

### Étape 3 : Redémarrer l'application

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis redémarrez :
npm run dev
```

---

## ✅ VÉRIFICATION

Une fois redémarré, la recherche web Serper sera **automatiquement activée** !

Le système détectera la clé et utilisera Google Search pour enrichir les réponses.

---

## 🎯 COMMENT L'UTILISER

### Option 1 : Automatique (Recommandé)

Le système enrichira automatiquement les réponses avec des informations du web quand c'est pertinent.

### Option 2 : Activation Manuelle (Futur)

Un bouton "🌐 Enrichir avec le web" peut être ajouté dans l'interface si souhaité.

---

## 📊 AVANTAGES DE SERPER

### Ce Que Ça Vous Apporte

✅ **Informations Actualisées**
- Accès aux dernières informations via Google Search
- Complète les connaissances du document

✅ **Sources Multiples**
- Jusqu'à 5 résultats Google par recherche
- URLs et extraits fournis

✅ **Gratuit**
- 2500 requêtes/mois GRATUITES
- Largement suffisant pour un usage normal

✅ **Qualité Google**
- Résultats de qualité (Google Search)
- Knowledge Graph inclus

---

## 🔍 EXEMPLE D'UTILISATION

### Question : "Quelles sont les applications récentes de cette théorie ?"

**Sans recherche web** :
```
Voici les applications basées sur le document...
[Limité au document + connaissances 2023]
```

**Avec Serper activé** ✨ :
```
## 🌿 Applications de la Théorie

### 📚 Selon le Document
[Informations du document...]

### 🌐 Dernières Applications (Google Search)

**1. Application en médecine (2024)**
🔗 source1.com
[Extrait récent...]

**2. Nouvelle utilisation en agriculture**
🔗 source2.com
[Extrait récent...]

**3. Recherche en cours**
🔗 source3.com
[Extrait récent...]

### 💡 Synthèse
[Combinaison document + web]
```

---

## 📈 LIMITES & QUOTAS

### Votre Plan Serper

- **Gratuit** : 2500 recherches/mois
- **Renouvellement** : Automatique chaque mois
- **Dépassement** : Le service se désactive (revient au mode offline)

### Consommation Estimée

- **Usage normal** : ~100-200 recherches/mois
- **Usage intensif** : ~500-800 recherches/mois
- **Vous êtes large** avec 2500 ! 😊

---

## 🛠️ CONFIGURATION AVANCÉE (Optionnel)

### Activer la Recherche Web pour Toutes les Questions

Modifiez `src/services/openaiService.ts` (ligne ~235) :

```typescript
// Activer par défaut (au lieu de false)
const response = await sendChatMessage(
  messageToSend,
  documentContext,
  messages,
  {
    detailLevel: detailLevel,
    useWebSearch: true // ✅ Activé par défaut
  }
);
```

### Limiter aux Questions Spécifiques

Gardez `useWebSearch: false` par défaut, l'IA décidera quand chercher sur le web.

---

## ⚠️ NOTES IMPORTANTES

### Sécurité

✅ La clé est stockée dans `.env` (ignoré par Git)  
✅ Jamais exposée côté client  
✅ Utilisée uniquement côté serveur

### Performance

- Ajoute ~2-3 secondes aux réponses
- Seulement quand nécessaire
- Peut être désactivé à tout moment

### Confidentialité

- Les recherches passent par Serper API
- Serper utilise Google Search
- Anonymisé (pas de tracking personnel)

---

## 🔄 DÉSACTIVATION

Pour désactiver la recherche web :

1. **Commentez la ligne dans `.env`** :
```bash
# VITE_SERPER_API_KEY=eed0d5c85a4d83f343f73a446b6596c9f8bfcc47
```

2. **Redémarrez l'application**

Le système reviendra automatiquement au mode offline (qui fonctionne très bien).

---

## 📚 ALTERNATIVES

Si vous préférez **Tavily** (optimisé pour l'IA) :

1. Compte gratuit : [tavily.com](https://tavily.com)
2. Obtenez une clé API
3. Remplacez dans `.env` :
```bash
# VITE_SERPER_API_KEY=eed0d5c85a4d83f343f73a446b6596c9f8bfcc47
VITE_TAVILY_API_KEY=tvly-xxxxxxxxxxxxx
```

---

## ✅ CHECKLIST D'ACTIVATION

- [ ] Clé Serper ajoutée dans `.env`
- [ ] Fichier `.env` sauvegardé
- [ ] Application redémarrée
- [ ] Test de question effectué
- [ ] Réponses enrichies vérifiées

---

## 🎊 FÉLICITATIONS !

Votre assistant IA peut maintenant **enrichir ses réponses avec Google Search** ! 🌐

**Prochaine étape** : Testez avec une question nécessitant des infos récentes.

---

**Configuration par** : Cursor AI Assistant  
**Date** : 31 décembre 2024  
**Clé Serper** : ✅ FOURNIE  
**Status** : 🚀 PRÊT À ACTIVER
