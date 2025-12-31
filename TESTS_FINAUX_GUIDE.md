# 🧪 Guide de Tests Finaux - WordCraft

## 🎯 **Objectif**

Tester toutes les fonctionnalités de l'application pour s'assurer que tout fonctionne parfaitement.

Date : 31 décembre 2024

---

## 📋 **CHECKLIST COMPLÈTE**

### **✅ Tests d'authentification** 🔐

- [ ] **Test 1.1 : Visibilité des champs**
  - Allez sur http://localhost:5175/login
  - Tapez dans le champ Email
  - Tapez dans le champ Mot de passe
  - ✅ Le texte doit être visible (blanc sur fond foncé)
  - ✅ Le curseur doit être cyan et bien visible

- [ ] **Test 1.2 : Bouton œil**
  - Tapez un mot de passe
  - Cliquez sur l'icône œil (👁️)
  - ✅ Le mot de passe doit s'afficher en clair
  - Cliquez à nouveau
  - ✅ Le mot de passe doit se masquer (•••)

- [ ] **Test 1.3 : Inscription**
  - Allez sur http://localhost:5175/register
  - Remplissez tous les champs
  - ✅ Tous les champs doivent être visibles
  - ✅ Le curseur doit être teal et visible

---

### **✅ Tests d'upload multi-formats** 📤

#### **Test 2.1 : Fichier TXT** ⚡ (Le plus rapide)

1. **Créez** un fichier `test.txt` sur votre bureau
2. **Écrivez dedans** :
   ```
   Ceci est un test pour l'IA de WordCraft.
   
   Points importants :
   - L'extraction de texte doit fonctionner
   - Le chat IA doit s'ouvrir automatiquement
   - Je dois pouvoir poser des questions
   
   Question test : Quels sont les points importants ?
   ```
3. **Ouvrez** http://localhost:5175/library
4. **Cliquez sur** "Ajouter documents" (bouton violet-bleu)
5. **Sélectionnez** test.txt
6. **Attendez** l'upload

**✅ Résultat attendu :**
- Upload réussi (quelques secondes)
- Message "IA prête pour vos questions !"
- Le document apparaît dans la bibliothèque
- Quand vous cliquez dessus :
  - Le texte s'affiche formaté
  - Le chat IA s'ouvre automatiquement
  - Vous pouvez poser des questions

**❌ Si ça ne marche pas :**
- Vérifiez la console (F12)
- Partagez-moi l'erreur

---

#### **Test 2.2 : Fichier PDF** 📄

1. **Prenez** un PDF existant (petit, 1-5 pages)
2. **Uploadez-le** via "Ajouter documents"
3. **Attendez** l'upload et l'extraction (5-10 secondes)

**✅ Résultat attendu :**
- Upload réussi
- Extraction automatique du texte
- Chat IA s'ouvre automatiquement
- Le PDF s'affiche dans le lecteur intégré

---

#### **Test 2.3 : Image** 🖼️

1. **Prenez** une image (.jpg ou .png)
2. **Uploadez-la**

**✅ Résultat attendu :**
- Upload réussi
- Image affichée dans la visionneuse
- Si l'image contient du texte visible : OCR automatique (10-30 secondes)
- Chat IA disponible après OCR

**ℹ️ Note :** L'OCR peut être lent, c'est normal.

---

#### **Test 2.4 : Document Word** 📝

1. **Prenez** un fichier .docx
2. **Uploadez-le**

**✅ Résultat attendu :**
- Upload réussi
- Extraction automatique du texte (grâce à mammoth)
- Chat IA s'ouvre avec le contenu extrait
- Message de téléchargement disponible

---

#### **Test 2.5 : Audio** 🎵

1. **Prenez** un fichier .mp3
2. **Uploadez-le**

**✅ Résultat attendu :**
- Upload réussi
- Lecteur audio intégré apparaît
- Possibilité de lire le fichier

---

#### **Test 2.6 : Vidéo** 🎬

1. **Prenez** un petit fichier .mp4 (< 100 MB)
2. **Uploadez-le**

**✅ Résultat attendu :**
- Upload réussi
- Lecteur vidéo intégré apparaît
- Possibilité de regarder la vidéo

---

### **✅ Tests du Chat IA** 🤖

- [ ] **Test 3.1 : Ouverture automatique**
  - Uploadez un PDF
  - ✅ Le chat doit s'ouvrir automatiquement après extraction

- [ ] **Test 3.2 : Questions**
  - Posez une question sur le document
  - ✅ L'IA doit répondre en analysant le contenu

- [ ] **Test 3.3 : Résumé**
  - Cliquez sur "Résumer"
  - ✅ L'IA doit générer un résumé du document

- [ ] **Test 3.4 : Suggestions**
  - Ouvrez le chat
  - ✅ Des suggestions de questions doivent s'afficher
  - Cliquez sur une suggestion
  - ✅ L'IA doit répondre

---

### **✅ Tests de gestion** 📂

- [ ] **Test 4.1 : Créer un dossier**
  - Cliquez sur "+ Nouveau dossier"
  - Nommez-le "Test"
  - ✅ Le dossier doit apparaître

- [ ] **Test 4.2 : Déplacer un document**
  - Uploadez un document
  - Déplacez-le dans le dossier "Test"
  - ✅ Le document doit apparaître dans le dossier

- [ ] **Test 4.3 : Favoris**
  - Cliquez sur l'étoile d'un document
  - ✅ Le document doit être marqué en favori
  - Cliquez sur "Favoris" dans le menu
  - ✅ Le document doit apparaître

- [ ] **Test 4.4 : Recherche**
  - Tapez un mot-clé dans la barre de recherche
  - ✅ Les documents correspondants doivent s'afficher

---

### **✅ Tests de suppression** 🗑️

- [ ] **Test 5.1 : Supprimer un document**
  1. Uploadez un document de test
  2. Notez son nom dans le Storage (ouvrez Supabase → Storage → documents)
  3. Supprimez le document depuis l'application
  4. Retournez dans Supabase Storage
  5. ✅ Le fichier doit avoir disparu automatiquement

- [ ] **Test 5.2 : Supprimer un dossier**
  1. Créez un dossier avec 2 documents dedans
  2. Supprimez le dossier
  3. ✅ Le dossier disparaît
  4. ✅ Les 2 documents restent (à la racine)

- [ ] **Test 5.3 : Vérifier les orphelins**
  1. Allez dans Supabase SQL Editor
  2. Exécutez :
     ```sql
     SELECT cleanup_orphans();
     ```
  3. ✅ Devrait indiquer "0 orphelins"

---

### **✅ Tests de visualisation** 👁️

- [ ] **Test 6.1 : Lecteur PDF**
  - Ouvrez un PDF
  - ✅ Le PDF doit s'afficher en plein écran
  - ✅ Vous devez pouvoir zoomer/scroller

- [ ] **Test 6.2 : Visionneuse TXT**
  - Ouvrez un fichier TXT
  - ✅ Le texte doit s'afficher formaté

- [ ] **Test 6.3 : Visionneuse Images**
  - Ouvrez une image
  - ✅ L'image doit s'afficher en haute résolution

- [ ] **Test 6.4 : Lecteur Vidéo**
  - Ouvrez une vidéo
  - ✅ Le lecteur vidéo doit apparaître
  - ✅ Vous devez pouvoir lire/mettre en pause

- [ ] **Test 6.5 : Lecteur Audio**
  - Ouvrez un fichier audio
  - ✅ Le lecteur audio doit apparaître
  - ✅ Vous devez pouvoir écouter

---

## 🎯 **ORDRE RECOMMANDÉ DES TESTS**

### **Phase 1 : Tests rapides (5 minutes)**
1. ✅ Test connexion (visibilité)
2. ✅ Test upload TXT
3. ✅ Test chat IA sur TXT

### **Phase 2 : Tests complets (15 minutes)**
4. ✅ Test upload PDF
5. ✅ Test upload Image
6. ✅ Test upload DOCX
7. ✅ Test favoris
8. ✅ Test dossiers

### **Phase 3 : Tests avancés (10 minutes)**
9. ✅ Test suppression document + vérif Storage
10. ✅ Test audio/vidéo
11. ✅ Test recherche

---

## 📊 **Tableau de résultats**

Remplissez au fur et à mesure :

| Fonctionnalité | Statut | Notes |
|----------------|--------|-------|
| Connexion visible | ⏳ | |
| Upload TXT | ⏳ | |
| Upload PDF | ⏳ | |
| Upload Image | ⏳ | |
| Upload DOCX | ⏳ | |
| Upload Audio | ⏳ | |
| Upload Vidéo | ⏳ | |
| Chat IA | ⏳ | |
| Résumé IA | ⏳ | |
| Favoris | ⏳ | |
| Dossiers | ⏳ | |
| Recherche | ⏳ | |
| Suppression propre | ⏳ | |

Remplacez ⏳ par :
- ✅ si ça fonctionne
- ❌ si problème (et notez le problème)

---

## 🚨 **En cas de problème**

### **Console du navigateur**

Toujours avoir la console ouverte (F12) pendant les tests :
- Les erreurs apparaissent en rouge
- Les succès apparaissent en vert/bleu
- Les logs expliquent ce qui se passe

### **Logs Supabase**

En cas d'erreur serveur :
- Allez dans Supabase Dashboard
- Section "Logs"
- Cherchez les erreurs récentes

### **Que faire si un test échoue ?**

1. **Notez l'erreur exacte**
2. **Copiez le message** de la console
3. **Faites une capture d'écran**
4. **Dites-moi quel test a échoué**

---

## 🎉 **COMMENCEZ PAR LE TEST LE PLUS SIMPLE !**

### **🎯 Test TXT (2 minutes)**

1. **Créez** test.txt avec du texte
2. **Allez sur** http://localhost:5175/library
3. **Uploadez** le fichier
4. **Observez** ce qui se passe

**C'est parti !** 🚀

---

## 📞 **Support**

Si quelque chose ne fonctionne pas :
- Partagez-moi une capture d'écran
- Copiez-moi l'erreur de la console
- Dites-moi à quelle étape ça bloque

**Je suis là pour vous aider !** 😊

---

**BONNE CHANCE POUR VOS TESTS !** 🎊
