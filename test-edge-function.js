// Test simple pour vérifier l'Edge Function generate-quiz
// À exécuter dans la console du navigateur (F12)

async function testerEdgeFunction() {
  console.log('🧪 Test de l\'Edge Function generate-quiz...');
  
  try {
    // Récupérer le token d'authentification
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('❌ Vous n\'êtes pas connecté !');
      return;
    }
    
    console.log('✅ Authentifié');
    
    // Appeler l'Edge Function
    const { data, error } = await supabase.functions.invoke('generate-quiz', {
      body: {
        text: 'La photosynthèse est le processus par lequel les plantes vertes transforment l\'énergie lumineuse en énergie chimique.',
        documentName: 'Test Photosynthèse',
        questionCount: 2
      },
    });
    
    if (error) {
      console.error('❌ Erreur retournée par l\'Edge Function:');
      console.error('Message:', error.message);
      console.error('Détails:', error);
      
      // Si l'erreur contient des détails, les afficher
      if (error.context?.body) {
        try {
          const errorDetails = JSON.parse(error.context.body);
          console.error('📋 Détails de l\'erreur:');
          console.error(errorDetails);
        } catch (e) {
          console.error('Body brut:', error.context.body);
        }
      }
      
      return;
    }
    
    console.log('✅ Edge Function a répondu avec succès !');
    console.log('📋 Données reçues:', data);
    console.log('📊 Nombre de questions générées:', data.questions?.length || 0);
    
  } catch (err) {
    console.error('❌ Erreur JavaScript:', err);
  }
}

// Exécuter le test
testerEdgeFunction();
