<script lang="ts">
	import { taskStats } from '$lib/stores/timer';
	import { buildTree, formatMinutes, type TreeNode } from '$lib/utils/taskTree';

	const stats = $derived($taskStats);
	const tree = $derived.by(() => buildTree(stats));

	let expandedPaths = $state<Set<string>>(new Set());

	function toggleExpand(path: string) {
		const next = new Set(expandedPaths);
		if (next.has(path)) {
			next.delete(path);
		} else {
			next.add(path);
		}
		expandedPaths = next;
	}

	function expandAll() {
		const all = new Set<string>();
		function collect(nodes: TreeNode[]) {
			for (const node of nodes) {
				if (node.children.length > 0) {
					all.add(node.path);
					collect(node.children);
				}
			}
		}
		collect(tree);
		expandedPaths = all;
	}

	function collapseAll() {
		expandedPaths = new Set();
	}

	const totalMinutes = $derived.by(() => {
		return Object.values(stats).reduce((sum, m) => sum + m, 0);
	});

	const taskCount = $derived(Object.keys(stats).length);
</script>

<div class="page">
	<header class="page-header">
		<a href="/" class="back-link" aria-label="Back to timer">
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
				<path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</a>
		<h1>History</h1>
	</header>

	{#if taskCount === 0}
		<div class="empty">
			<p class="empty-title">No sessions yet</p>
			<p class="empty-sub">Complete a focus session with a task name to see it here.</p>
		</div>
	{:else}
		<div class="stats-bar">
			<div class="stat">
				<span class="stat-val">{formatMinutes(totalMinutes)}</span>
				<span class="stat-lbl">Total</span>
			</div>
			<div class="stat-divider"></div>
			<div class="stat">
				<span class="stat-val">{taskCount}</span>
				<span class="stat-lbl">Tasks</span>
			</div>
			<div class="stat-divider"></div>
			<div class="stat">
				<span class="stat-val">{tree.length}</span>
				<span class="stat-lbl">Projects</span>
			</div>
		</div>

		<div class="toolbar">
			<button class="tool-btn" onclick={expandAll} type="button">Expand</button>
			<button class="tool-btn" onclick={collapseAll} type="button">Collapse</button>
		</div>

		<div class="tree">
			{#each tree.sort((a, b) => b.totalMinutes - a.totalMinutes) as node (node.path)}
				{@render treeNode(node, 0)}
			{/each}
		</div>
	{/if}
</div>

{#snippet treeNode(node: TreeNode, depth: number)}
	<div class="node" style="--depth: {depth}">
		<button
			class="node-row"
			class:expandable={node.children.length > 0}
			onclick={() => node.children.length > 0 && toggleExpand(node.path)}
			type="button"
		>
			<span class="node-left">
				{#if node.children.length > 0}
					<svg
						class="node-arrow"
						class:open={expandedPaths.has(node.path)}
						width="10"
						height="10"
						viewBox="0 0 16 16"
						fill="none"
					>
						<path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				{:else}
					<span class="node-dot"></span>
				{/if}
				<span class="node-name">{node.name}</span>
			</span>
			<span class="node-right">
				{#if node.directMinutes > 0 && node.children.length > 0}
					<span class="node-direct">{formatMinutes(node.directMinutes)}</span>
				{/if}
				<span class="node-total">{formatMinutes(node.totalMinutes)}</span>
			</span>
		</button>

		{#if node.children.length > 0 && expandedPaths.has(node.path)}
			<div class="node-children">
				{#each node.children.sort((a, b) => b.totalMinutes - a.totalMinutes) as child (child.path)}
					{@render treeNode(child, depth + 1)}
				{/each}
			</div>
		{/if}
	</div>
{/snippet}

<style>
	.page {
		max-width: 500px;
		margin: 0 auto;
		padding: 1.5rem;
		min-height: 100vh;
	}

	.page-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0 0 2rem;
	}

	.page-header h1 {
		font-family: var(--font-serif);
		font-size: 1.375rem;
		font-weight: 400;
		color: var(--color-ink);
		margin: 0;
	}

	.back-link {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		color: var(--color-ink-muted);
		text-decoration: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		transition: all 0.15s var(--ease-out);
	}

	.back-link:hover {
		color: var(--color-ink);
		background: white;
		border-color: var(--color-border-strong);
		box-shadow: var(--shadow-xs);
	}

	.empty {
		text-align: center;
		padding: 5rem 2rem;
	}

	.empty-title {
		font-family: var(--font-serif);
		font-size: 1.125rem;
		color: var(--color-ink-muted);
		margin: 0 0 0.5rem;
	}

	.empty-sub {
		font-size: 0.8125rem;
		color: var(--color-ink-faint);
		margin: 0;
	}

	.stats-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.25rem;
		padding: 1rem 1.5rem;
		background: white;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		margin-bottom: 1.25rem;
	}

	.stat {
		text-align: center;
	}

	.stat-val {
		display: block;
		font-family: var(--font-mono);
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-ink);
		letter-spacing: -0.02em;
	}

	.stat-lbl {
		display: block;
		font-size: 0.625rem;
		color: var(--color-ink-faint);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin-top: 0.125rem;
	}

	.stat-divider {
		width: 1px;
		height: 24px;
		background: var(--color-border);
	}

	.toolbar {
		display: flex;
		gap: 0.375rem;
		margin-bottom: 0.75rem;
	}

	.tool-btn {
		background: none;
		border: 1px solid var(--color-border);
		padding: 0.25rem 0.625rem;
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-family: var(--font-body);
		font-size: 0.6875rem;
		font-weight: 500;
		color: var(--color-ink-muted);
		transition: all 0.15s;
		letter-spacing: 0.01em;
	}

	.tool-btn:hover {
		background: white;
		border-color: var(--color-border-strong);
		color: var(--color-ink-soft);
	}

	.tree {
		background: white;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.node + .node {
		border-top: 1px solid var(--color-border);
	}

	.node-row {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.625rem 0.875rem;
		padding-left: calc(0.875rem + var(--depth) * 1rem);
		background: none;
		border: none;
		cursor: default;
		font-family: var(--font-body);
		font-size: 0.8125rem;
		color: var(--color-ink-soft);
		transition: background 0.1s;
		text-align: left;
	}

	.node-row.expandable {
		cursor: pointer;
	}

	.node-row.expandable:hover {
		background: var(--color-paper-warm);
	}

	.node-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}

	.node-arrow {
		flex-shrink: 0;
		color: var(--color-ink-faint);
		transition: transform 0.2s var(--ease-out);
	}

	.node-arrow.open {
		transform: rotate(90deg);
	}

	.node-dot {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--color-ink-faint);
		flex-shrink: 0;
		margin: 0 3px;
	}

	.node-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-weight: 500;
	}

	.node-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.node-direct {
		font-size: 0.625rem;
		color: var(--color-ink-faint);
		font-family: var(--font-mono);
	}

	.node-total {
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--color-ember);
		font-family: var(--font-mono);
		letter-spacing: -0.02em;
	}

	.node-children {
		border-top: 1px solid var(--color-border);
	}
</style>
