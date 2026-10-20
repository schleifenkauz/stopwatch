window.createReconnectingSocket = (onMessage) => {
	const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
	let socket = null;
	let retryDelay = 1000;
	let retryTimer = null;

	const scheduleReconnect = () => {
		if (retryTimer || !navigator.onLine || document.visibilityState !== 'visible') return;
		const delay = Math.round(retryDelay * (0.8 + Math.random() * 0.4));
		retryDelay = Math.min(retryDelay * 2, 30000);
		retryTimer = setTimeout(() => {
			retryTimer = null;
			connect();
		}, delay);
	};

	const connect = () => {
		if (!navigator.onLine || document.visibilityState !== 'visible') return;
		if (socket && socket.readyState < WebSocket.CLOSING) return;

		const currentSocket = new WebSocket(`${protocol}//${location.host}`);
		socket = currentSocket;
		currentSocket.addEventListener('open', () => {
			retryDelay = 1000;
		});
		currentSocket.addEventListener('message', onMessage);
		currentSocket.addEventListener('close', () => {
			if (socket === currentSocket) socket = null;
			scheduleReconnect();
		});
		currentSocket.addEventListener('error', () => currentSocket.close());
	};

	const reconnect = () => {
		if (retryTimer) {
			clearTimeout(retryTimer);
			retryTimer = null;
		}
		if (socket && socket.readyState < WebSocket.CLOSING) {
			socket.close();
		} else {
			connect();
		}
	};

	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') reconnect();
		else if (socket && socket.readyState < WebSocket.CLOSING) socket.close();
	});
	window.addEventListener('online', reconnect);
	window.addEventListener('pageshow', reconnect);
	window.addEventListener('offline', () => {
		if (socket && socket.readyState < WebSocket.CLOSING) socket.close();
	});

	connect();
};