@echo off
echo ========================================
echo  ACTIVATION SERPER - WordCraft AI
echo ========================================
echo.
echo Ajout de la cle Serper dans le fichier .env...
echo.

REM Vérifier si le fichier .env existe
if not exist ".env" (
    echo Le fichier .env n'existe pas. Creation...
    (
        echo # Configuration Supabase (REQUIS^)
        echo VITE_SUPABASE_URL=https://votre-projet.supabase.co
        echo VITE_SUPABASE_ANON_KEY=votre-cle-anon-publique
        echo.
        echo # Configuration OpenAI (REQUIS^)
        echo VITE_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
        echo.
        echo # Configuration Serper - Recherche Web
        echo VITE_SERPER_API_KEY=eed0d5c85a4d83f343f73a446b6596c9f8bfcc47
    ) > .env
    echo.
    echo [OK] Fichier .env cree avec la cle Serper !
) else (
    REM Vérifier si la clé Serper existe déjà
    findstr /C:"VITE_SERPER_API_KEY" .env >nul 2>&1
    if %errorlevel% equ 0 (
        echo.
        echo [INFO] La cle Serper existe deja dans .env
        echo Voulez-vous la mettre a jour ? (O/N^)
        set /p choice="> "
        if /i "%choice%"=="O" (
            REM Créer un fichier temporaire sans la ligne SERPER
            findstr /V /C:"VITE_SERPER_API_KEY" .env > .env.tmp
            REM Ajouter la nouvelle clé
            echo VITE_SERPER_API_KEY=eed0d5c85a4d83f343f73a446b6596c9f8bfcc47 >> .env.tmp
            REM Remplacer le fichier original
            move /Y .env.tmp .env >nul
            echo.
            echo [OK] Cle Serper mise a jour !
        ) else (
            echo.
            echo [INFO] Aucune modification effectuee.
        )
    ) else (
        REM Ajouter la clé Serper au fichier existant
        echo. >> .env
        echo # Configuration Serper - Recherche Web >> .env
        echo VITE_SERPER_API_KEY=eed0d5c85a4d83f343f73a446b6596c9f8bfcc47 >> .env
        echo.
        echo [OK] Cle Serper ajoutee au fichier .env !
    )
)

echo.
echo ========================================
echo  ETAPES SUIVANTES
echo ========================================
echo.
echo 1. Verifiez votre fichier .env
echo 2. Redemarrez l'application :
echo    npm run dev
echo.
echo 3. La recherche web sera automatiquement activee !
echo.
echo Quota gratuit : 2500 recherches/mois
echo Documentation : ACTIVATION_SERPER.md
echo.
pause
