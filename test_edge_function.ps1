# Script de Test Edge Function - Validation SMS
# Date: 6 janvier 2025

Write-Host "Test de l'Edge Function validate-transaction" -ForegroundColor Cyan
Write-Host ""

$url = "https://uexuecubafgfhpfebknt.supabase.co/functions/v1/validate-transaction"
$body = @{
    message = "Paiement confirme. Montant: 5000 FCFA. Ref: 123456789"
    from = "MoovMoney"
    auth_key = "Kj9mP2xR5wN8tL4vC6bQ1zX7hG3fY0sA"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "Envoi de la requete..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
    
    Write-Host "SUCCES !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Reponse:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
    
    if ($response.success -eq $true) {
        Write-Host "Le paiement a ete valide avec succes !" -ForegroundColor Green
        Write-Host "Montant: $($response.amount) FCFA" -ForegroundColor Green
        Write-Host "TID: $($response.tid)" -ForegroundColor Green
        Write-Host "User ID: $($response.user_id)" -ForegroundColor Green
        Write-Host "Abonnement: $($response.subscription.type) jusqu'au $($response.subscription.expires_at)" -ForegroundColor Green
    } else {
        Write-Host "Erreur: $($response.error)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "ERREUR !" -ForegroundColor Red
    Write-Host ""
    Write-Host "Details:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message
    Write-Host ""
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Reponse du serveur:" -ForegroundColor Yellow
        Write-Host $responseBody
    }
}

Write-Host ""
Write-Host "Press Enter to exit..."
Read-Host
