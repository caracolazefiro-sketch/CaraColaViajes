Set oWS = WScript.CreateObject("WScript.Shell")
strDesktopPath = oWS.SpecialFolders("Desktop")
Set oLink = oWS.CreateShortcut(strDesktopPath & "\Reinstalar VS Code.lnk")
oLink.TargetPath = "C:\Users\chema\CaraColaViajes\CHEMA\MANTENIMIENTO\reinstalar-vscode.bat"
oLink.WorkingDirectory = "C:\Users\chema\CaraColaViajes\CHEMA\MANTENIMIENTO\"
oLink.Description = "Reinstala VS Code completamente (limpio de fábrica)"
oLink.Save
WScript.Echo "✅ Acceso directo creado: Reinstalar VS Code"
