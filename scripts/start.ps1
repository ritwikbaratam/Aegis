$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

Write-Host 'Starting AEGIS at http://localhost:8080' -ForegroundColor Cyan
node backend/src/server.js
