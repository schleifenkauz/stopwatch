const toggle = document.querySelector('#toggle');
let running = false;

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