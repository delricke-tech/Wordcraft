# 🚀 DÉMARRAGE RAPIDE - Tests Finaux

## ⚡ **Vous êtes PRÊT ! Commencez vos tests maintenant !**

---

## 🎯 **URL de l'application**

👉 **http://localhost:5175/**

---

## 📋 **TEST #1 : Fichier texte (2 minutes)** ⚡

**Le test le plus simple pour commencer !**

### **Étape A : Créer le fichier**
1. **Clic droit** sur votre bureau
2. **Nouveau** → **Document texte**
3. **Nommez-le** : `mon-test.txt`
4. **Ouvrez-le** et écrivez :
   ```
   Ceci est un test pour WordCraft.
   
   L'intelligence artificielle va analyser ce texte.
   
   Question : Que fait WordCraft ?
   Réponse : WordCraft est une plateforme d'apprentissage avec IA.
   ```
5. **Sauvegardez** et fermez

### **Étape B : Uploader**
1. **Ouvrez** http://localhost:5175/library
2. **Cliquez sur** "Ajouter documents" (bouton violet-bleu)
3. **Sélectionnez** votre fichier `mon-test.txt`
4. **Attendez** 2-3 secondes

### **Étape C : Vérifier**

**✅ Ce qui DOIT se passer :**
1. Upload réussi
2. Message "IA prête pour vos questions !"
3. Le fichier apparaît dans votre bibliothèque

### **Étape D : Tester le Chat IA**
1. **Cliquez** sur le fichier `mon-test.txt`
2. **Le texte s'affiche** formaté
3. **Le chat IA s'ouvre automatiquement** (bulle violette à droite)
4. **Tapez** : "Que fait WordCraft ?"
5. **Envoyez**

**✅ L'IA doit répondre** en analysant le texte que vous avez écrit !

---

## 📸 **Que vérifier dans la console (F12)**

Appuyez sur **F12** pour ouvrir la console pendant les tests.

### **Messages attendus (en vert) :**
```
✅ Fichier uploadé avec succès
✅ Document enregistré en BDD
✅ Texte extrait: X mots
✅ Texte sauvegardé en BDD
✅ IA prête pour vos questions !
```

### **Si vous voyez des erreurs (en rouge) :**
- ❌ Copiez le message d'erreur
- ❌ Faites une capture d'écran
- ❌ Dites-moi ce qui ne fonctionne pas

---

## 📋 **TEST #2 : Vérifier la suppression propre (3 minutes)**

### **Étape A : Noter le fichier dans Storage**
1. **Ouvrez** Supabase Dashboard
2. **Allez dans** Storage → documents
3. **Cherchez** votre fichier `mon-test.txt` (il devrait avoir un nom comme `1735689123-abc123-mon-test.txt`)
4. **Notez** qu'il est bien là ✅

### **Étape B : Supprimer depuis l'application**
1. **Retournez** dans votre application
2. **Dans la bibliothèque**, trouvez votre document
3. **Clic droit** ou **3 points** → **Supprimer**
4. **Confirmez** la suppression

### **Étape C : Vérifier dans Storage**
1. **Retournez** dans Supabase Storage
2. **Rafraîchissez** la page
3. **Cherchez** le fichier

**✅ Le fichier doit avoir DISPARU automatiquement !**

---

## 🎊 **Si le TEST #1 fonctionne...**

**BRAVO ! Votre application est opérationnelle !** 🎉

Vous pouvez maintenant tester :
- ✅ Upload de PDF
- ✅ Upload d'images
- ✅ Upload de DOCX
- ✅ Upload d'audio/vidéo
- ✅ Création de dossiers
- ✅ Favoris
- ✅ Recherche

**Consultez** `TESTS_FINAUX_GUIDE.md` pour tous les tests détaillés.

---

## 🆘 **Si quelque chose ne fonctionne pas...**

### **Checklist de dépannage :**

1. **Le serveur tourne-t-il ?**
   - Vérifiez le terminal
   - Vous devez voir "VITE ready in..."
   - URL : http://localhost:5175/

2. **Êtes-vous connecté ?**
   - Si non, connectez-vous
   - Email : votre email
   - Password : votre mot de passe

3. **La console a-t-elle des erreurs ?**
   - Ouvrez F12
   - Onglet Console
   - Cherchez les messages rouges

4. **Supabase est-il bien configuré ?**
   - Vérifiez que vous avez exécuté les 4 scripts SQL :
     - ✅ FIX_DOCUMENTS_SAFE.sql
     - ✅ CONFIG_STORAGE.sql
     - ✅ CLEANUP_ORPHANS_FIRST.sql
     - ✅ SUPABASE_AUTO_CLEANUP.sql

---

## 📞 **Aide rapide**

### **Problème : "Impossible d'uploader"**
→ Vérifiez que CONFIG_STORAGE.sql a été exécuté

### **Problème : "Chat IA ne s'ouvre pas"**
→ Fermez et rouvrez le document

### **Problème : "Extraction échoue"**
→ Vérifiez la console (F12) pour voir l'erreur exacte

### **Problème : "Fichier pas supprimé du Storage"**
→ Vérifiez que SUPABASE_AUTO_CLEANUP.sql a été exécuté

---

## 🎯 **RÉSUMÉ ULTRA-RAPIDE**

### **✅ Scripts exécutés :**
- [x] FIX_DOCUMENTS_SAFE.sql
- [x] CONFIG_STORAGE.sql
- [x] CLEANUP_ORPHANS_FIRST.sql
- [x] SUPABASE_AUTO_CLEANUP.sql

### **✅ Packages installés :**
- [x] mammoth (DOCX)
- [x] tesseract.js (OCR)

### **✅ Serveur :**
- [x] Démarré sur port 5175

### **⏳ À faire :**
- [ ] Tester upload TXT
- [ ] Tester chat IA
- [ ] Tester suppression propre

---

## 🚀 **ALLEZ-Y ! COMMENCEZ LE TEST #1 !**

1. **Créez** `mon-test.txt`
2. **Allez sur** http://localhost:5175/library
3. **Uploadez** le fichier
4. **Observez** ce qui se passe

**Dites-moi comment ça se passe !** 😊

---

**Date** : 31 décembre 2024  
**Prêt pour** : Tests complets  
**État** : ✅ **OPÉRATIONNEL**
