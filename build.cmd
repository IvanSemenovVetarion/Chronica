@echo off
setlocal
cd /d "%~dp0"

set "CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if not exist "%CSC%" set "CSC=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe"
if not exist "%CSC%" (
    echo ERROR: C# compiler not found. .NET Framework 4.8 is required.
    exit /b 1
)

set "OUT=dist\Chronica"
set "ZIP=dist\Chronica-portable.zip"
set "SETUP=dist\ChronicaSetup.exe"

taskkill /f /im Chronica.exe >nul 2>nul
taskkill /f /im TitZero.exe >nul 2>nul
taskkill /f /im Mifarium.exe >nul 2>nul

if not exist build mkdir build
if not exist dist mkdir dist
if exist "%OUT%" rmdir /s /q "%OUT%"
if exist "%SETUP%" del /q "%SETUP%"
if exist "%ZIP%" del /q "%ZIP%"

rem Keep the public build focused on classic Chronica.
if exist "dist\ChronicaDnD" rmdir /s /q "dist\ChronicaDnD"
if exist "dist\ChronicaDnDSetup.exe" del /q "dist\ChronicaDnDSetup.exe"
if exist "dist\ChronicaDnD-portable.zip" del /q "dist\ChronicaDnD-portable.zip"
if exist "dist\TitZero" rmdir /s /q "dist\TitZero"
if exist "dist\TitZeroSetup.exe" del /q "dist\TitZeroSetup.exe"
if exist "dist\TitZero-portable.zip" del /q "dist\TitZero-portable.zip"
if exist "dist\Mifarium" rmdir /s /q "dist\Mifarium"
if exist "dist\MifariumSetup.exe" del /q "dist\MifariumSetup.exe"
if exist "dist\Mifarium-portable.zip" del /q "dist\Mifarium-portable.zip"
mkdir "%OUT%"

echo [1/7] Packing interface...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Add-Type -AssemblyName System.IO.Compression.FileSystem; if (Test-Path 'build\ChronicaUi.zip') { Remove-Item 'build\ChronicaUi.zip' -Force }; [IO.Compression.ZipFile]::CreateFromDirectory((Join-Path (Get-Location) 'ui'), (Join-Path (Get-Location) 'build\ChronicaUi.zip'), [IO.Compression.CompressionLevel]::Optimal, $false)"
if errorlevel 1 (
    echo ERROR: could not pack ui folder.
    exit /b 1
)

echo [2/7] Compiling Chronica.exe...
"%CSC%" /nologo /codepage:65001 /target:winexe /platform:x64 /optimize+ ^
    /out:"%OUT%\Chronica.exe" ^
    /win32icon:app.ico ^
    /win32manifest:app.manifest ^
    /resource:"build\ChronicaUi.zip",ui.zip ^
    /r:System.dll ^
    /r:System.Core.dll ^
    /r:System.Drawing.dll ^
    /r:System.Windows.Forms.dll ^
    /r:System.Web.Extensions.dll ^
    /r:System.IO.Compression.dll ^
    /r:System.IO.Compression.FileSystem.dll ^
    /r:System.Security.dll ^
    /r:"vendor\Microsoft.Web.WebView2.Core.dll" ^
    /r:"vendor\Microsoft.Web.WebView2.WinForms.dll" ^
    src\Program.cs ^
    src\AssemblyInfo.cs ^
    src\AppStorage.cs ^
    src\UiAssets.cs ^
    src\Bridge.cs ^
    src\DeepSeekClient.cs ^
    src\WorldExporter.cs ^
    src\UpdateService.cs ^
    src\MainForm.cs

if errorlevel 1 (
    echo.
    echo BUILD FAILED
    exit /b 1
)

echo [3/7] Copying runtime components...
copy /y "vendor\WebView2Loader.dll" "%OUT%\WebView2Loader.dll" >nul
copy /y "vendor\Microsoft.Web.WebView2.Core.dll" "%OUT%\Microsoft.Web.WebView2.Core.dll" >nul
copy /y "vendor\Microsoft.Web.WebView2.WinForms.dll" "%OUT%\Microsoft.Web.WebView2.WinForms.dll" >nul
if exist README.txt copy /y README.txt "%OUT%\README.txt" >nul
if exist LICENSE copy /y LICENSE "%OUT%\LICENSE" >nul
if exist THIRD_PARTY_NOTICES.md copy /y THIRD_PARTY_NOTICES.md "%OUT%\THIRD_PARTY_NOTICES.md" >nul
if exist TRADEMARKS.md copy /y TRADEMARKS.md "%OUT%\TRADEMARKS.md" >nul
if exist licenses xcopy /E /I /Y licenses "%OUT%\licenses" >nul

echo [4/7] Building uninstaller...
"%CSC%" /nologo /codepage:65001 /target:winexe /platform:x64 /optimize+ ^
    /out:"%OUT%\Uninstall.exe" ^
    /win32icon:app.ico ^
    /win32manifest:app.manifest ^
    /r:System.dll ^
    /r:System.Windows.Forms.dll ^
    installer\Uninstall.cs
if errorlevel 1 (
    echo BUILD FAILED: uninstaller
    exit /b 1
)

echo [5/7] Packing installation payload...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Add-Type -AssemblyName System.IO.Compression.FileSystem; if (Test-Path 'build\ChronicaPayload.zip') { Remove-Item 'build\ChronicaPayload.zip' -Force }; [IO.Compression.ZipFile]::CreateFromDirectory((Join-Path (Get-Location) '%OUT%'), (Join-Path (Get-Location) 'build\ChronicaPayload.zip'), [IO.Compression.CompressionLevel]::Optimal, $false)"
if errorlevel 1 (
    echo ERROR: could not create installation payload.
    exit /b 1
)

echo [6/7] Building installer...
"%CSC%" /nologo /codepage:65001 /target:winexe /platform:x64 /optimize+ ^
    /out:"%SETUP%" ^
    /win32icon:app.ico ^
    /win32manifest:app.manifest ^
    /resource:"build\ChronicaPayload.zip",payload.zip ^
    /r:System.dll ^
    /r:System.Core.dll ^
    /r:System.Drawing.dll ^
    /r:System.Windows.Forms.dll ^
    /r:System.IO.Compression.dll ^
    /r:System.IO.Compression.FileSystem.dll ^
    installer\Setup.cs
if errorlevel 1 (
    echo BUILD FAILED: installer
    exit /b 1
)

echo [7/7] Packing portable archive...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "if (Test-Path '%ZIP%') { Remove-Item '%ZIP%' -Force }; $files = @('%OUT%\Chronica.exe','%OUT%\WebView2Loader.dll','%OUT%\Microsoft.Web.WebView2.Core.dll','%OUT%\Microsoft.Web.WebView2.WinForms.dll','%OUT%\README.txt','%OUT%\LICENSE','%OUT%\THIRD_PARTY_NOTICES.md','%OUT%\TRADEMARKS.md','%OUT%\licenses'); Compress-Archive -Path $files -DestinationPath '%ZIP%' -CompressionLevel Optimal -Force"
if errorlevel 1 (
    echo WARNING: portable archive was not created.
)

if not exist "%OUT%\Chronica.exe" (
    echo ERROR: application missing.
    exit /b 1
)
if not exist "%SETUP%" (
    echo ERROR: installer missing.
    exit /b 1
)
if not exist "%OUT%\LICENSE" (
    echo ERROR: LICENSE is missing from the application folder.
    exit /b 1
)
if exist "%OUT%\ChronicaData" (
    echo ERROR: ChronicaData must not be shipped in dist.
    exit /b 1
)
if exist "%OUT%\ChronicaDnDData" (
    echo ERROR: ChronicaDnDData must not be shipped in dist.
    exit /b 1
)

echo.
echo BUILD OK: %OUT%\Chronica.exe
echo INSTALLER: %SETUP%
echo PORTABLE: %ZIP%
exit /b 0
