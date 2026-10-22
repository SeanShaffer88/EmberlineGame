param(
 [Parameter(Mandatory=$true)][string]$JdkHome,
 [Parameter(Mandatory=$true)][string]$AndroidJar,
 [Parameter(Mandatory=$true)][string]$BuildTools,
 [Parameter(Mandatory=$true)][string]$KeyStore,
 [string]$KeyAlias = 'frostline'
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$projectRoot = Split-Path -Parent $PSScriptRoot
$buildRoot = Join-Path $projectRoot 'build'
$stageRoot = Join-Path $buildRoot ('stage-' + [Guid]::NewGuid().ToString('N'))
$env:JAVA_HOME = $JdkHome
$env:PATH = (Join-Path $JdkHome 'bin') + ';' + $env:PATH
foreach ($required in @($AndroidJar,$KeyStore,(Join-Path $JdkHome 'bin/javac.exe'),(Join-Path $BuildTools 'aapt2.exe'))) { if (!(Test-Path -LiteralPath $required)) { throw "Missing build input: $required" } }
if (!$env:EMBERLINE_STORE_PASS) { throw 'Set EMBERLINE_STORE_PASS in the process environment before building.' }
foreach ($dir in @($buildRoot,$stageRoot,(Join-Path $stageRoot 'classes'),(Join-Path $stageRoot 'dex'),(Join-Path $stageRoot 'generated'))) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
function Run-Checked([string]$Program,[string[]]$Arguments) { & $Program @Arguments; if ($LASTEXITCODE -ne 0) { throw "Build tool failed: $Program (exit $LASTEXITCODE)" } }
Run-Checked (Join-Path $BuildTools 'aapt2.exe') @('compile','--dir',(Join-Path $projectRoot 'android/res'),'-o',(Join-Path $stageRoot 'resources.zip'))
Run-Checked (Join-Path $BuildTools 'aapt2.exe') @('link','-o',(Join-Path $stageRoot 'base.apk'),'-I',$AndroidJar,'--manifest',(Join-Path $projectRoot 'android/AndroidManifest.xml'),'-A',(Join-Path $projectRoot 'web'),'--java',(Join-Path $stageRoot 'generated'),(Join-Path $stageRoot 'resources.zip'))
$sourceFiles = @(Get-ChildItem -LiteralPath (Join-Path $projectRoot 'android/src'),(Join-Path $stageRoot 'generated') -Filter '*.java' -Recurse | ForEach-Object FullName)
Run-Checked (Join-Path $JdkHome 'bin/javac.exe') (@('-encoding','UTF-8','-source','8','-target','8','-classpath',$AndroidJar,'-d',(Join-Path $stageRoot 'classes')) + $sourceFiles)
$classFiles = @(Get-ChildItem -LiteralPath (Join-Path $stageRoot 'classes') -Filter '*.class' -Recurse | ForEach-Object FullName)
Run-Checked (Join-Path $BuildTools 'd8.bat') (@('--release','--min-api','29','--lib',$AndroidJar,'--output',(Join-Path $stageRoot 'dex')) + $classFiles)
Run-Checked (Join-Path $JdkHome 'bin/jar.exe') @('uf',(Join-Path $stageRoot 'base.apk'),'-C',(Join-Path $stageRoot 'dex'),'classes.dex')
Run-Checked (Join-Path $BuildTools 'zipalign.exe') @('-f','-P','16','4',(Join-Path $stageRoot 'base.apk'),(Join-Path $stageRoot 'aligned.apk'))
$apk = Join-Path $buildRoot 'Emberline-0.1.0.apk'
Run-Checked (Join-Path $BuildTools 'apksigner.bat') @('sign','--ks',$KeyStore,'--ks-key-alias',$KeyAlias,'--ks-pass','env:EMBERLINE_STORE_PASS','--out',$apk,(Join-Path $stageRoot 'aligned.apk'))
Run-Checked (Join-Path $BuildTools 'apksigner.bat') @('verify','--verbose','--print-certs',$apk)
Run-Checked (Join-Path $BuildTools 'zipalign.exe') @('-c','-P','16','4',$apk)
Get-FileHash -LiteralPath $apk -Algorithm SHA256 | Format-List
