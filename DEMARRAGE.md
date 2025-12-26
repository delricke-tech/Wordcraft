# 🚀 WordCraft - Guide de Démarrage Rapide

## ✅ Configuration Terminée

Votre application WordCraft est entièrement configurée et prête à l'emploi !

## 🎯 3 Façons de Lancer l'Application

### Méthode 1 : Double-clic (Le Plus Simple) ⭐
**Double-cliquez sur le fichier `start.bat`** à la racine du projet.
- Le serveur démarre automatiquement
- Votre navigateur s'ouvre automatiquement
- L'application s'affiche immédiatement

### Méthode 2 : Commande NPM avec ouverture auto
```bash
npm start
```
Ouvre automatiquement votre navigateur sur l'application.

### Méthode 3 : Commande classique
```bash
npm run dev
```
Puis ouvrez manuellement `http://localhost:5173/` dans votre navigateur.

## 🔧 Configuration Actuelle

### ✅ Ce qui est configuré :
- ✅ **Supabase** : Connecté avec vos clés d'environnement
- ✅ **Authentification** : Inscription et connexion fonctionnelles
- ✅ **Base de données** : Tables créées et prêtes
- ✅ **Routes** : Toutes les pages configurées
- ✅ **Auto-refresh** : Hot Module Replacement activé

### 📍 URLs de l'application :
- **Local** : `http://localhost:5173/`
- **Réseau** : Exposé automatiquement sur votre réseau local

## 🎨 Fonctionnalités Disponibles

1. 🔐 **Authentification**
   - Inscription avec validation de mot de passe
   - Connexion sécurisée
   - Gestion de profil

2. 📚 **Modules d'apprentissage**
   - Bibliothèque de ressources
   - Fiches de révision (StudyCards)
   - Quiz interactifs
   - Sessions collaboratives

3. 🤖 **IA Intégrée**
   - Assistant IA pour l'apprentissage
   - Génération de contenu

4. 👥 **Collaboration**
   - Groupes d'étude
   - Messagerie
   - Sessions en temps réel

## 🐛 Résolution de Problèmes

### Le port 5173 est occupé ?
Pas de problème ! Vite trouve automatiquement un port libre (5174, 5175, etc.)

### L'application ne s'ouvre pas ?
1. Vérifiez que le serveur est bien démarré (message "ready in XXX ms")
2. Ouvrez manuellement `http://localhost:5173/` dans votre navigateur
3. Vérifiez votre fichier `.env` contient bien vos clés Supabase

### Erreur de connexion à Supabase ?
Vérifiez que votre fichier `.env` contient :
```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon
```

## 📦 Structure du Projet

```
project/
├── src/
│   ├── pages/           # Pages de l'application
│   ├── components/      # Composants réutilisables
│   ├── contexts/        # Contextes React (Auth, etc.)
│   ├── lib/            # Configuration (Supabase)
│   └── App.tsx         # Point d'entrée de l'app
├── supabase/
│   └── migrations/     # Schéma de la base de données
├── .env               # Variables d'environnement
├── start.bat          # Script de lancement rapide
└── package.json       # Dépendances npm
```

## 🎉 Prêt à Démarrer !

**Double-cliquez sur `start.bat` et commencez à utiliser WordCraft !**

---

💡 **Astuce** : Tous vos changements de code sont automatiquement reflétés dans le navigateur grâce au Hot Module Replacement (HMR).

