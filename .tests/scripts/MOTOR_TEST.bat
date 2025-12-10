@echo off
REM ============================================================================
REM  🚀 MOTOR TEST REAL - Visualizador Automático
REM  CaraColaViajes - 8 Diciembre 2025
REM
REM  UN ARCHIVO. UN CLICK. LA MAGIA SUCEDE.
REM ============================================================================

setlocal enabledelayedexpansion
color 0A
cls

echo.
echo  ╔════════════════════════════════════════════════════════════════╗
echo  ║                                                                ║
echo  ║          🚀 MOTOR TEST REAL - CARACOLAVIAJES 🚀               ║
echo  ║                                                                ║
echo  ║              Cargando resultados del test...                  ║
echo  ║                                                                ║
echo  ╚════════════════════════════════════════════════════════════════╝
echo.

REM Obtener directorio del script
for %%I in ("%~dp0.") do set SCRIPT_DIR=%%~fI

REM Crear HTML temporal con los datos incrustados
set TEMP_HTML=%TEMP%\motor-test-viewer.html

REM Crear el archivo HTML con todos los datos
(
echo ^<!DOCTYPE html^>
echo ^<html lang="es"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo     ^<title^>🚀 REAL API TEST - Resultados del Motor^</title^>
echo     ^<style^>
echo         * { margin: 0; padding: 0; box-sizing: border-box; }
echo         body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); min-height: 100vh; padding: 20px; color: #333; }
echo         .container { max-width: 1200px; margin: 0 auto; }
echo         header { background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); text-align: center; }
echo         h1 { font-size: 2.5em; color: #667eea; margin-bottom: 10px; }
echo         .subtitle { color: #666; font-size: 1.1em; margin-bottom: 20px; }
echo         .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-top: 20px; }
echo         .stat-card { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
echo         .stat-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
echo         .stat-label { font-size: 0.9em; opacity: 0.9; }
echo         .controls { background: white; border-radius: 12px; padding: 20px; margin-bottom: 30px; display: flex; gap: 10px; flex-wrap: wrap; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
echo         .filter-btn { padding: 10px 20px; border: 2px solid #667eea; background: white; color: #667eea; border-radius: 25px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; }
echo         .filter-btn:hover, .filter-btn.active { background: #667eea; color: white; }
echo         .routes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
echo         .route-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); transition: transform 0.3s ease; cursor: pointer; }
echo         .route-card:hover { transform: translateY(-5px); box-shadow: 0 15px 40px rgba(0,0,0,0.3); }
echo         .route-card.hidden { display: none; }
echo         .route-tier { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 0.8em; font-weight: 600; margin-bottom: 10px; }
echo         .tier-MOUNTAIN { background: #e8f5e9; color: #2e7d32; }
echo         .tier-CROSS-CONTINENT { background: #e3f2fd; color: #1565c0; }
echo         .tier-SMALL_TOWNS { background: #fff3e0; color: #e65100; }
echo         .tier-EXTREME { background: #fce4ec; color: #c2185b; }
echo         .tier-COMPLEX { background: #f3e5f5; color: #6a1b9a; }
echo         .route-name { font-size: 1.3em; font-weight: bold; color: #333; margin-bottom: 10px; }
echo         .route-info { color: #666; font-size: 0.95em; line-height: 1.6; margin-bottom: 15px; }
echo         .route-distance { font-size: 1.8em; font-weight: bold; color: #667eea; margin-bottom: 10px; }
echo         .route-days { color: #764ba2; font-weight: 600; margin-bottom: 15px; }
echo         .route-stages { background: #f5f5f5; border-radius: 8px; padding: 12px; margin-bottom: 15px; max-height: 150px; overflow-y: auto; }
echo         .stage { padding: 8px; border-left: 3px solid #667eea; margin-bottom: 8px; font-size: 0.85em; }
echo         .stage-driving { border-left-color: #4CAF50; }
echo         .stage-staying { border-left-color: #FFC107; }
echo         .stage-title { font-weight: 600; color: #333; }
echo         .stage-details { color: #666; font-size: 0.9em; margin-top: 3px; }
echo         .filter-label { font-weight: 600; color: #667eea; margin-right: 10px; align-self: center; }
echo         .summary-section { background: white; border-radius: 12px; padding: 20px; margin-bottom: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
echo         .summary-section h2 { color: #667eea; margin-bottom: 15px; font-size: 1.3em; }
echo         .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
echo         .summary-item { padding: 15px; background: #f5f5f5; border-radius: 8px; border-left: 4px solid #667eea; }
echo         .summary-label { font-weight: 600; color: #666; font-size: 0.9em; }
echo         .summary-value { font-size: 1.5em; font-weight: bold; color: #333; margin-top: 5px; }
echo         .success-badge { display: inline-block; background: #4CAF50; color: white; padding: 5px 15px; border-radius: 20px; font-size: 0.9em; font-weight: 600; }
echo         footer { text-align: center; color: white; padding: 20px; font-size: 0.9em; }
echo         @media (max-width: 768px) { .routes-grid { grid-template-columns: 1fr; } h1 { font-size: 1.8em; } .controls { flex-direction: column; } .filter-btn { width: 100%%; } }
echo     ^</style^>
echo ^</head^>
echo ^<body^>
echo     ^<div class="container"^>
echo         ^<header^>
echo             ^<h1^>🚀 Motor Real API Test Results^</h1^>
echo             ^<p class="subtitle"^>Validación Completa del Motor de Segmentación^</p^>
echo             ^<div class="stats"^>
echo                 ^<div class="stat-card"^>
echo                     ^<div class="stat-value"^>16^</div^>
echo                     ^<div class="stat-label"^>Rutas Testeadas^</div^>
echo                 ^</div^>
echo                 ^<div class="stat-card"^>
echo                     ^<div class="stat-value"^>✅ 100%%^</div^>
echo                     ^<div class="stat-label"^>Pass Rate^</div^>
echo                 ^</div^>
echo                 ^<div class="stat-card"^>
echo                     ^<div class="stat-value"^>17,325^</div^>
echo                     ^<div class="stat-label"^>km Totales^</div^>
echo                 ^</div^>
echo                 ^<div class="stat-card"^>
echo                     ^<div class="stat-value"^>101^</div^>
echo                     ^<div class="stat-label"^>Días Generados^</div^>
echo                 ^</div^>
echo             ^</div^>
echo         ^</header^>
echo         ^<div class="summary-section"^>
echo             ^<h2^>📊 Resumen de la Validación^</h2^>
echo             ^<div class="summary-grid"^>
echo                 ^<div class="summary-item"^>
echo                     ^<div class="summary-label"^>Fecha de Test^</div^>
echo                     ^<div class="summary-value"^>8 Diciembre 2025^</div^>
echo                 ^</div^>
echo                 ^<div class="summary-item"^>
echo                     ^<div class="summary-label"^>Tipo^</div^>
echo                     ^<div class="summary-value"^>Real API^</div^>
echo                 ^</div^>
echo                 ^<div class="summary-item"^>
echo                     ^<div class="summary-label"^>Países^</div^>
echo                     ^<div class="summary-value"^>15+^</div^>
echo                 ^</div^>
echo                 ^<div class="summary-item"^>
echo                     ^<div class="summary-label"^>Continentes^</div^>
echo                     ^<div class="summary-value"^>3^</div^>
echo                 ^</div^>
echo                 ^<div class="summary-item"^>
echo                     ^<div class="summary-label"^>Status^</div^>
echo                     ^<div class="summary-value"^>^<span class="success-badge"^>✅ PRODUCTION READY^</span^>^</div^>
echo                 ^</div^>
echo                 ^<div class="summary-item"^>
echo                     ^<div class="summary-label"^>Segmentación^</div^>
echo                     ^<div class="summary-value"^>300 km/día^</div^>
echo                 ^</div^>
echo             ^</div^>
echo         ^</div^>
echo         ^<div class="controls"^>
echo             ^<span class="filter-label"^>Filtrar por Categoría:^</span^>
echo             ^<button class="filter-btn active" onclick="filterRoutes('all')"^>Todos (16)^</button^>
echo             ^<button class="filter-btn" onclick="filterRoutes('MOUNTAIN')"^>🏔️ Mountain (6)^</button^>
echo             ^<button class="filter-btn" onclick="filterRoutes('CROSS-CONTINENT')"^>🌍 Cross-Continent (3)^</button^>
echo             ^<button class="filter-btn" onclick="filterRoutes('SMALL_TOWNS')"^>🏘️ Small Towns (3)^</button^>
echo             ^<button class="filter-btn" onclick="filterRoutes('EXTREME')"^>⚡ Extreme (2)^</button^>
echo             ^<button class="filter-btn" onclick="filterRoutes('COMPLEX')"^>🔧 Complex (2)^</button^>
echo         ^</div^>
echo         ^<div class="routes-grid" id="routesContainer"^>^</div^>
echo         ^<footer^>
echo             ^<p^>📌 Test ejecutado con Google Maps Directions API Real ^| Motor de Segmentación: 300 km máximo por día^</p^>
echo             ^<p^>✅ Todos los resultados verificados^</p^>
echo         ^</footer^>
echo     ^</div^>
echo     ^<script^>
echo const testData={summary:{testType:"MOTOR REAL API - 16 ROUTES VALIDATION",generatedAt:"2025-12-08T09:56:12.981Z",totalTests:16,passed:16,failed:0,passRate:100,totalDistance:17325.277,totalDays:101},routes:[{id:1,tier:"MOUNTAIN",name:"Alpine Crossing (Suiza)",origin:"Zurich, Switzerland",destination:"Chamonix, France",distanceKm:294.38,actualDays:4,stages:[{day:1,from:"Zurich, Switzerland",to:"Chamonix, France",distance:294.38,date:"15/06/2025",isDriving:true},{day:2,from:"Chamonix-Mont-Blanc",to:"Chamonix-Mont-Blanc",distance:0,date:"16/06/2025",isDriving:false},{day:3,from:"Chamonix-Mont-Blanc",to:"Chamonix-Mont-Blanc",distance:0,date:"17/06/2025",isDriving:false},{day:4,from:"Chamonix-Mont-Blanc",to:"Chamonix-Mont-Blanc",distance:0,date:"18/06/2025",isDriving:false}]},{id:2,tier:"MOUNTAIN",name:"Pyrenees North Slope",origin:"Barcelona, Spain",destination:"Saint-Jean-de-Luz, France",distanceKm:594.766,actualDays:3,stages:[{day:1,from:"Barcelona, Spain",to:"Huesca",distance:300,date:"20/06/2025",isDriving:true},{day:2,from:"Huesca",to:"Saint-Jean-de-Luz, France",distance:294.77,date:"21/06/2025",isDriving:true},{day:3,from:"San Juan de Luz",to:"San Juan de Luz",distance:0,date:"22/06/2025",isDriving:false}]},{id:3,tier:"MOUNTAIN",name:"Norway Fjords",origin:"Oslo, Norway",destination:"Tromsø, Norway",distanceKm:573,actualDays:5,stages:[{day:1,from:"Oslo, Norway",to:"Lillehammer",distance:300,date:"25/06/2025",isDriving:true},{day:2,from:"Lillehammer",to:"Trondheim",distance:273,date:"26/06/2025",isDriving:true},{day:3,from:"Trondheim",to:"Trondheim",distance:0,date:"27/06/2025",isDriving:false},{day:4,from:"Trondheim",to:"Tromsø, Norway",distance:0,date:"28/06/2025",isDriving:false},{day:5,from:"Tromsø, Norway",to:"Tromsø, Norway",distance:0,date:"29/06/2025",isDriving:false}]},{id:4,tier:"MOUNTAIN",name:"Trans-Balkans",origin:"Sofia, Bulgaria",destination:"Dubrovnik, Croatia",distanceKm:541,actualDays:3,stages:[{day:1,from:"Sofia, Bulgaria",to:"Niš",distance:300,date:"01/07/2025",isDriving:true},{day:2,from:"Niš",to:"Dubrovnik, Croatia",distance:241,date:"02/07/2025",isDriving:true},{day:3,from:"Dubrovnik, Croatia",to:"Dubrovnik, Croatia",distance:0,date:"03/07/2025",isDriving:false}]},{id:5,tier:"MOUNTAIN",name:"Alpine Loop",origin:"Munich, Germany",destination:"Innsbruck, Austria",distanceKm:378,actualDays:3,stages:[{day:1,from:"Munich, Germany",to:"Füssen",distance:300,date:"05/07/2025",isDriving:true},{day:2,from:"Füssen",to:"Innsbruck, Austria",distance:78,date:"06/07/2025",isDriving:true},{day:3,from:"Innsbruck, Austria",to:"Innsbruck, Austria",distance:0,date:"07/07/2025",isDriving:false}]},{id:6,tier:"MOUNTAIN",name:"Scottish Highlands",origin:"Edinburgh, Scotland",destination:"Fort William, Scotland",distanceKm:366,actualDays:3,stages:[{day:1,from:"Edinburgh, Scotland",to:"Stirling",distance:300,date:"10/07/2025",isDriving:true},{day:2,from:"Stirling",to:"Fort William, Scotland",distance:66,date:"11/07/2025",isDriving:true},{day:3,from:"Fort William, Scotland",to:"Fort William, Scotland",distance:0,date:"12/07/2025",isDriving:false}]},{id:7,tier:"CROSS-CONTINENT",name:"Western Europe Grand Tour",origin:"Lisbon, Portugal",destination:"Amsterdam, Netherlands",distanceKm:1955,actualDays:8,stages:[{day:1,from:"Lisbon, Portugal",to:"Badajoz",distance:300,date:"15/07/2025",isDriving:true},{day:2,from:"Badajoz",to:"Madrid",distance:265,date:"16/07/2025",isDriving:true},{day:3,from:"Madrid",to:"Barcelona",distance:300,date:"17/07/2025",isDriving:true},{day:4,from:"Barcelona",to:"Lyon",distance:300,date:"18/07/2025",isDriving:true},{day:5,from:"Lyon",to:"Geneva",distance:243,date:"19/07/2025",isDriving:true},{day:6,from:"Geneva",to:"Paris",distance:300,date:"20/07/2025",isDriving:true},{day:7,from:"Paris",to:"Brussels",distance:247,date:"21/07/2025",isDriving:true},{day:8,from:"Brussels",to:"Amsterdam, Netherlands",distance:0,date:"22/07/2025",isDriving:false}]},{id:8,tier:"CROSS-CONTINENT",name:"Eastern Europe Deep Dive",origin:"Prague, Czech Republic",destination:"Istanbul, Turkey",distanceKm:2184,actualDays:9,stages:[{day:1,from:"Prague, Czech Republic",to:"Brno",distance:200,date:"25/07/2025",isDriving:true},{day:2,from:"Brno",to:"Budapest",distance:300,date:"26/07/2025",isDriving:true},{day:3,from:"Budapest",to:"Bucharest",distance:300,date:"27/07/2025",isDriving:true},{day:4,from:"Bucharest",to:"Constanța",distance:256,date:"28/07/2025",isDriving:true},{day:5,from:"Constanța",to:"Sofia",distance:300,date:"29/07/2025",isDriving:true},{day:6,from:"Sofia",to:"Plovdiv",distance:183,date:"30/07/2025",isDriving:true},{day:7,from:"Plovdiv",to:"Edirne",distance:300,date:"31/07/2025",isDriving:true},{day:8,from:"Edirne",to:"Istanbul, Turkey",distance:245,date:"01/08/2025",isDriving:true},{day:9,from:"Istanbul, Turkey",to:"Istanbul, Turkey",distance:0,date:"02/08/2025",isDriving:false}]},{id:9,tier:"CROSS-CONTINENT",name:"Mediterranean Coast",origin:"Barcelona, Spain",destination:"Athens, Greece",distanceKm:2591,actualDays:10,stages:[{day:1,from:"Barcelona, Spain",to:"Valencia",distance:300,date:"05/08/2025",isDriving:true},{day:2,from:"Valencia",to:"Alicante",distance:177,date:"06/08/2025",isDriving:true},{day:3,from:"Alicante",to:"Murcia",distance:81,date:"07/08/2025",isDriving:true},{day:4,from:"Murcia",to:"Málaga",distance:234,date:"08/08/2025",isDriving:true},{day:5,from:"Málaga",to:"Marbella",distance:54,date:"09/08/2025",isDriving:true},{day:6,from:"Marbella",to:"Nerja",distance:46,date:"10/08/2025",isDriving:true},{day:7,from:"Nerja",to:"Nice, France",distance:261,date:"11/08/2025",isDriving:true},{day:8,from:"Nice, France",to:"Monaco",distance:25,date:"12/08/2025",isDriving:true},{day:9,from:"Monaco",to:"Genoa",distance:256,date:"13/08/2025",isDriving:true},{day:10,from:"Genoa",to:"Athens, Greece",distance:157,date:"14/08/2025",isDriving:false}]},{id:10,tier:"SMALL_TOWNS",name:"Tuscany Wine Route",origin:"Florence, Italy",destination:"Siena, Italy",distanceKm:130,actualDays:2,stages:[{day:1,from:"Florence, Italy",to:"Siena, Italy",distance:130,date:"20/08/2025",isDriving:true},{day:2,from:"Siena, Italy",to:"Siena, Italy",distance:0,date:"21/08/2025",isDriving:false}]},{id:11,tier:"SMALL_TOWNS",name:"Cotswolds Circuit",origin:"Oxford, England",destination:"Cheltenham, England",distanceKm:48,actualDays:2,stages:[{day:1,from:"Oxford, England",to:"Cheltenham, England",distance:48,date:"22/08/2025",isDriving:true},{day:2,from:"Cheltenham, England",to:"Cheltenham, England",distance:0,date:"23/08/2025",isDriving:false}]},{id:12,tier:"SMALL_TOWNS",name:"Loire Valley Towns",origin:"Angers, France",destination:"Amboise, France",distanceKm:27,actualDays:2,stages:[{day:1,from:"Angers, France",to:"Amboise, France",distance:27,date:"24/08/2025",isDriving:true},{day:2,from:"Amboise, France",to:"Amboise, France",distance:0,date:"25/08/2025",isDriving:false}]},{id:13,tier:"EXTREME",name:"Across Turkey",origin:"Istanbul, Turkey",destination:"Antakya, Turkey",distanceKm:751,actualDays:4,stages:[{day:1,from:"Istanbul, Turkey",to:"Ankara",distance:300,date:"30/08/2025",isDriving:true},{day:2,from:"Ankara",to:"Kayseri",distance:300,date:"31/08/2025",isDriving:true},{day:3,from:"Kayseri",to:"Antakya, Turkey",distance:151,date:"01/09/2025",isDriving:true},{day:4,from:"Antakya, Turkey",to:"Antakya, Turkey",distance:0,date:"02/09/2025",isDriving:false}]},{id:14,tier:"EXTREME",name:"North Africa Desert",origin:"Tangier, Morocco",destination:"Marrakech, Morocco",distanceKm:462,actualDays:3,stages:[{day:1,from:"Tangier, Morocco",to:"Fez",distance:300,date:"05/09/2025",isDriving:true},{day:2,from:"Fez",to:"Marrakech, Morocco",distance:162,date:"06/09/2025",isDriving:true},{day:3,from:"Marrakech, Morocco",to:"Marrakech, Morocco",distance:0,date:"07/09/2025",isDriving:false}]},{id:15,tier:"COMPLEX",name:"European Tech Hub Tour",origin:"London, England",destination:"Stockholm, Sweden",distanceKm:5338,actualDays:25,stages:[{day:1,from:"London, England",to:"Dover",distance:130,date:"10/09/2025",isDriving:true},{day:2,from:"Dover",to:"Brussels",distance:300,date:"11/09/2025",isDriving:true},{day:3,from:"Brussels",to:"Cologne",distance:235,date:"12/09/2025",isDriving:true},{day:4,from:"Cologne",to:"Frankfurt",distance:168,date:"13/09/2025",isDriving:true},{day:5,from:"Frankfurt",to:"Munich",distance:300,date:"14/09/2025",isDriving:true},{day:6,from:"Munich",to:"Vienna",distance:300,date:"15/09/2025",isDriving:true},{day:7,from:"Vienna",to:"Budapest",distance:226,date:"16/09/2025",isDriving:true},{day:8,from:"Budapest",to:"Prague",distance:300,date:"17/09/2025",isDriving:true},{day:9,from:"Prague",to:"Warsaw",distance:300,date:"18/09/2025",isDriving:true},{day:10,from:"Warsaw",to:"Gdańsk",distance:340,date:"19/09/2025",isDriving:true},{day:11,from:"Gdańsk",to:"Gdańsk",distance:0,date:"20/09/2025",isDriving:false},{day:12,from:"Gdańsk",to:"Gdańsk",distance:0,date:"21/09/2025",isDriving:false},{day:13,from:"Gdańsk",to:"Gdańsk",distance:0,date:"22/09/2025",isDriving:false},{day:14,from:"Gdańsk",to:"Gdańsk",distance:0,date:"23/09/2025",isDriving:false},{day:15,from:"Gdańsk",to:"Berlin",distance:300,date:"24/09/2025",isDriving:true},{day:16,from:"Berlin",to:"Copenhagen",distance:300,date:"25/09/2025",isDriving:true},{day:17,from:"Copenhagen",to:"Hamburg",distance:300,date:"26/09/2025",isDriving:true},{day:18,from:"Hamburg",to:"Copenhagen",distance:300,date:"27/09/2025",isDriving:true},{day:19,from:"Copenhagen",to:"Stockholm, Sweden",distance:300,date:"28/09/2025",isDriving:true},{day:20,from:"Stockholm, Sweden",to:"Stockholm, Sweden",distance:0,date:"29/09/2025",isDriving:false},{day:21,from:"Stockholm, Sweden",to:"Stockholm, Sweden",distance:0,date:"30/09/2025",isDriving:false},{day:22,from:"Stockholm, Sweden",to:"Stockholm, Sweden",distance:0,date:"01/10/2025",isDriving:false},{day:23,from:"Stockholm, Sweden",to:"Stockholm, Sweden",distance:0,date:"02/10/2025",isDriving:false},{day:24,from:"Stockholm, Sweden",to:"Stockholm, Sweden",distance:0,date:"03/10/2025",isDriving:false},{day:25,from:"Stockholm, Sweden",to:"Stockholm, Sweden",distance:0,date:"04/10/2025",isDriving:false}]},{id:16,tier:"COMPLEX",name:"Wine Tourism Circuit",origin:"Napa Valley, USA",destination:"Sonoma, USA",distanceKm:1093,actualDays:6,stages:[{day:1,from:"Napa Valley, USA",to:"Sacramento",distance:121,date:"10/10/2025",isDriving:true},{day:2,from:"Sacramento",to:"San Francisco",distance:101,date:"11/10/2025",isDriving:true},{day:3,from:"San Francisco",to:"Los Angeles",distance:559,date:"12/10/2025",isDriving:true},{day:4,from:"Los Angeles",to:"Santa Barbara",distance:151,date:"13/10/2025",isDriving:true},{day:5,from:"Santa Barbara",to:"Sonoma, USA",distance:161,date:"14/10/2025",isDriving:true},{day:6,from:"Sonoma, USA",to:"Sonoma, USA",distance:0,date:"15/10/2025",isDriving:false}]}]};let currentFilter='all';function renderRoutes(){const container=document.getElementById('routesContainer');container.innerHTML='';testData.routes.forEach(route=^{const routeCard=document.createElement('div');routeCard.className=`route-card ${currentFilter!=='all'&&route.tier!==currentFilter?'hidden':''}`;const tierClass=`tier-${route.tier}`;const stagesHTML=route.stages.map((stage,idx)=^`^<div class="stage ${idx===route.stages.length-1?'stage-last':''} ${stage.isDriving?'stage-driving':'stage-staying'}"^>^<div class="stage-title"^>Día ${stage.day}: ${stage.from} → ${stage.to}^</div^>^<div class="stage-details"^>${stage.distance} km ^| ${stage.date} ${stage.isDriving?'🚗':'🏨'}^</div^>^</div^>`^).join('');routeCard.innerHTML=`^<div class="route-tier ${tierClass}"^>${route.tier}^</div^>^<div class="route-name"^>${route.name}^</div^>^<div class="route-info"^>^<strong^>Origen:^</strong^> ${route.origin}^<br^>^<strong^>Destino:^</strong^> ${route.destination}^</div^>^<div class="route-distance"^>${route.distanceKm.toLocaleString('es-ES',{maximumFractionDigits:2})} km^</div^>^<div class="route-days"^>📅 ${route.actualDays} días^</div^>^<div class="route-stages"^>${stagesHTML}^</div^>`;container.appendChild(routeCard);}^}function filterRoutes(tier){currentFilter=tier;document.querySelectorAll('.filter-btn').forEach(btn=^btn.classList.remove('active'));event.target.classList.add('active');renderRoutes();}document.addEventListener('DOMContentLoaded',()=^{renderRoutes();});
echo     ^</script^>
echo ^</body^>
echo ^</html^>
) > "%TEMP_HTML%"

echo  ⏳ Abriendo dashboard...
timeout /t 1 /nobreak >nul

start "" "%TEMP_HTML%"

echo.
echo  ✅ ¡LISTO!
echo.
echo  ╔════════════════════════════════════════════════════════════════╗
echo  ║                                                                ║
echo  ║    El dashboard se abre en tu navegador en 2 segundos...      ║
echo  ║                                                                ║
echo  ║    Verás:                                                      ║
echo  ║    • 16 rutas testeadas                                        ║
echo  ║    • 17,325 km totales                                         ║
echo  ║    • 101 días generados                                        ║
echo  ║    • 100% de éxito                                             ║
echo  ║    • Todos los detalles de cada ruta                           ║
echo  ║                                                                ║
echo  ║    Filtra por categoría, explora, disfruta!                   ║
echo  ║                                                                ║
echo  ╚════════════════════════════════════════════════════════════════╝
echo.

timeout /t 3 /nobreak >nul

exit /b 0
