@echo off
call "%LOCALAPPDATA%\Programs\Microsoft VS Code\bin\code.cmd" --new-window --user-data-dir "%~dp0..\..\work\vscode-profile" --extensions-dir "%~dp0..\..\work\vscode-extensions" "%~dp0."
