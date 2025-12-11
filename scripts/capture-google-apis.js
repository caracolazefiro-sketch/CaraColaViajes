/*
	Captura de llamadas a Google APIs desde el navegador.
  
	Qué hace:
	- Intercepta fetch, XMLHttpRequest y sendBeacon
	- Observa recursos (script, img, link) vía PerformanceObserver
	- Filtra por dominios de Google/Maps (googleapis.com, maps.googleapis.com, maps.gstatic.com, gstatic.com)
	- Expone `window.__gapiLog` con:
			- events: array de eventos capturados
			- report(): imprime una tabla resumida en consola
			- stop(): restaura hooks y detiene el observador
			- filterByService(nombre): filtra por servicio (places, directions, geocode, elevation, autocomplete, js, tiles)
			- export(): devuelve JSON de los eventos
  
	Uso rápido en consola del navegador:
		(function(){ /* pega el contenido del archivo y se auto-inicia */ })();
		// o cargar este archivo y luego:
		window.__gapiLog.report();
		window.__gapiLog.stop();
*/

(function initGoogleApiCapture() {
	const domainPattern = /(?:^|\.)googleapis\.com|maps\.googleapis\.com|maps\.gstatic\.com|(?:^|\.)gstatic\.com|google\.com\/maps/i;

	const state = {
		events: [],
		observer: null,
		originals: {
			fetch: window.fetch,
			xhrOpen: XMLHttpRequest.prototype.open,
			xhrSend: XMLHttpRequest.prototype.send,
			sendBeacon: navigator.sendBeacon ? navigator.sendBeacon.bind(navigator) : null,
		},
	};

	function nowTs() {
		return Date.now();
	}

	function dur(start) {
		return Math.round(performance.now() - start);
	}

	function getService(url) {
		try {
			const u = String(url);
			if (/\/maps\/api\/js/.test(u)) return 'js';
			if (/\/maps\/api\/place|\/places\//.test(u)) return 'places';
			if (/\/maps\/api\/directions/.test(u)) return 'directions';
			if (/\/maps\/api\/geocode/.test(u)) return 'geocode';
			if (/\/maps\/api\/elevation/.test(u)) return 'elevation';
			if (/autocomplete/i.test(u)) return 'autocomplete';
			if (/gstatic\.com\/maps|maps\.gstatic\.com/.test(u)) return 'tiles';
		} catch (_) {}
		return 'unknown';
	}

	function pushEvent(evt) {
		const enriched = {
			time: nowTs(),
			service: getService(evt.url),
			...evt,
		};
		state.events.push(enriched);
	}

	// --- Hook: fetch ---
	if (typeof window.fetch === 'function') {
		window.fetch = function patchedFetch(input, init) {
			const url = typeof input === 'string' ? input : (input && input.url);
			const method = (init && init.method) || 'GET';
			const start = performance.now();
			const p = state.originals.fetch(input, init);
			p.then(
				(res) => {
					try {
						if (url && domainPattern.test(url)) {
							pushEvent({ type: 'fetch', method, url, status: res.status, duration: dur(start) });
						}
					} catch (_) {}
				},
				(err) => {
					try {
						if (url && domainPattern.test(url)) {
							pushEvent({ type: 'fetch', method, url, error: String(err), duration: dur(start) });
						}
					} catch (_) {}
				}
			);
			return p;
		};
	}

	// --- Hook: XMLHttpRequest ---
	XMLHttpRequest.prototype.open = function patchedOpen(method, url) {
		this.__gapi = { method, url, start: performance.now() };
		return state.originals.xhrOpen.apply(this, arguments);
	};

	XMLHttpRequest.prototype.send = function patchedSend(body) {
		const onEnd = () => {
			try {
				const info = this.__gapi;
				if (info && info.url && domainPattern.test(info.url)) {
					pushEvent({ type: 'xhr', method: info.method, url: info.url, status: this.status, duration: dur(info.start) });
				}
			} catch (_) {}
			this.removeEventListener('loadend', onEnd);
		};
		this.addEventListener('loadend', onEnd);
		return state.originals.xhrSend.apply(this, arguments);
	};

	// --- Hook: navigator.sendBeacon ---
	if (state.originals.sendBeacon) {
		navigator.sendBeacon = function patchedBeacon(url, data) {
			try {
				if (url && domainPattern.test(url)) {
					const size = (data && (data.size || data.length || data.byteLength)) || undefined;
					pushEvent({ type: 'beacon', url, size });
				}
			} catch (_) {}
			return state.originals.sendBeacon(url, data);
		};
	}

	// --- PerformanceObserver para recursos (script, img, link) ---
	try {
		state.observer = new PerformanceObserver((list) => {
			const entries = list.getEntries();
			for (const e of entries) {
				const url = e.name;
				if (!url || !domainPattern.test(url)) continue;
				// Evitar duplicados con fetch/xhr; nos quedamos con recursos pasivos
				if (['img', 'script', 'link'].includes(e.initiatorType)) {
					pushEvent({ type: e.initiatorType, url, duration: Math.round(e.duration) });
				}
			}
		});
		state.observer.observe({ entryTypes: ['resource'] });
	} catch (_) {
		// PerformanceObserver no disponible en algunos navegadores
	}

	function report() {
		const rows = state.events.map((e) => ({
			tiempo: new Date(e.time).toLocaleTimeString(),
			tipo: e.type,
			servicio: e.service,
			metodo: e.method || '',
			estado: e.status ?? '',
			ms: e.duration ?? '',
			url: e.url,
		}));
		console.table(rows);
		return rows;
	}

	function filterByService(name) {
		const n = String(name || '').toLowerCase();
		return state.events.filter((e) => String(e.service).toLowerCase() === n);
	}

	function stop() {
		try {
			if (state.originals.fetch) window.fetch = state.originals.fetch;
			if (state.originals.xhrOpen) XMLHttpRequest.prototype.open = state.originals.xhrOpen;
			if (state.originals.xhrSend) XMLHttpRequest.prototype.send = state.originals.xhrSend;
			if (state.originals.sendBeacon) navigator.sendBeacon = state.originals.sendBeacon;
			if (state.observer) state.observer.disconnect();
			console.info('[gapi-capture] Captura detenida y hooks restaurados.');
		} catch (err) {
			console.warn('[gapi-capture] Error al detener captura:', err);
		}
	}

	function exportJson() {
		try {
			const json = JSON.stringify(state.events, null, 2);
			console.log(json);
			return json;
		} catch (err) {
			console.warn('No se pudo serializar los eventos:', err);
			return '[]';
		}
	}

	window.__gapiLog = {
		events: state.events,
		report,
		stop,
		filterByService,
		export: exportJson,
	};

	console.info('[gapi-capture] Captura de Google APIs habilitada. Usa __gapiLog.report() / __gapiLog.stop()');
})();

