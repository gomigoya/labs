param([int]$Port=4173)
$env:TEMP='D:\CodexWork\Temp'
$env:TMP='D:\CodexWork\Temp'
Set-Location -LiteralPath $PSScriptRoot
node (Join-Path $PSScriptRoot 'serve.mjs') $Port
