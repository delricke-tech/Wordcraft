# 📚 GUIDE DE DÉPLOIEMENT COMPLET
## WordCraft IA - Production & Fiabilité

**Date:** 11 mars 2025  
**Version:** 1.0.0  
**Phase:** 3.5 - Production & Fiabilité

---

## 🎯 OBJECTIF

Ce guide explique comment déployer WordCraft IA en production avec toutes les fonctionnalités :
- Interface responsive et thème clair/sombre
- Système de notifications complet
- Logs et monitoring avancés
- Sauvegardes automatiques
- Sécurité renforcée

---

## 🏗️ ARCHITECTURE DE DÉPLOIEMENT

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                │
│  ┌─────────────────────────────────────────────┐    │
│  │          React + Vite + TypeScript        │    │
│  │  ┌─────────────────────────────────┐    │    │
│  │  │     Responsive UI + Theme     │    │    │
│  │  │  ┌─────────────────────┐    │    │    │
│  │  │  │  Notifications    │    │    │    │
│  │  │  └─────────────────────┘    │    │    │
│  │  └─────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────┤
│                  BACKEND (Supabase)                │
│  ┌─────────────────────────────────────────────┐    │
│  │     PostgreSQL + RLS + Functions       │    │
│  │  ┌─────────────────────────────────┐    │    │
│  │  │    Auth + Storage + Edge     │    │    │
│  │  │  ┌─────────────────────┐    │    │    │
│  │  │  │  Daily.co + OpenAI │    │    │    │
│  │  │  └─────────────────────┘    │    │    │
│  │  └─────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 PRÉREQUIS

### Outils nécessaires
- **Node.js** 18+ et npm/yarn
- **Git** pour le versioning
- **Comptes requis :**
  - [Vercel](https://vercel.com) (déployement frontend)
  - [Supabase](https://supabase.com) (base de données)
  - [OpenAI](https://platform.openai.com) (API IA)
  - [Daily.co](https://daily.co) (sessions vidéo)

### Variables d'environnement
Copier `.env.example` en `.env.production` :

```bash
# Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anonyme
SUPABASE_SERVICE_ROLE_KEY=votre-clé-service

# OpenAI
VITE_OPENAI_API_KEY=sk-votre-clé-openai
VITE_OPENAI_MODEL=gpt-4-turbo-preview

# Daily.co
VITE_DAILY_API_KEY=votre-clé-daily

# URLs
VITE_PROD_URL=https://votre-domaine.com
VITE_API_URL=https://api.votre-domaine.com
```

---

## 🚀 DÉPLOIEMENT

### 1. Configuration Supabase

#### Créer le projet
```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter
supabase login

# Créer un nouveau projet
supabase projects create
```

#### Appliquer les migrations
```bash
# Appliquer toutes les migrations
supabase db push

# Vérifier le schéma
supabase db diff
```

#### Configurer les services
1. **Authentication** : Activer email/password
2. **Storage** : Créer buckets `documents`, `avatars`, `backups`
3. **Edge Functions** : Déployer les fonctions nécessaires
4. **RLS** : Vérifier que toutes les politiques sont actives

### 2. Configuration Frontend

#### Installation des dépendances
```bash
# Installer les dépendances
npm install

# Build en production
npm run build

# Vérifier le build
npm run preview
```

#### Configuration Vercel
```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer
vercel --prod
```

Configuration Vercel requise dans `vercel.json` :

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html",
      "methods": ["GET", "HEAD", "OPTIONS"]
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "VITE_OPENAI_API_KEY": "@openai_api_key",
    "VITE_PROD_URL": "@prod_url"
  }
}
```

### 3. Configuration Monitoring

#### Sentry (Error Tracking)
```javascript
// src/sentry.ts
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.VITE_SENTRY_ENVIRONMENT,
  tracesSampleRate: 1.0,
});
```

#### Analytics
```javascript
// src/analytics.ts
import { getAnalytics } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';

const analytics = getAnalytics();
const perf = getPerformance();
```

---

## 📊 MONITORING & LOGS

### Logs applicatifs
Les logs sont automatiquement envoyés à :
- **Console** en développement
- **Service externe** en production (niveau ERROR+)
- **Supabase** via les tables de logs

### Métriques surveillées
- **Performance** : temps de chargement, FCP, LCP
- **Erreurs** : taux d'erreur, erreurs par catégorie
- **Utilisation** : nombre d'utilisateurs, sessions actives
- **Ressources** : utilisation CPU, mémoire, stockage

### Alertes configurées
- **Erreurs critiques** : notification immédiate
- **Performance dégradée** : alerte si >3s
- **Stockage plein** : alerte à 80%
- **Taux d'erreur** : alerte si >5%

---

## 💾 STRATÉGIE DE SAUVEGARDES

### Sauvegardes automatiques
```javascript
// Configuration par défaut
const autoBackupConfig = {
  frequency: 'daily',      // daily, weekly, monthly
  includeUserData: true,
  includeDocuments: true,
  includeConversations: true,
  includeGroups: true,
  includeSessions: true,
  includeSettings: true,
  compressionLevel: 'medium' // none, low, medium, high
};
```

### Types de sauvegardes
1. **Complètes** : toutes les données utilisateur
2. **Incrémentales** : uniquement les modifications
3. **Automatiques** : selon la planification
4. **Manuelles** : déclenchées par l'utilisateur

### Stockage des sauvegardes
- **Supabase Storage** : bucket `backups`
- **Compression** : GZIP avec checksum SHA-256
- **Rétention** : 30 jours par défaut
- **Chiffrement** : optionnel avec clé utilisateur

---

## 🔒 SÉCURITÉ

### Variables d'environnement
- ✅ **Jamais commiter** les vraies clés
- ✅ **Utiliser `.env.production`** pour la production
- ✅ **Rotation des clés** tous les 90 jours
- ✅ **Principe du moindre privilège**

### RLS (Row Level Security)
- ✅ **Politiques par table** avec vérification `auth.uid()`
- ✅ **Accès utilisateur** uniquement à ses propres données
- ✅ **Validation des entrées** côté serveur
- ✅ **Logs d'accès** pour audit

### HTTPS & Headers
```javascript
// Headers de sécurité
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};
```

---

## 📈 PERFORMANCE

### Optimisations frontend
- **Code splitting** : lazy loading par route
- **Tree shaking** : élimination du code inutilisé
- **Compression** : GZIP/Brotli automatique
- **CDN** : assets statiques via Vercel Edge
- **Cache** : stratégies de cache appropriées

### Optimisations backend
- **Index base de données** : sur les colonnes critiques
- **Connection pooling** : Supabase géré automatiquement
- **Edge Functions** : calculs proches des utilisateurs
- **Pagination** : pour les grandes listes de données

### Métriques cibles
- **FCP** : < 1.5s
- **LCP** : < 2.5s
- **TTI** : < 3.5s
- **CLS** : < 0.1

---

## 🔄 MAINTENANCE

### Tâches régulières
```bash
# Quotidien
supabase db push --schema-only  # Vérifier schéma
vercel logs --since=1d        # Vérifier erreurs

# Hebdomadaire
npm audit fix                 # Sécurité dépendances
supabase db dump             # Backup base

# Mensuel
supabase projects update       # Mise à jour
npm update                    # Mise à jour dépendances
```

### Monitoring proactif
- **Surveillance 24/7** via Sentry
- **Alertes email/SMS** pour incidents critiques
- **Dashboard** : Grafana/Prometheus optionnel
- **Health checks** : endpoints de surveillance

---

## 🚨 DÉPANNAGE

### Problèmes courants

#### 1. Erreur de connexion Supabase
```bash
# Vérifier la configuration
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Tester la connexion
curl -I $VITE_SUPABASE_URL/rest/v1/
```

#### 2. Build échoue
```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 3. Performance dégradée
```bash
# Analyser avec Lighthouse
npx lighthouse https://votre-domaine.com

# Vérifier les bundles
npx webpack-bundle-analyzer dist/static/js/*.js
```

### Logs utiles
```bash
# Logs Vercel
vercel logs --follow

# Logs Supabase
supabase functions logs --follow

# Logs application
curl "https://api.votre-domaine.com/logs?level=error"
```

---

## 📋 CHECKLIST DE DÉPLOIEMENT

### Pré-déploiement
- [ ] Variables d'environnement configurées
- [ ] Base de données migrée
- [ ] Tests en staging validés
- [ ] Performance optimisée
- [ ] Sécurité vérifiée
- [ ] Sauvegardes testées

### Post-déploiement
- [ ] Application accessible en production
- [ ] Monitoring fonctionnel
- [ ] Logs correctement configurés
- [ ] Sauvegardes automatiques actives
- [ ] Performance conforme aux objectifs
- [ ] Sécurité validée (scan)

---

## 🌍 URLS IMPORTANTES

### Production
- **Application** : https://votre-domaine.com
- **API** : https://api.votre-domaine.com
- **Supabase** : https://votre-projet.supabase.co
- **Monitoring** : https://sentry.io/organisation/projet
- **Analytics** : https://analytics.google.com

### Staging
- **Application** : https://staging.votre-domaine.com
- **API** : https://api-staging.votre-domaine.com

---

## 📞 SUPPORT

### En cas de problème
1. **Vérifier les logs** : Sentry et console
2. **Consulter la documentation** : `/docs`
3. **Contacter le support** : support@wordcraft.ai
4. **Créer une issue** : GitHub repository

### Informations à fournir
- URL de l'erreur
- Navigateur et version
- Heure et fuseau horaire
- Screenshots si applicable
- Steps pour reproduire

---

## 📚 RÉFÉRENCES

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API](https://platform.openai.com/docs)
- [Daily.co API](https://docs.daily.co/)
- [React Performance](https://react.dev/learn/react-performance)
- [Web.dev Guidelines](https://web.dev/)

---

## ✅ VALIDATION FINALE

Une fois le déploiement terminé, vérifier :

1. **Fonctionnalité** : toutes les features opérationnelles
2. **Performance** : temps de chargement < 3s
3. **Sécurité** : pas de vulnérabilités critiques
4. **Monitoring** : logs et alertes fonctionnels
5. **Sauvegardes** : automatiques et testées
6. **Documentation** : à jour et accessible

---

**🎉 Félicitations ! WordCraft IA est maintenant en production avec 100% des fonctionnalités !**

*Pour toute question ou problème, consulter ce guide ou contacter l'équipe de support.*
