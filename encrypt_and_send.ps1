param(
  [string]$ApiPublicKeyUrl = "https://api-elipse.onrender.com/public-key",
  [string]$ReadApiKey = "",
  [string]$WriteApiKey = "",
  [string]$JsonFile = "",
  [string]$JsonString = "",
  [string]$Endpoint = "https://api-elipse.onrender.com/encrypted",
  [string[]]$Path = @()
)

# Ler JSON
if ($JsonString -and $JsonString.Trim() -ne "") {
  $payloadJson = $JsonString
} elseif ($JsonFile -and (Test-Path $JsonFile)) {
  $payloadJson = Get-Content -Raw -Path $JsonFile
} else {
  Write-Error "Falta JsonFile ou JsonString"
  exit 2
}

# Buscar public key
$headers = @{}
if ($ReadApiKey) { $headers["x-api-key"] = $ReadApiKey }
$publicPem = (Invoke-RestMethod -Uri $ApiPublicKeyUrl -Headers $headers -Method Get -ErrorAction Stop).Trim()

# Importar RSA e gerar AES
Add-Type -AssemblyName System.Security
$rsa = [System.Security.Cryptography.RSA]::Create()
$rsa.ImportFromPem($publicPem.ToCharArray())

# AES key + IV
$aesKey = New-Object 'System.Byte[]' 32
$iv = New-Object 'System.Byte[]' 16
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($aesKey)
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($iv)

# AES encrypt (AES-256-CBC PKCS7)
$aes = [System.Security.Cryptography.Aes]::Create()
$aes.KeySize = 256
$aes.Key = $aesKey
$aes.IV = $iv
$aes.Mode = [System.Security.Cryptography.CipherMode]::CBC
$aes.Padding = [System.Security.Cryptography.PaddingMode]::PKCS7

$encBytes = $null
$plainBytes = [System.Text.Encoding]::UTF8.GetBytes($payloadJson)
$encryptor = $aes.CreateEncryptor()
$ms = New-Object System.IO.MemoryStream
$cs = New-Object System.Security.Cryptography.CryptoStream($ms, $encryptor, [System.Security.Cryptography.CryptoStreamMode]::Write)
$cs.Write($plainBytes, 0, $plainBytes.Length)
$cs.FlushFinalBlock()
$cs.Close()
$encBytes = $ms.ToArray()
$ms.Close()

# RSA-OAEP-SHA256 encrypt AES key
$encryptedKey = $rsa.Encrypt($aesKey, [System.Security.Cryptography.RSAEncryptionPadding]::OaepSHA256)

# Montar corpo
$body = @{
  key = [System.Convert]::ToBase64String($encryptedKey)
  iv  = [System.Convert]::ToBase64String($iv)
  data = [System.Convert]::ToBase64String($encBytes)
  path = $Path
}

$bodyJson = (ConvertTo-Json $body -Depth 10)

# Enviar via POST
$postHeaders = @{ "Content-Type" = "application/json" }
if ($WriteApiKey -and $WriteApiKey.Trim() -ne "") {
  $postHeaders["x-api-key"] = $WriteApiKey
}

try {
  $resp = Invoke-RestMethod -Uri $Endpoint -Method Post -Headers $postHeaders -Body $bodyJson -ErrorAction Stop
  Write-Output (ConvertTo-Json @{ status="ok"; response=$resp } -Depth 5)
  exit 0
} catch {
  Write-Error $_.Exception.Message
  exit 3
}
