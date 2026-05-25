import { base } from '$app/paths';

export const prerender = true;

function parseCSV(text) {
	const lines = text.trim().split('\n');
	return lines.slice(1).map((line) => {
		const fields = [];
		let current = '';
		let inQuotes = false;
		for (const ch of line) {
			if (ch === '"') {
				inQuotes = !inQuotes;
			} else if (ch === ',' && !inQuotes) {
				fields.push(current.trim());
				current = '';
			} else {
				current += ch;
			}
		}
		fields.push(current.trim());
		return { chapter: '', sinhala: fields[0] ?? '', english: fields[1] ?? '' };
	});
}

export async function load({ fetch }) {
	const res = await fetch(`${base}/new_vocab.csv`);
	const text = await res.text();
	return { cards: parseCSV(text) };
}
