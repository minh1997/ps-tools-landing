@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
title PS Visual Tool - Windows Installer

set "UPIA=%CommonProgramFiles%\Adobe\Adobe Desktop Common\RemoteComponents\UPI\UnifiedPluginInstallerAgent\UnifiedPluginInstallerAgent.exe"
set "CCX_FILE="
set "PLUGIN_NAME=PS Tools V1"
set "PLUGIN_ID=anhson-studio"
set "LIST_FILE=%TEMP%\ps-visual-tool-upia-%RANDOM%-%RANDOM%.txt"

echo.
echo ============================================================
echo              PS VISUAL TOOL - WINDOWS INSTALLER
echo ============================================================
echo.

if not "%~1"=="" (
  if /I not "%~x1"==".ccx" (
    echo [LOI] File duoc chon khong phai la file .ccx:
    echo       "%~f1"
    echo.
    goto :usage
  )
  if exist "%~f1" set "CCX_FILE=%~f1"
)

if not defined CCX_FILE if exist "%~dp0PS_V1.0.2.ccx" set "CCX_FILE=%~dp0PS_V1.0.2.ccx"
if not defined CCX_FILE if exist "%USERPROFILE%\Downloads\PS_V1.0.2.ccx" set "CCX_FILE=%USERPROFILE%\Downloads\PS_V1.0.2.ccx"
if not defined CCX_FILE for /f "delims=" %%F in ('dir /b /a-d /o-d "%USERPROFILE%\Downloads\PS_V*.ccx" 2^>nul') do if not defined CCX_FILE set "CCX_FILE=%USERPROFILE%\Downloads\%%F"

if not exist "%UPIA%" set "UPIA=%ProgramFiles%\Common Files\Adobe\Adobe Desktop Common\RemoteComponents\UPI\UnifiedPluginInstallerAgent\UnifiedPluginInstallerAgent.exe"

if not exist "%UPIA%" (
  echo [LOI] Khong tim thay UnifiedPluginInstallerAgent.exe.
  echo.
  echo Hay cai Adobe Creative Cloud Desktop, dang nhap tai khoan Adobe,
  echo sau do chay lai file nay.
  echo.
  echo Duong dan da kiem tra:
  echo "%CommonProgramFiles%\Adobe\Adobe Desktop Common\RemoteComponents\UPI\UnifiedPluginInstallerAgent\UnifiedPluginInstallerAgent.exe"
  echo.
  pause
  exit /b 2
)

if not defined CCX_FILE goto :missing_ccx
if not exist "%CCX_FILE%" goto :missing_ccx

echo Tim thay bo cai Adobe:
echo "%UPIA%"
echo.
echo File plugin:
echo "%CCX_FILE%"
echo.
echo Dang kiem tra phien ban cu...
echo.

call :plugin_is_installed
if errorlevel 2 goto :list_failed
if errorlevel 1 goto :install_new

set "REMOVE_ATTEMPTS=0"

:remove_old
set /a REMOVE_ATTEMPTS+=1
if %REMOVE_ATTEMPTS% GTR 5 goto :remove_failed

echo Tim thay %PLUGIN_NAME%. Dang go phien ban cu (lan %REMOVE_ATTEMPTS%)...
"%UPIA%" /remove "%PLUGIN_NAME%"
set "REMOVE_EXIT=%ERRORLEVEL%"

if not "%REMOVE_EXIT%"=="0" (
  echo Khong go duoc bang ten plugin. Dang thu bang plugin ID...
  "%UPIA%" /remove "%PLUGIN_ID%"
  set "REMOVE_EXIT=%ERRORLEVEL%"
)

if not "%REMOVE_EXIT%"=="0" goto :remove_failed

call :plugin_is_installed
if errorlevel 2 goto :list_failed
if not errorlevel 1 goto :remove_old

echo Da go phien ban cu thanh cong.
echo.

:install_new
echo Dang cai dat phien ban moi... Hay giu Adobe Creative Cloud dang mo va da dang nhap.
echo.

"%UPIA%" /install "%CCX_FILE%"
set "INSTALL_EXIT=%ERRORLEVEL%"

echo.
if "%INSTALL_EXIT%"=="0" (
  if exist "%LIST_FILE%" del /q "%LIST_FILE%" >nul 2>&1
  echo [THANH CONG] PS Visual Tool da duoc cai dat.
  echo.
  echo Mo Photoshop 27 tro len, sau do chon Plugins ^> PS Tools V1.
  echo Neu Photoshop dang mo, hay thoat han va mo lai ung dung.
  echo.
  pause
  exit /b 0
)

echo [LOI] Adobe installer tra ve ma loi %INSTALL_EXIT%.
echo.
echo Hay kiem tra:
echo   1. Adobe Creative Cloud Desktop da duoc cai va dang nhap.
echo   2. Photoshop da duoc thoat hoan toan truoc khi cai.
echo   3. May dang su dung Photoshop 27 tro len.
echo.
echo Sau do thu chay lai file nay. Neu Windows chan file, nhap phai file
echo .cmd, chon Properties, danh dau Unblock roi chay lai.
echo.
pause
if exist "%LIST_FILE%" del /q "%LIST_FILE%" >nul 2>&1
exit /b %INSTALL_EXIT%

:list_failed
echo [LOI] Khong the doc danh sach plugin tu Adobe Creative Cloud.
echo.
if exist "%LIST_FILE%" type "%LIST_FILE%"
echo.
echo Hay cap nhat Adobe Creative Cloud Desktop, dang nhap lai va thu lai.
echo Script da dung va chua cai phien ban moi de tranh cai chong plugin.
echo.
if exist "%LIST_FILE%" del /q "%LIST_FILE%" >nul 2>&1
pause
exit /b 4

:remove_failed
echo.
echo [LOI] Khong the go hoan toan phien ban %PLUGIN_NAME% cu.
echo.
echo Hay dong Photoshop, vao Creative Cloud ^> Plugins ^> Manage Plugins,
echo go %PLUGIN_NAME% thu cong, sau do chay lai script nay.
echo Script da dung va chua cai phien ban moi de tranh trung phien ban.
echo.
if exist "%LIST_FILE%" del /q "%LIST_FILE%" >nul 2>&1
pause
exit /b 5

:missing_ccx
echo [LOI] Khong tim thay file PS_V1.0.2.ccx.
echo.
echo Hay tai file .ccx va file .cmd vao cung thu muc Downloads,
echo hoac keo-tha file .ccx len file .cmd de bat dau cai dat.
echo.

:usage
echo Cach dung tren Command Prompt:
echo   "%~f0" "C:\duong-dan\PS_V1.0.2.ccx"
echo.
pause
exit /b 3

:plugin_is_installed
"%UPIA%" /list all > "%LIST_FILE%" 2>&1
if errorlevel 1 exit /b 2
findstr /i /c:"%PLUGIN_NAME%" /c:"%PLUGIN_ID%" "%LIST_FILE%" >nul 2>&1
if errorlevel 1 exit /b 1
exit /b 0
