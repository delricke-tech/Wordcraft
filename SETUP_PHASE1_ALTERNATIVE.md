# 🚀 SETUP PHASE 1 - ALTERNATIVE SANS CARTE BANCAIRE
## **Solutions gratuites pour Audio Overview et Citations RAG**

**Date :** 10 mars 2026  
**Objectif :** Implémenter les 3 Game Changers sans frais supplémentaires

---

## 🎯 ALTERNATIVES SANS CARTE BANCAIRE

### **🔊 Audio Overview - OpenAI TTS (RECOMMANDÉ)**
- **Coût :** Inclus dans votre abonnement OpenAI actuel
- **Voix françaises :** nova, alloy, echo, fable, onyx, shimmer
- **Qualité :** Très naturelle et professionnelle
- **Avantages :**
  - ✅ Pas de nouvelle inscription
  - ✅ Utilise votre clé OpenAI existante
  - ✅ Facturation unique (OpenAI)
  - ✅ API simple et rapide

### **🧠 Embeddings - OpenAI Embeddings (GRATUIT)**
- **Coût :** Inclus dans votre abonnement OpenAI actuel
- **Modèle :** text-embedding-3-small/large
- **Dimension :** 1536 (excellent pour RAG)
- **Avantages :**
  - ✅ Pas de nouvelle inscription
  - ✅ Compatible avec votre code existant
  - ✅ Très haute qualité
  - ✅ Intégration immédiate

---

## 📋 DÉPENDANCES SIMPLIFIÉES

```bash
npm install mammoth pptx2json
```

### **Plus besoin de :**
- ❌ Voyage AI (remplacé par OpenAI Embeddings)
- ❌ Google Cloud TTS (remplacé par OpenAI TTS)
- ✅ OpenAI (déjà configuré)
- ✅ mammoth (pour DOCX)
- ✅ pptx2json (pour PPTX)

---

## 🔧 VARIABLES D'ENVIRONNEMENT

Ajouter dans `.env.local` :

```bash
# OpenAI Embeddings (déjà existant)
VITE_OPENAI_API_KEY=sk-votre-clé-existante
VITE_EMBEDDING_MODEL=text-embedding-3-small
VITE_EMBEDDING_DIMENSION=1536

# OpenAI TTS (nouveau)
VITE_TTS_MODEL=tts-1-hd
VITE_TTS_VOICE=nova
VITE_TTS_SPEED=1.0
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
    embedding vector(1536), -- Dimension OpenAI
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
    page_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🎯 PLAN D'ACTION SIMPLIFIÉ

### **AUJOURD'HUI (Jour 1)**
1. **Installer dépendances** (2 minutes)
2. **Configurer variables environnement** (3 minutes)
3. **Activer pgvector Supabase** (2 minutes)
4. **Créer tables embeddings** (5 minutes)

### **DEMAIN (Jour 2)**
Commencer l'implémentation de **#24 Citations RAG**

### **JOURS 3-4**
Implémenter **#3 Support DOCX** et **#30 Audio Overview**

---

## ✅ CHECKLIST DE VALIDATION

- [ ] Dépendances installées (mammoth, pptx2json)
- [ ] Variables OpenAI configurées
- [ ] pgvector activé dans Supabase
- [ ] Tables embeddings créées
- [ ] Index vectoriels créés

---

## 🚀 AVANTAGES DE CETTE APPROCHE

### **Économiques :**
- 💰 **0$ supplémentaire** pour les APIs
- 💰 **Utilise votre abonnement OpenAI existant**
- 💰 **Pas de frais mensuels additionnels**

### **Techniques :**
- 🔧 **Intégration simplifiée** (un seul fournisseur)
- 🔧 **Code unifié** pour embeddings et TTS
- 🔧 **Maintenance facilitée**

### **Pratiques :**
- ⚡ **Déploiement plus rapide**
- 📊 **Monitoring unifié**
- 🔐 **Sécurité centralisée**

---

## 🎉 RÉSULTAT FINAL

Avec cette alternative :
- ✅ **Mêmes fonctionnalités** que la version payante
- ✅ **Coût zéro** supplémentaire
- ✅ **Setup en 15 minutes**
- ✅ **Qualité équivalente** (voire supérieure)

**WordCraft IA sera tout aussi puissant sans frais additionnels !** 🚀

---

*Prêt à commencer avec OpenAI TTS et Embeddings ?*
