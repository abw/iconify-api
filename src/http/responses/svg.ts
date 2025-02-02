import { defaultIconDimensions, flipFromString, iconToHTML, iconToSVG, rotateFromString } from '@iconify/utils';
import { defaultIconCustomisations, IconifyIconCustomisations } from '@iconify/utils/lib/customisations/defaults';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { getStoredIconData } from '../../data/icon-set/utils/get-icon';
import { iconSets } from '../../data/icon-sets';

/**
 * Generate SVG
 */
export function generateSVGResponse(prefix: string, name: string, query: FastifyRequest['query'], res: FastifyReply) {
	// Get icon set
	const iconSetItem = iconSets[prefix]?.item;
	if (!iconSetItem) {
		// No such icon set
		res.code(404).send(`No such icon set`)
		return;
	}

	// Check if icon exists
	const icons = iconSetItem.icons;
	if (!(icons.visible[name] || icons.hidden[name]) && !iconSetItem.icons.chars?.[name]) {
		// No such icon
		res.code(404).send(`No such icon`)
		return;
	}

	// Get icon
	getStoredIconData(iconSetItem, name, (data) => {
		if (!data) {
			// Invalid icon
			res.code(404).send(`Invalid icon`)
			return;
		}

		const q = (query || {}) as Record<string, string>;

		// Clean up customisations
		const customisations: IconifyIconCustomisations = {};

		// Dimensions
		customisations.width = q.width || defaultIconCustomisations.width;
		customisations.height = q.height || defaultIconCustomisations.height;

		// Rotation
		customisations.rotate = q.rotate ? rotateFromString(q.rotate, 0) : 0;

		// Flip
		if (q.flip) {
			flipFromString(customisations, q.flip);
		}

		// Generate SVG
		const svg = iconToSVG(data, customisations);

		let body = svg.body;
		if (q.box) {
			// Add bounding box
			body =
				'<rect x="' +
				(data.left || 0) +
				'" y="' +
				(data.top || 0) +
				'" width="' +
				(data.width || defaultIconDimensions.width) +
				'" height="' +
				(data.height || defaultIconDimensions.height) +
				'" fill="rgba(255, 255, 255, 0)" />' +
				body;
		}
		let html = iconToHTML(body, svg.attributes);

		// Change color
		const color = q.color;
		if (color && html.indexOf('currentColor') !== -1 && color.indexOf('"') === -1) {
			html = html.split('currentColor').join(color);
		}

		// Send SVG, optionally as attachment
		if (q.download) {
			res.header('Content-Disposition', 'attachment; filename="' + name + '.svg"');
		}
		res.type('image/svg+xml; charset=utf-8').send(html);
	});
}
