// Client-side share card. Renders a branded PNG of a score breakdown entirely on the device —
// nothing is ever sent to a server, matching the privacy guarantee of the rest of the app. The
// caller shares it via the Web Share API (files) or downloads it.
import type { ScoreResult } from '../engine/score';

const W = 1200;
const H = 630;
const SCALE = 2; // render at 2x for crisp downloads / retina unfurls
const M = 72; // outer margin

const C = {
	bg: '#14161a',
	ink: '#e7e4dc',
	dim: '#8b8f99',
	gold: '#d9a441', // --moves
	line: 'rgba(255,255,255,0.10)'
};
const DISPLAY = "'Fraunces Variable', Georgia, serif";
const MONO = "'JetBrains Mono Variable', ui-monospace, monospace";

const n = (x: number) => Math.round(x).toLocaleString('en-US');

async function ensureFonts() {
	try {
		const f = (document as unknown as { fonts: FontFaceSet }).fonts;
		await f.ready;
		await Promise.all([f.load(`700 60px ${DISPLAY}`), f.load(`400 52px ${DISPLAY}`), f.load(`500 18px ${MONO}`)]);
	} catch {
		// Fonts unavailable (e.g. headless) — fall through to system fallbacks; layout still holds.
	}
}

/** Render the breakdown-forward score card. Returns a PNG blob. */
export async function renderScoreCard(result: ScoreResult): Promise<Blob> {
	await ensureFonts();

	const canvas = document.createElement('canvas');
	canvas.width = W * SCALE;
	canvas.height = H * SCALE;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('no 2d context');
	ctx.scale(SCALE, SCALE);
	ctx.textBaseline = 'alphabetic';

	// background
	ctx.fillStyle = C.bg;
	ctx.fillRect(0, 0, W, H);

	// title + gold rule
	ctx.fillStyle = C.ink;
	ctx.font = `700 58px ${DISPLAY}`;
	const title = 'life. scored.';
	ctx.fillText(title, M, 112);
	const titleW = ctx.measureText(title).width;
	ctx.fillStyle = C.gold;
	ctx.fillRect(M, 130, titleW, 4);

	ctx.fillStyle = C.dim;
	ctx.font = `500 17px ${MONO}`;
	ctx.letterSpacing = '0.5px';
	ctx.fillText('the breakdown is the point — not the total.', M, 168);
	ctx.letterSpacing = '0px';

	// tier split: starting point (luck) vs your moves
	const tierLabel = (x: number, label: string) => {
		ctx.fillStyle = C.dim;
		ctx.font = `500 16px ${MONO}`;
		ctx.letterSpacing = '2px';
		ctx.fillText(label.toUpperCase(), x, 250);
		ctx.letterSpacing = '0px';
	};
	tierLabel(M, 'starting point');
	tierLabel(W / 2 + 20, 'your moves');

	ctx.font = `400 54px ${DISPLAY}`;
	ctx.fillStyle = C.ink;
	ctx.fillText(n(result.tierSubtotals.starting_point), M, 312);
	ctx.fillStyle = C.gold;
	ctx.fillText(n(result.tierSubtotals.your_moves), W / 2 + 20, 312);

	// divider
	ctx.fillStyle = C.line;
	ctx.fillRect(M, 358, W - 2 * M, 1);

	// what's carrying the score — top contributing rows
	ctx.fillStyle = C.dim;
	ctx.font = `500 16px ${MONO}`;
	ctx.letterSpacing = '2px';
	ctx.fillText('CARRYING YOUR SCORE', M, 400);
	ctx.letterSpacing = '0px';

	const top = result.perRule
		.filter((r) => r.enabled && r.value > 0)
		.sort((a, b) => b.value - a.value)
		.slice(0, 3);
	top.forEach((r, i) => {
		const y = 444 + i * 42;
		ctx.fillStyle = C.ink;
		ctx.font = `400 25px ${DISPLAY}`;
		ctx.textAlign = 'left';
		ctx.fillText(r.label, M, y);
		ctx.fillStyle = C.gold;
		ctx.font = `500 22px ${MONO}`;
		ctx.textAlign = 'right';
		ctx.fillText(`+${n(r.value)}`, W - M, y);
		ctx.textAlign = 'left';
	});

	// footer: composite (de-emphasized) left, brand right
	const fy = H - 40;
	ctx.fillStyle = C.dim;
	ctx.font = `500 18px ${MONO}`;
	ctx.fillText(`composite ${n(result.composite)} · the number everyone else fixates on`, M, fy);
	ctx.textAlign = 'right';
	ctx.fillStyle = C.ink;
	ctx.fillText('lifescored.com', W - M, fy);
	ctx.textAlign = 'left';

	return await new Promise<Blob>((resolve, reject) =>
		canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
	);
}
