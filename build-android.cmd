@echo off
setlocal
cd /d "%~dp0"

if not defined JAVA_HOME (
  if exist "%ProgramFiles%\Eclipse Adoptium\jdk-17.0.21.10002-hotspot\bin\java.exe" (
    set "JAVA_HOME=%ProgramFiles%\Eclipse Adoptium\jdk-17.0.21.10002-hotspot"
  )
)
if not defined JAVA_HOME (
  echo ERROR: JDK 17 not found. Set JAVA_HOME to a JDK 17 installation.
  exit /b 1
)
if not defined ANDROID_HOME (
  if exist "C:\Android\sdk\platform-tools\adb.exe" set "ANDROID_HOME=C:\Android\sdk"
)
if not defined ANDROID_HOME (
  echo ERROR: Android SDK not found. Set ANDROID_HOME to the Android SDK folder.
  exit /b 1
)

echo [1/3] Building Android APK...
cd android
if not exist local.properties (
  echo sdk.dir=%ANDROID_HOME:\=\\%> local.properties
)
call gradlew.bat assembleDebug --no-daemon
if errorlevel 1 (
  echo BUILD FAILED: Android APK
  cd ..
  exit /b 1
)
cd ..

echo [2/3] Copying APK...
if not exist dist mkdir dist
copy /y "android\app\build\outputs\apk\debug\app-debug.apk" "dist\Chronica-Android-2.0.1.apk" >nul
if errorlevel 1 (
  echo ERROR: could not copy Android APK.
  exit /b 1
)

echo [3/3] Checking APK...
if not exist "dist\Chronica-Android-2.0.1.apk" (
  echo ERROR: Android APK missing.
  exit /b 1
)
echo.
echo ANDROID BUILD OK: dist\Chronica-Android-2.0.1.apk
exit /b 0
