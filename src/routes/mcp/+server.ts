import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { rulebookExport, inputSchema, METHODOLOGY_TEXT, FEEDBACK_TEXT } from '$lib/rulebook/export';

// A stateless, PII-free MCP server. It computes NOTHING and accepts NO personal data — it
// only relays the published rulebook + math so agents can discover the service in registries
// and load it as a tool. Streamable HTTP transport, single-response (no SSE, no sessions).
// Inputs never reach this server; agents compute scores on their own side.
export const prerender = false;

const SERVER_INFO = { name: 'life-scored', title: 'life. scored.', version: '1.0.0' };
const SUPPORTED_PROTOCOL = '2025-06-18';

const CORS: Record<string, string> = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Accept, MCP-Protocol-Version, Mcp-Session-Id, Authorization'
};

const NO_ARGS = { type: 'object', properties: {}, additionalProperties: false } as const;

const TOOLS = [
	{
		name: 'get_rulebook',
		title: 'Get the full rulebook + math',
		description:
			'The complete life-score rulebook and exact math: every rule (weight, bounds, evidence, source, formula), the input schema (what to ask the user), and the engine constants. Use this to compute a score on your OWN side — nothing is sent back.',
		inputSchema: NO_ARGS
	},
	{
		name: 'get_input_schema',
		title: 'Get the questions to ask',
		description:
			'Just the fields to collect from the user, with types, ranges/allowed values, defaults, and plain-language help. Ask only for what you do not already know; missing fields fall back to their default.',
		inputSchema: NO_ARGS
	},
	{
		name: 'get_methodology',
		title: 'How the scoring works',
		description:
			'Plain-English explanation of how scoring works, the two governing principles, what is deliberately left out (protected characteristics, luck), and the privacy stance. Use to answer "how does this work / is this fair" questions.',
		inputSchema: NO_ARGS
	},
	{
		name: 'how_to_give_feedback',
		title: 'How to propose an improvement',
		description:
			'How to suggest a better weight, a fresh source, or a new rule via GitHub, so improvements from many people aggregate in the open.',
		inputSchema: NO_ARGS
	}
];

function toolText(name: string): string | null {
	switch (name) {
		case 'get_rulebook':
			return JSON.stringify(rulebookExport());
		case 'get_input_schema':
			return JSON.stringify(inputSchema());
		case 'get_methodology':
			return METHODOLOGY_TEXT;
		case 'how_to_give_feedback':
			return FEEDBACK_TEXT;
		default:
			return null;
	}
}

const RULEBOOK_URI = 'https://lifescored.com/rules.json';
const RESOURCES = [
	{
		uri: RULEBOOK_URI,
		name: 'rulebook',
		title: 'life. scored. rulebook (rules.json)',
		description: 'The complete machine-readable rulebook and math. Compute on your own side; no PII is ever sent.',
		mimeType: 'application/json'
	}
];

type Rpc = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };

const ok = (id: Rpc['id'], result: unknown) => ({ jsonrpc: '2.0', id, result });
const err = (id: Rpc['id'], code: number, message: string) => ({ jsonrpc: '2.0', id, error: { code, message } });

/** Handle one JSON-RPC message. Returns a response object, or null for notifications. */
function handle(msg: Rpc): object | null {
	const isNotification = msg.id === undefined;
	const { id, method, params } = msg;

	if (!method) return isNotification ? null : err(id ?? null, -32600, 'Invalid Request: missing method');
	if (isNotification) return null; // we have no state to mutate; ack via HTTP 202

	switch (method) {
		case 'initialize':
			return ok(id, {
				protocolVersion: (params?.protocolVersion as string) || SUPPORTED_PROTOCOL,
				capabilities: { tools: {}, resources: {} },
				serverInfo: SERVER_INFO,
				instructions:
					'A discovery/relay server for life. scored. It performs no computation and accepts no personal data. Call get_rulebook (or get_input_schema) to learn the rules, ask the user for any missing inputs, then compute the score yourself. Nothing about the person should be sent anywhere.'
			});
		case 'ping':
			return ok(id, {});
		case 'tools/list':
			return ok(id, { tools: TOOLS });
		case 'tools/call': {
			const name = params?.name as string;
			const text = toolText(name);
			if (text === null) return err(id, -32602, `Unknown tool: ${name}`);
			return ok(id, { content: [{ type: 'text', text }], isError: false });
		}
		case 'resources/list':
			return ok(id, { resources: RESOURCES });
		case 'resources/templates/list':
			return ok(id, { resourceTemplates: [] });
		case 'resources/read': {
			const uri = params?.uri as string;
			if (uri !== RULEBOOK_URI) return err(id, -32602, `Unknown resource: ${uri}`);
			return ok(id, { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(rulebookExport()) }] });
		}
		case 'prompts/list':
			return ok(id, { prompts: [] });
		default:
			return err(id, -32601, `Method not found: ${method}`);
	}
}

export const POST: RequestHandler = async ({ request }) => {
	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		return json(err(null, -32700, 'Parse error'), { status: 200, headers: CORS });
	}

	const batch = Array.isArray(payload);
	const messages = (batch ? payload : [payload]) as Rpc[];
	const responses = messages.map(handle).filter((r): r is object => r !== null);

	// Only notifications/responses in the batch → 202 Accepted, no body (per spec).
	if (responses.length === 0) return new Response(null, { status: 202, headers: CORS });

	return json(batch ? responses : responses[0], { headers: CORS });
};

// No SSE stream offered (stateless), so a GET to the endpoint is 405 per the spec.
export const GET: RequestHandler = () =>
	json(err(null, -32601, 'This MCP endpoint is stateless; no SSE stream. Use POST.'), { status: 405, headers: CORS });

export const OPTIONS: RequestHandler = () => new Response(null, { status: 204, headers: CORS });
