Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = oWS.SpecialFolders("Desktop") & "\Optimizar Severo.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "C:\Users\chema\CaraColaViajes\CHEMA\MANTENIMIENTO\optimizar-severo.bat"
oLink.WorkingDirectory = "C:\Users\chema\CaraColaViajes"
oLink.Description = "Optimizacion Severa VS Code y Chrome"
oLink.IconLocation = "C:\Windows\System32\cmd.exe,0"
oLink.Save
WScript.Echo "Acceso directo creado en Escritorio"
