const value = document.getElementById('value');
const stopped = document.getElementById('stopped');
const runningIndicator = document.getElementById('running-indicator');
const metronome_light = document.getElementById('metronome-light');
const bpm_value = document.getElementById('bpm-value');
let running = false;
let metronome_running = false;
let timer = null;

createReconnectingSocket(({ data }) => {
	let message = data;
	if (typeof message === 'string') {
		try {
			message = JSON.parse(message);
		} catch {}
	}
	if (message === 'start') {
		running = true;
		stopped.hidden = true;
		runningIndicator.hidden = false;
		return;
	}
	if (message === 'stop') {
		running = false;
		value.textContent = '00:00';
		stopped.hidden = false;
		runningIndicator.hidden = true;
		return;
	}
	if (message.msg === 'start-metronome') {
		if (metronome_running) {
			clearInterval(timer);
		}
		console.log('Starting metronome with BPM:', message.bpm);
		bpm_value.textContent = message.bpm;
		metronome_running = true;
		timer = setInterval(() => {
			metronome_light.classList.add('active');
			setTimeout(() => {
				metronome_light.classList.remove('active');
			}, 100);
		}, 60000 / message.bpm);
		return;
	}
	if (message === 'stop-metronome') {
		metronome_running = false;
		console.log('Stopping metronome');
		clearInterval(timer);
		metronome_light.classList.remove('active');
		return;
	}
	const seconds = Number(message);
	if (!running || !Number.isInteger(seconds) || seconds < 0) return;
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	value.textContent = `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
});