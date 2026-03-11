# 🚀 SETUP PHASE 1 - GAME CHANGERS
## **Préparation de l'environnement pour les 3 features critiques**

**Date :** 7 mars 2026  
**Objectif :** Configurer Voyage AI + Google Cloud TTS pour Citations RAG et Audio Overview

---

## 📋 COMPTES À CRÉER

### **1. Voyage AI (Embeddings vectoriels)**
- **URL :** https://voyageai.com
- **Objectif :** Générer des embeddings pour citations RAG
- **Prix :** $0.0001/1K tokens (très économique)
- **Actions :**
  1. Créer un compte gratuit
  2. Obtenir la clé API : `pa-xxxxxxxxxxxxx`
  3. Ajouter dans `.env.local`

### **2. Google Cloud Text-to-Speech**
- **URL :** https://console.cloud.google.com
- **Objectif :** Générer l'Audio Overview (Podcast 2 voix)
- **Prix :** $4/1M caractères (généreux quota gratuit)
- **Actions :**
  1. Créer un nouveau projet
  2. Activer "Cloud Text-to-Speech API"
  3. Créer une clé API : `AIzaSyxxxxxxxxxxxxx`
  4. Ajouter dans `.env.local`

---

## 🔧 DÉPENDANCES À INSTALLER

```bash
npm install voyageai @google-cloud/text-to-speech mammoth pptx2json
```

### **Détails des dépendances :**
- **voyageai** : Embeddings vectoriels de haute qualité
- **@google-cloud/text-to-speech** : Synthèse vocale Google
- **mammoth** : Extraction texte DOCX
- **pptx2json** : Extraction PowerPoint

---

## 📁 VARIABLES D'ENVIRONNEMENT

Ajouter dans `.env.local` :

```bash
# Voyage AI - Embeddings vectoriels
VITE_VOYAGE_API_KEY=pa-xxxxxxxxxxxxx

# Google Cloud - Text-to-Speech
VITE_GOOGLE_CLOUD_PROJECT_ID=votre-projet-id
VITE_GOOGLE_CLOUD_KEY_FILE=path/to/service-account-key.json
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json

# Configuration embeddings
VITE_EMBEDDING_MODEL=voyage-large-2-instruct
VITE_EMBEDDING_DIMENSION=1024
```

---

## 🗄️ CONFIGURATION SUPABASE

### **Activer pgvector**
```sql
-- Exécuter dans Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

### **Créer tables pour embeddings**
```sql
-- Table pour les chunks de documents avec embeddings
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1024),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index vectoriel pour recherche rapide
CREATE INDEX idx_document_chunks_embedding ON document_chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Table pour les citations
CREATE TABLE document_citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES document_chunks(id) ON DELETE CASCADE,
    text_snippet TEXT NOT NULL,
    relevance_score FLOAT DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🎯 PLAN D'ACTION IMMÉDIAT

### **AUJOURD'HUI (Jour 1)**
1. **Créer compte Voyage AI** (5 minutes)
2. **Créer projet Google Cloud** (10 minutes)
3. **Activer Text-to-Speech API** (2 minutes)
4. **Installer dépendances** (2 minutes)
5. **Configurer variables environnement** (5 minutes)
6. **Activer pgvector Supabase** (2 minutes)

### **DEMAIN (Jour 2)**
Commencer l'implémentation de **#24 Citations RAG**

---

## ✅ CHECKLIST DE VALIDATION

- [ ] Compte Voyage AI créé et clé API obtenue
- [ ] Projet Google Cloud créé
- [ ] Cloud Text-to-Speech API activée
- [ ] Clé API Google Cloud obtenue
- [ ] Dépendances installées sans erreur
- [ ] Variables d'environnement configurées
- [ ] pgvector activé dans Supabase
- [ ] Tables embeddings créées
- [ ] Index vectoriels créés

---

## 🚀 PROCHAINE ÉTAPE

Une fois le setup terminé, on commence :

1. **#24 Citations RAG** (3 jours)
2. **#3 Support DOCX** (2 jours)  
3. **#30 Audio Overview** (5 jours)

**Total Phase 1 : 10 jours pour 3 Game Changers !**

---

*Dites-moi "Setup terminé" quand vous aurez complété ces étapes et je commence l'implémentation du #24 Citations RAG.*
