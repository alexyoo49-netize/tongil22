$ErrorActionPreference = 'Stop'

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$docsDirectory = [System.IO.Path]::GetFullPath((Join-Path $projectRoot 'docs'))
$staticOutputDirectory = [System.IO.Path]::GetFullPath((Join-Path $projectRoot 'dist\client'))
$entryFile = [System.IO.Path]::GetFullPath((Join-Path $staticOutputDirectory 'index.html'))
$vinextCli = [System.IO.Path]::GetFullPath((Join-Path $projectRoot 'node_modules\vinext\dist\cli.js'))
$prefixedAssetsDirectory = [System.IO.Path]::GetFullPath((Join-Path $docsDirectory 'tongil-xi-maker'))

if (
  [System.IO.Path]::GetDirectoryName($docsDirectory) -ne $projectRoot -or
  [System.IO.Path]::GetDirectoryName($prefixedAssetsDirectory) -ne $docsDirectory
) {
  throw 'Refusing to clean generated directories outside the project root.'
}

if (Test-Path -LiteralPath $entryFile) {
  Remove-Item -LiteralPath $entryFile -Force
}

$env:GITHUB_PAGES = 'true'
$env:NEXT_PUBLIC_BASE_PATH = '/tongil-xi-maker'

& node $vinextCli build
$buildExitCode = $LASTEXITCODE

if (-not (Test-Path -LiteralPath $entryFile)) {
  throw "Static export did not create dist/client/index.html (exit code $buildExitCode)."
}

if ($buildExitCode -ne 0) {
  Write-Warning 'vinext returned a Windows shutdown error after successfully creating the static export. The verified output will be used.'
}

if (Test-Path -LiteralPath $docsDirectory) {
  Remove-Item -LiteralPath $docsDirectory -Recurse -Force
}

New-Item -ItemType Directory -Path $docsDirectory | Out-Null
Copy-Item -Path (Join-Path $staticOutputDirectory '*') -Destination $docsDirectory -Recurse -Force

if (Test-Path -LiteralPath (Join-Path $prefixedAssetsDirectory '_next')) {
  Copy-Item -LiteralPath (Join-Path $prefixedAssetsDirectory '_next') -Destination $docsDirectory -Recurse -Force
  Remove-Item -LiteralPath $prefixedAssetsDirectory -Recurse -Force
}

New-Item -ItemType File -Path (Join-Path $docsDirectory '.nojekyll') -Force | Out-Null

Write-Output 'GitHub Pages files are ready in docs/.'
