@echo off
REM Script para abrir Chrome con bajo consumo de memoria
start chrome.exe --disk-cache-size=1 --media-cache-size=1 --disable-gpu --disable-software-rasterizer --disable-dev-shm-usage --no-sandbox --process-per-site http://localhost:3000
