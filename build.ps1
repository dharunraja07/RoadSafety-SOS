Set-Location $PSScriptRoot
npm install 2>&1 | Out-File -FilePath install.log -Encoding utf8
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run build 2>&1 | Out-File -FilePath build.log -Encoding utf8
exit $LASTEXITCODE
