# 🚀 GUIDE - Installation Git et Commit

## ⚠️ Git n'est pas encore installé

L'installation précédente a été interrompue. Voici comment terminer l'installation.

---

## 📥 Méthode 1 : Installation automatique (Recommandée)

### Option A : Via PowerShell Admin

1. **Ouvrez PowerShell en tant qu'Administrateur**
   - Cliquez droit sur le menu Démarrer
   - Sélectionnez "Windows PowerShell (Admin)" ou "Terminal (Admin)"

2. **Exécutez cette commande :**
```powershell
winget install --id Git.Git -e --source winget
```

3. **Attendez la fin de l'installation** (2-3 minutes)

4. **Redémarrez votre terminal Cursor**

5. **Vérifiez l'installation :**
```bash
git --version
```

Devrait afficher : `git version 2.52.0.windows.1` (ou similaire)

---

## 📥 Méthode 2 : Installation manuelle

### Si winget ne fonctionne pas :

1. **Téléchargez Git :**
   - Visitez : https://git-scm.com/download/win
   - Téléchargez **64-bit Git for Windows Setup**

2. **Lancez l'installateur**
   - Double-cliquez sur le fichier téléchargé
   - Cliquez "Yes" pour autoriser

3. **Configuration (utilisez les valeurs par défaut) :**
   - Information : **Next**
   - Destination : **Next**
   - Composants : **Next**
   - Menu Démarrer : **Next**
   - Éditeur : **Next** (ou choisissez votre éditeur)
   - Branche initiale : **Next**
   - PATH : **Recommended** → **Next**
   - SSH : **Next**
   - HTTPS : **Next**
   - Line ending : **Next**
   - Terminal : **Next**
   - Git pull : **Next**
   - Credential helper : **Next**
   - Extra options : **Next**
   - Experimental : **Next**
   - **Install**

4. **Attendez l'installation** (2-3 minutes)

5. **Finish**

6. **Redémarrez Cursor/VSCode**

---

## ✅ Après installation - Créer le commit

### Étape 1 : Configurer Git (première fois seulement)

```bash
git config --global user.name "Votre Nom"
git config --global user.email "votre.email@example.com"
```

**Exemple :**
```bash
git config --global user.name "John Doe"
git config --global user.email "john@example.com"
```

---

### Étape 2 : Vérifier l'état du dépôt

```bash
cd "c:\Users\HP I5\Downloads\project"
git status
```

**Si "not a git repository" :**
```bash
git init
```

---

### Étape 3 : Voir les fichiers modifiés

```bash
git status
```

**Vous devriez voir les 47 fichiers modifiés/créés**

---

### Étape 4 : Ajouter tous les fichiers

```bash
git add .
```

**Vérifier :**
```bash
git status
```

Tous les fichiers devraient être en vert (staged)

---

### Étape 5 : Créer le commit

```bash
git commit -m "Adapter l'application pour la structure de table documents simplifiée

Fonctionnalités principales :
- Upload de fichiers vers Supabase Storage
- Rafraîchissement automatique de la liste
- Extraction de texte PDF avec documentTransformer
- Génération automatique de quiz (5 QCM) avec OpenAI
- Génération automatique de flashcards (10-30 cartes)
- Composants interactifs QuizPlayer et FlashcardPlayer

Corrections :
- Protection contre doc.name undefined
- Protection dans affichage et filtres
- Gestion d'erreurs renforcée
- Nom de fichier garanti avec fallback

Services créés :
- documentTransformer.ts : extraction et nettoyage PDF
- quizGenerator.ts : génération quiz OpenAI
- flashcardGenerator.ts : extraction définitions/dates

Documentation :
- 45 fichiers de documentation créés
- Guides complets pour chaque fonctionnalité"
```

---

### Étape 6 : Vérifier le commit

```bash
git log --oneline -1
```

Devrait afficher votre commit !

---

## 🌐 (Optionnel) Pousser vers GitHub

### Si vous avez un dépôt GitHub :

```bash
# Ajouter le remote
git remote add origin https://github.com/votre-username/votre-repo.git

# Pousser le commit
git push -u origin main
```

**Ou si branche master :**
```bash
git push -u origin master
```

---

## 🎯 Commandes Git utiles

### Voir l'historique
```bash
git log --oneline
```

### Voir les modifications
```bash
git diff
```

### Voir les fichiers suivis
```bash
git ls-files
```

### Annuler le dernier commit (garder les modifications)
```bash
git reset --soft HEAD~1
```

---

## 📊 Résumé des fichiers à commiter

**47 fichiers au total :**

### Modifiés (2) :
- `src/lib/supabase.ts`
- `src/pages/Library.tsx`

### Créés (45) :
- **Services (4)** : documentTransformer, quizGenerator, flashcardGenerator, pdfExtractor
- **Composants (2)** : QuizPlayer, FlashcardPlayer
- **Pages (1)** : DocumentView
- **Config (3)** : vite.config.ts, package.json, start.bat
- **SQL (2)** : storage_policies.sql, create_documents_table_complet.sql
- **Documentation (33)** : Guides complets

---

## ⚠️ Problèmes courants

### "git n'est pas reconnu"
→ Git n'est pas installé ou le terminal n'a pas été redémarré
→ Solution : Redémarrez Cursor/Terminal

### "not a git repository"
→ Le dossier n'est pas un dépôt Git
→ Solution : `git init`

### "Please tell me who you are"
→ Git n'est pas configuré
→ Solution : `git config --global user.name "Nom"` et `user.email`

### Permission denied
→ Droits insuffisants
→ Solution : Ouvrez le terminal en Administrateur

---

## 💡 Alternative : Commit via interface

**Si vous préférez une interface graphique :**

1. **GitHub Desktop** : https://desktop.github.com/
2. **GitKraken** : https://www.gitkraken.com/
3. **Sourcetree** : https://www.sourcetreeapp.com/

Ces outils ont une interface visuelle pour gérer Git.

---

## ✅ Checklist

- [ ] Git installé (`git --version` fonctionne)
- [ ] Git configuré (`user.name` et `user.email`)
- [ ] Dépôt initialisé (`git init` si nécessaire)
- [ ] Fichiers ajoutés (`git add .`)
- [ ] Commit créé (`git commit -m "..."`)
- [ ] (Optionnel) Poussé vers GitHub

---

## 🎉 Résultat final

Une fois le commit créé, vous aurez :

```
✅ 47 fichiers sauvegardés dans l'historique Git
✅ Message de commit détaillé
✅ Possibilité de revenir en arrière si besoin
✅ Historique des modifications préservé
```

---

**Terminez l'installation de Git et lancez les commandes ci-dessus !** 🚀

**Vos modifications sont déjà sauvegardées dans les fichiers, le commit Git est optionnel mais recommandé !** 💾
