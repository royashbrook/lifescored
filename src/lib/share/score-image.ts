export interface ScoreImageData {
	composite: number;
	startingPoint: number;
	yourMoves: number;
}

/** Render a square brand card with the composite number. Browser-only; null if unsupported. */
export async function renderScoreImage(data: ScoreImageData): Promise<File | null> {
	if (typeof document === 'undefined') return null;
	const size = 1080;
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d');
	if (!ctx) return null;

	// Best-effort: wait for the brand fonts so canvas text uses them, not a fallback.
	try {
		await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
	} catch {
		// fonts API unavailable — proceed with system fallbacks
	}

	ctx.fillStyle = '#14161a';
	ctx.fillRect(0, 0, size, size);

	ctx.textAlign = 'center';
	ctx.fillStyle = '#e7e4dc';
	ctx.font = '600 84px "Fraunces Variable", Georgia, serif';
	ctx.fillText('life. scored.', size / 2, 300);

	ctx.fillStyle = '#8b8f99';
	ctx.font = "500 30px 'JetBrains Mono Variable', monospace";
	ctx.fillText('MY COMPOSITE', size / 2, 470);

	ctx.fillStyle = '#e7e4dc';
	ctx.font = "700 300px 'JetBrains Mono Variable', monospace";
	ctx.fillText(Math.round(data.composite).toLocaleString('en-US'), size / 2, 720);

	// accent rule
	ctx.strokeStyle = '#d9a441';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(size / 2 - 200, 800);
	ctx.lineTo(size / 2 + 200, 800);
	ctx.stroke();

	ctx.fillStyle = '#8b8f99';
	ctx.font = "400 30px 'JetBrains Mono Variable', monospace";
	ctx.fillText(
		`starting point ${Math.round(data.startingPoint)}  ·  my moves ${Math.round(data.yourMoves)}`,
		size / 2,
		870
	);

	ctx.fillStyle = '#7c93b8';
	ctx.font = "400 30px 'JetBrains Mono Variable', monospace";
	ctx.fillText('lifescored.com', size / 2, 980);

	const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
	if (!blob) return null;
	return new File([blob], 'life-scored.png', { type: 'image/png' });
}
