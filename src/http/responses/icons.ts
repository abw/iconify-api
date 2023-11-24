import type { FastifyReply, FastifyRequest } from 'fastify';
import { getStoredIconsData } from '../../data/icon-set/utils/get-icons';
import { iconSets } from '../../data/icon-sets';
import { checkJSONPQuery, sendJSONResponse } from '../helpers/json';

/**
 * Generate icons data
 */
export function generateIconsDataResponse(
	prefix: string,
	wrapJS: boolean,
	query: FastifyRequest['query'],
	res: FastifyReply
) {
	const q = (query || {}) as Record<string, string>;
	const names = q.icons?.split(',');

	if (!names || !names.length) {
		// Missing or invalid icons parameter
		res.code(400).send('Missing or invalid icons parameter');
		return;
	}

	// Check for JSONP
	const wrap = checkJSONPQuery(q, wrapJS, 'SimpleSVG._loaderCallback');
	if (!wrap) {
		// Invalid JSONP callback
		res.code(400).send('Invalid JSONP callback');
		return;
	}

	// Get icon set
	const iconSet = iconSets[prefix];
	if (!iconSet) {
		// No such icon set
		res.code(404).send('No such icon set');
		return;
	}

	// Get icons
	getStoredIconsData(iconSet.item, names, (data) => {
		// Send data
		sendJSONResponse(data, q, wrap, res);
	});
}
