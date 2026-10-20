const toggle = document.querySelector('#toggle');
const bpmInput = document.querySelector('#bpm');
const metronomeToggle = document.querySelector('#metronome-toggle');
let running = false;
let metronomeRunning = false;

const setMetronomeRunning = (isRunning, bpm = null) => {
	metronomeRunning = isRunning;
	metronomeToggle.textContent = isRunning ? 'Stop metronome' : 'Start metronome';
	metronomeToggle.setAttribute('aria-pressed', String(isRunning));
	bpmInput.disabled = isRunning;
	if (bpm !== null) bpmInput.value = bpm;
};

toggle.addEventListener('click', async () => {
	const action = running ? 'stop' : 'start';
	toggle.disabled = true;

	try {
		const response = await fetch('/' + action, { method: 'POST' });
		if (!response.ok) throw new Error('Request failed');
		running = !running;
		toggle.setAttribute('aria-label', running ? 'Stop stopwatch' : 'Start stopwatch');
		toggle.setAttribute('aria-pressed', String(running));
	} catch (error) {
		console.error('Unable to ' + action + ' stopwatch:', error);
	} finally {
		toggle.disabled = false;
	}
});

metronomeToggle.addEventListener('click', async () => {
	const action = metronomeRunning ? 'stop-metronome' : 'start-metronome';
	if (!metronomeRunning && !bpmInput.reportValidity()) return;
	metronomeToggle.disabled = true;
	bpmInput.disabled = true;

	try {
		const url = action === 'start-metronome'
			? `/start-metronome?bpm=${encodeURIComponent(bpmInput.value)}`
			: '/stop-metronome';
		const response = await fetch(url, { method: 'POST' });
		if (!response.ok) throw new Error('Request failed');
		setMetronomeRunning(action === 'start-metronome', action === 'start-metronome' ? bpmInput.value : null);
	} catch (error) {
		console.error('Unable to ' + action + ':', error);
		bpmInput.disabled = metronomeRunning;
	} finally {
		metronomeToggle.disabled = false;
	}
});

createReconnectingSocket(({ data }) => {
	if (data === 'stop-metronome') {
		setMetronomeRunning(false);
		return;
	}
	try {
		const message = JSON.parse(data);
		if (message.msg === 'start-metronome') setMetronomeRunning(true, message.bpm);
	} catch {}
});

