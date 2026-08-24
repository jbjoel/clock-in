/**
 * Utilities for hierarchical task paths using '/' as separator.
 * e.g. "myepic/myfeature/sectionA"
 */

export interface TreeNode {
	name: string; // segment name (e.g. "sectionA")
	path: string; // full path (e.g. "myepic/myfeature/sectionA")
	directMinutes: number; // time tracked directly on this node
	totalMinutes: number; // time including all descendants
	children: TreeNode[];
}

/**
 * Build a tree from a flat taskStats record.
 */
export function buildTree(stats: Record<string, number>): TreeNode[] {
	const root: TreeNode[] = [];

	for (const [path, minutes] of Object.entries(stats)) {
		const segments = path.split('/');
		let current = root;

		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			const fullPath = segments.slice(0, i + 1).join('/');
			let node = current.find((n) => n.name === segment);

			if (!node) {
				node = { name: segment, path: fullPath, directMinutes: 0, totalMinutes: 0, children: [] };
				current.push(node);
			}

			if (i === segments.length - 1) {
				node.directMinutes += minutes;
			}

			current = node.children;
		}
	}

	// Calculate totalMinutes (rollup)
	function rollup(nodes: TreeNode[]): number {
		let sum = 0;
		for (const node of nodes) {
			const childTotal = rollup(node.children);
			node.totalMinutes = node.directMinutes + childTotal;
			sum += node.totalMinutes;
		}
		return sum;
	}

	rollup(root);

	return root;
}

/**
 * Get children at a given prefix path.
 * If prefix is empty, returns top-level entries.
 */
export function getChildrenAtPath(
	stats: Record<string, number>,
	history: string[],
	prefix: string
): { name: string; path: string; totalMinutes: number }[] {
	const tree = buildTree(stats);

	if (!prefix) {
		return tree
			.sort((a, b) => b.totalMinutes - a.totalMinutes)
			.map((n) => ({ name: n.name, path: n.path, totalMinutes: n.totalMinutes }));
	}

	const segments = prefix.split('/').filter(Boolean);
	let current = tree;

	for (const segment of segments) {
		const node = current.find((n) => n.name === segment);
		if (!node) return [];
		current = node.children;
	}

	return current
		.sort((a, b) => b.totalMinutes - a.totalMinutes)
		.map((n) => ({ name: n.name, path: n.path, totalMinutes: n.totalMinutes }));
}

/**
 * Get rollup stats for a prefix (sum of all tasks starting with prefix/).
 */
export function getRollupMinutes(stats: Record<string, number>, prefix: string): number {
	let total = 0;
	const prefixWithSlash = prefix + '/';
	for (const [path, minutes] of Object.entries(stats)) {
		if (path === prefix || path.startsWith(prefixWithSlash)) {
			total += minutes;
		}
	}
	return total;
}

/**
 * Get suggestions for the autocomplete based on current input.
 * - If input ends with '/', show children of that prefix
 * - Otherwise, filter all history items matching the input
 */
export function getAutocompleteSuggestions(
	input: string,
	history: string[],
	stats: Record<string, number>
): { path: string; displayName: string; minutes: number; isFolder: boolean }[] {
	const trimmed = input.trim();

	// If input ends with '/', show children of that prefix
	if (trimmed.endsWith('/')) {
		const prefix = trimmed.slice(0, -1);
		const children = getChildrenAtPath(stats, history, prefix);
		return children.map((c) => ({
			path: c.path,
			displayName: c.name,
			minutes: c.totalMinutes,
			isFolder: hasChildren(stats, c.path)
		}));
	}

	// Otherwise filter history by input
	if (!trimmed) {
		// Show all history items with rollup stats
		return history.map((task) => ({
			path: task,
			displayName: task,
			minutes: getRollupMinutes(stats, task),
			isFolder: hasChildren(stats, task)
		}));
	}

	const lower = trimmed.toLowerCase();

	// Filter history items that match
	const matched = history.filter((t) => t.toLowerCase().includes(lower));

	// Also include path-based matches from stats (tasks not in history)
	const statsMatches = Object.keys(stats)
		.filter((t) => t.toLowerCase().includes(lower) && !matched.includes(t))
		.sort((a, b) => (stats[b] || 0) - (stats[a] || 0));

	const all = [...matched, ...statsMatches].slice(0, 20);

	return all.map((task) => ({
		path: task,
		displayName: task,
		minutes: getRollupMinutes(stats, task),
		isFolder: hasChildren(stats, task)
	}));
}

/**
 * Check if a path has children in the stats.
 */
export function hasChildren(stats: Record<string, number>, path: string): boolean {
	const prefix = path + '/';
	return Object.keys(stats).some((k) => k.startsWith(prefix));
}

export function formatMinutes(minutes: number): string {
	if (minutes <= 0) return '';
	if (minutes < 60) return `${minutes}m`;
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
