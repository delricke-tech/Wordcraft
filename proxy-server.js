// proxy-server.js
// Proxy local pour contourner les restrictions CORS de Supabase Storage
// Utiliser seulement si les solutions de configuration CORS ne fonctionnent pas

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// CORS : Autoriser toutes les origines (développement uniquement)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Créer le client Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.error('❌ ERREUR: Variables d\'environnement manquantes');
  console.error('   Assurez-vous que .env contient :');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('🔧 Configuration Proxy:');
console.log('  - Supabase URL:', process.env.VITE_SUPABASE_URL);
console.log('  - Bucket cible: documents');

// Route pour télécharger un fichier depuis Supabase Storage
app.get('/download/:path(*)', async (req, res) => {
  try {
    const filePath = req.params.path;
    console.log('📥 Téléchargement via proxy:', filePath);

    // IMPORTANT: Utilise le storage_path (nettoyé) pour télécharger
    const { data, error } = await supabase.storage
      .from('documents')
      .download(filePath);

    if (error) {
      console.error('❌ Erreur Supabase:', error.message);
      return res.status(500).json({ 
        error: error.message,
        path: filePath 
      });
    }

    if (!data) {
      console.error('❌ Aucune donnée retournée');
      return res.status(404).json({ 
        error: 'Fichier introuvable',
        path: filePath 
      });
    }

    console.log('✅ Fichier téléchargé:', data.size, 'bytes');

    // Convertir le Blob en Buffer pour l'envoyer
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Headers appropriés pour PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Content-Disposition', `inline; filename="${filePath}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.send(buffer);
    console.log('✅ Fichier envoyé au client');

  } catch (error) {
    console.error('💥 Erreur inattendue:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: error.message 
    });
  }
});

// Route de santé pour vérifier que le proxy fonctionne
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Proxy Supabase Storage actif',
    timestamp: new Date().toISOString()
  });
});

// Route pour lister les fichiers (utile pour déboguer)
app.get('/list', async (req, res) => {
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .list();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ 
      files: data,
      count: data?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PROXY_PORT || 3001;

app.listen(PORT, () => {
  console.log('\n✅ ========================================');
  console.log('   Proxy Supabase Storage ACTIF');
  console.log('========================================');
  console.log(`🌐 Serveur : http://localhost:${PORT}`);
  console.log(`🏥 Health   : http://localhost:${PORT}/health`);
  console.log(`📂 List     : http://localhost:${PORT}/list`);
  console.log(`📥 Download : http://localhost:${PORT}/download/[path]`);
  console.log('========================================\n');
  console.log('💡 Utilisation dans openaiService.ts:');
  console.log(`   const response = await fetch('http://localhost:${PORT}/download/' + storagePath);`);
  console.log('   const blob = await response.blob();\n');
  console.log('⚠️  Appuyez sur Ctrl+C pour arrêter\n');
});

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('\n\n👋 Arrêt du proxy...');
  process.exit(0);
});

