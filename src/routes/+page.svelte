<script>
	let { data } = $props();

	// Leitner boxes: box 0 = daily, box 1 = every 2nd, box 2 = every 4th, box 3 = every 8th
	const INTERVALS = [1, 2, 4, 8];

	// State stored in localStorage
	function loadState() {
		if (typeof localStorage === 'undefined') return null;
		try {
			return JSON.parse(localStorage.getItem('leitner') ?? 'null');
		} catch {
			return null;
		}
	}

	function saveState(state) {
		localStorage.setItem('leitner', JSON.stringify(state));
	}

	function initState(cards) {
		const saved = loadState();
		if (saved && saved.boxes) return saved;
		return {
			boxes: cards.map(() => 0),   // all cards start in box 0
			deleted: [],
			sessionCount: 0
		};
	}

	// Pick a card index from the eligible pool based on current session count
	function pickCard(state) {
		const deleted = new Set(state.deleted ?? []);
		const eligible = state.boxes
			.map((box, i) => ({ box, i }))
			.filter(({ box, i }) => !deleted.has(i) && state.sessionCount % INTERVALS[box] === 0);
		if (eligible.length === 0) return Math.floor(Math.random() * state.boxes.length);
		return eligible[Math.floor(Math.random() * eligible.length)].i;
	}

	const cards = data.cards;
	let state = $state(initState(cards));
	let cardIndex = $state(pickCard(state));
	let showSinhala = $state(Math.random() < 0.5);
	let revealed = $state(false);

	const card = $derived(cards[cardIndex]);
	const front = $derived(showSinhala ? card.sinhala : card.english);
	const back = $derived(showSinhala ? card.english : card.sinhala);
	const frontLabel = $derived(showSinhala ? 'Sinhala' : 'English');
	const backLabel = $derived(showSinhala ? 'English' : 'Sinhala');
	const box = $derived(state.boxes[cardIndex]);

	function reveal() {
		revealed = true;
	}

	function deleteCard() {
		const deleted = [...(state.deleted ?? []), cardIndex];
		state = { ...state, deleted };
		saveState(state);
		cardIndex = pickCard(state);
		showSinhala = Math.random() < 0.5;
		revealed = false;
	}

	function answer(correct) {
		const newBoxes = [...state.boxes];
		if (correct) {
			newBoxes[cardIndex] = Math.min(box + 1, INTERVALS.length - 1);
		} else {
			newBoxes[cardIndex] = 0;
		}
		state = { boxes: newBoxes, sessionCount: state.sessionCount + 1 };
		saveState(state);
		cardIndex = pickCard(state);
		showSinhala = Math.random() < 0.5;
		revealed = false;
	}

	const boxCounts = $derived(
		INTERVALS.map((_, b) => state.boxes.filter((v) => v === b).length)
	);

	function downloadDeleted() {
		const rows = (state.deleted ?? []).map((i) => {
			const c = cards[i];
			return `"${c.chapter}","${c.sinhala.replace(/"/g, '""')}","${c.english.replace(/"/g, '""')}"`;
		});
		const csv = ['Chapter,Sinhala,English', ...rows].join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'deleted-cards.csv';
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<main>
	<div class="card">

		<div class="content">
			<div class="label">{frontLabel}</div>
			<div class="front">{front}</div>

			{#if revealed}
				<hr />
				<div class="label">{backLabel}</div>
				<div class="back">{back}</div>
			{/if}
		</div>

		<div class="actions">
			{#if !revealed}
				<button onclick={reveal}>Reveal</button>
				<button class="delete" onclick={deleteCard}>Delete</button>
			{:else}
				<button class="wrong" onclick={() => answer(false)}>Wrong</button>
				<button class="right" onclick={() => answer(true)}>Got it</button>
				<button class="delete" onclick={deleteCard}>Delete</button>
			{/if}
		</div>

		<div class="stats">
			{#each INTERVALS as _, b}
				<span class="box" class:active={b === box}>
					Box {b + 1}: {boxCounts[b]}
				</span>
			{/each}
			<button class="download" onclick={downloadDeleted} disabled={(state.deleted ?? []).length === 0}>
				↓ deleted ({(state.deleted ?? []).length})
			</button>
		</div>
	</div>
</main>

<style>
	main {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.card {
		background: #ffce56;
		width: 560px;
		max-width: 100%;
		padding: 2.5rem 2rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-height: 160px;
	}

	.label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #7a5500;
	}

	.front {
		font-size: 2rem;
		font-weight: bold;
		line-height: 1.2;
		color: #1a0d00;
	}

	.back {
		font-size: 1.6rem;
		color: #1a0d00;
	}

	hr {
		border: none;
		border-top: 1px solid #c89a00;
		margin: 0.25rem 0;
	}

	.actions {
		display: flex;
		gap: 0.75rem;
	}

	button {
		padding: 0.6rem 1.4rem;
		font-size: 0.9rem;
		font-family: Georgia, serif;
		cursor: pointer;
		border: 2px solid #1a0d00;
		background: #ffce56;
		color: #1a0d00;
	}

	button:hover {
		background: #f0b800;
	}

	button.right {
		background: #1a0d00;
		color: #ffce56;
	}

	button.right:hover {
		background: #3a2000;
	}

	button.wrong {
		background: #ffce56;
	}

	button.delete {
		margin-left: auto;
		border-color: #7a5500;
		color: #7a5500;
	}

	button.delete:hover {
		background: #7a5500;
		color: #ffce56;
	}

	.stats {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
		padding-top: 0.5rem;
		border-top: 1px solid #c89a00;
		font-size: 0.75rem;
		color: #7a5500;
	}

	.box {
		opacity: 0.5;
	}

	.box.active {
		opacity: 1;
		font-weight: bold;
		color: #1a0d00;
	}

	button.download {
		margin-left: auto;
		padding: 0.25rem 0.6rem;
		font-size: 0.7rem;
		border: 1px solid #7a5500;
		color: #7a5500;
		background: #ffce56;
	}

	button.download:hover:not(:disabled) {
		background: #7a5500;
		color: #ffce56;
	}

	button.download:disabled {
		opacity: 0.35;
		cursor: default;
	}
</style>
