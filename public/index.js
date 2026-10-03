const value = document.getElementById('value');
const stopped = document.getElementById('stopped');
const runningIndicator = document.getElementById('running-indicator');
const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
let running = false;

const connect = () => {
	const socket = new WebSocket(`${protocol}//${location.host}`);
	socket.onclose = () => setTimeout(connect, 1000);
	socket.onmessage = ({ data }) => {
		if (data === 'start') {
			running = true;
			stopped.hidden = true;
			runningIndicator.hidden = false;
			return;
		}
		if (data === 'stop') {
			running = false;
			value.textContent = '00:00';
			stopped.hidden = false;
			runningIndicator.hidden = true;
			return;
		}
		const seconds = Number(data);
		if (!running || !Number.isInteger(seconds) || seconds < 0) return;
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		value.textContent = `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
	};
};

connect();