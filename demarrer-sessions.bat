@echo off
chcp 65001 >nul
echo.
echo ============================================
echo 🚀 DÉMARRAGE WORDCRAFT - VOLET SESSIONS
echo ============================================
echo.

REM Vérifier que Node.js est installé
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js n'est pas installé !
    echo.
    echo 📥 Téléchargez Node.js depuis : https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Vérifier que npm est installé
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm n'est pas installé !
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js et npm détectés
echo.

REM Vérifier que le fichier .env existe
if not exist ".env" (
    echo ⚠️  ATTENTION : Le fichier .env n'existe pas !
    echo.
    echo 📝 Créez un fichier .env avec vos clés Supabase :
    echo.
    echo VITE_SUPABASE_URL=https://votre-projet.supabase.co
    echo VITE_SUPABASE_ANON_KEY=votre_cle_anon
    echo.
    echo 📖 Consultez INSTALLATION_RAPIDE_SESSIONS.md pour plus d'aide
    echo.
    pause
)

REM Vérifier que node_modules existe
if not exist "node_modules" (
    echo 📦 Installation des dépendances...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Erreur lors de l'installation des dépendances
        pause
        exit /b 1
    )
    echo.
    echo ✅ Dépendances installées
    echo.
)

echo ============================================
echo 🎯 AVANT DE CONTINUER
echo ============================================
echo.
echo Avez-vous exécuté les scripts SQL dans Supabase ?
echo.
echo 1️⃣  FIX_RLS_SESSIONS_RECURSION.sql
echo 2️⃣  CREATE_SESSION_FUNCTIONS.sql
echo.
echo Si NON, ouvrez Supabase Dashboard et exécutez-les !
echo 📖 Voir INSTALLATION_RAPIDE_SESSIONS.md
echo.
pause

echo.
echo ============================================
echo 🚀 DÉMARRAGE DE L'APPLICATION
echo ============================================
echo.
echo L'application va démarrer sur : http://localhost:5173
echo.
echo Pour tester le volet Sessions :
echo   1. Se connecter
echo   2. Aller dans "Sessions"
echo   3. Créer une session
echo   4. Rejoindre la session
echo.
echo ⚠️  La vidéo/audio nécessite Daily.co (optionnel)
echo 📖 Voir CLES_API_ET_OUTILS.md pour configurer
echo.
echo Appuyez sur Ctrl+C pour arrêter le serveur
echo.
pause

call npm run dev
