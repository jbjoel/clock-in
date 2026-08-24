<script lang="ts">
	import { taskStats, taskHistory } from '$lib/stores/timer';
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
</script>

<div class="history-page">
	<header class="page-header">
		<a href="/" class="back-link">
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
				<path
					d="M12 4L6 10L12 16"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			Back
		</a>
		<h1>Task History</h1>
	</header>

	{#if Object.keys(stats).length === 0}
		<div class="empty-state">
			<p>No task history yet.</p>
			<p class="empty-hint">Complete a timer with a task name to see your history here.</p>
		</div>
	{:else}
		<div class="summary">
			<div class="summary-stat">
				<span class="summary-value">{formatMinutes(totalMinutes)}</span>
				<span class="summary-label">Total focused</span>
			</div>
			<div class="summary-stat">
				<span class="summary-value">{Object.keys(stats).length}</span>
				<span class="summary-label">Tasks</span>
			</div>
			<div class="summary-stat">
				<span class="summary-value">{tree.length}</span>
				<span class="summary-label">Top-level</span>
			</div>
		</div>

		<div class="tree-controls">
			<button class="control-btn" onclick={expandAll} type="button">Expand all</button>
			<button class="control-btn" onclick={collapseAll} type="button">Collapse all</button>
		</div>

		<div class="tree">
			{#each tree.sort((a, b) => b.totalMinutes - a.totalMinutes) as node (node.path)}
				{@render treeNode(node, 0)}
			{/each}
		</div>
	{/if}
</div>

{#snippet treeNode(node: TreeNode, depth: number)}
	<div class="tree-item" style="--depth: {depth}">
		<button
			class="tree-item-btn"
			class:has-children={node.children.length > 0}
			onclick={() => node.children.length > 0 && toggleExpand(node.path)}
			type="button"
		>
			<span class="tree-item-left">
				{#if node.children.length > 0}
					<svg
						class="expand-icon"
						class:expanded={expandedPaths.has(node.path)}
						width="12"
						height="12"
						viewBox="0 0 16 16"
						fill="none"
					>
						<path
							d="M6 4L10 8L6 12"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				{:else}
					<span class="expand-spacer"></span>
				{/if}
				<span class="tree-item-name">{node.name}</span>
			</span>
			<span class="tree-item-right">
				{#if node.directMinutes > 0 && node.children.length > 0}
					<span class="direct-time">{formatMinutes(node.directMinutes)}</span>
					<span class="time-sep">/</span>
				{/if}
				<span class="total-time">{formatMinutes(node.totalMinutes)}</span>
			</span>
		</button>

		{#if node.children.length > 0 && expandedPaths.has(node.path)}
			<div class="tree-children">
				{#each node.children.sort((a, b) => b.totalMinutes - a.totalMinutes) as child (child.path)}
					{@render treeNode(child, depth + 1)}
				{/each}
			</div>
		{/if}
	</div>
{/snippet}

<style>
	.history-page {
		max-width: 600px;
		margin: 0 auto;
		padding: 1rem;
		min-height: 100vh;
	}

	.page-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem 0 1.5rem;
	}

	.page-header h1 {
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 800;
		color: var(--color-warm-gray-800);
		margin: 0;
	}

	.back-link {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		color: var(--color-coral-500);
		text-decoration: none;
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 0.875rem;
		padding: 0.5rem 0.75rem;
		border-radius: 10px;
		transition: background 0.15s;
	}

	.back-link:hover {
		background: var(--color-warm-gray-50);
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: var(--color-warm-gray-500);
	}

	.empty-hint {
		font-size: 0.875rem;
		color: var(--color-warm-gray-400);
	}

	.summary {
		display: flex;
		gap: 1rem;
		padding: 1.25rem;
		background: white;
		border-radius: 16px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
		margin-bottom: 1.5rem;
	}

	.summary-stat {
		flex: 1;
		text-align: center;
	}

	.summary-value {
		display: block;
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 800;
		color: var(--color-coral-500);
	}

	.summary-label {
		display: block;
		font-size: 0.75rem;
		color: var(--color-warm-gray-500);
		margin-top: 0.25rem;
	}

	.tree-controls {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.control-btn {
		background: var(--color-warm-gray-100);
		border: none;
		padding: 0.375rem 0.75rem;
		border-radius: 8px;
		cursor: pointer;
		font-family: var(--font-display);
		font-size: 0.75rem;
		color: var(--color-warm-gray-600);
		transition: all 0.15s;
	}

	.control-btn:hover {
		background: var(--color-warm-gray-200);
	}

	.tree {
		background: white;
		border-radius: 16px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
		overflow: hidden;
	}

	.tree-item {
		border-bottom: 1px solid var(--color-warm-gray-100);
	}

	.tree-item:last-child {
		border-bottom: none;
	}

	.tree-item-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		padding-left: calc(1rem + var(--depth) * 1.25rem);
		background: none;
		border: none;
		cursor: default;
		font-family: var(--font-display);
		font-size: 0.875rem;
		color: var(--color-warm-gray-700);
		transition: background 0.15s;
		text-align: left;
	}

	.tree-item-btn.has-children {
		cursor: pointer;
	}

	.tree-item-btn.has-children:hover {
		background: var(--color-warm-gray-50);
	}

	.tree-item-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}

	.expand-icon {
		flex-shrink: 0;
		color: var(--color-warm-gray-400);
		transition: transform 0.2s;
	}

	.expand-icon.expanded {
		transform: rotate(90deg);
	}

	.expand-spacer {
		width: 12px;
		flex-shrink: 0;
	}

	.tree-item-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tree-item-right {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.direct-time {
		font-size: 0.7rem;
		color: var(--color-warm-gray-400);
	}

	.time-sep {
		font-size: 0.7rem;
		color: var(--color-warm-gray-300);
	}

	.total-time {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-coral-500);
	}

	.tree-children {
		border-top: 1px solid var(--color-warm-gray-50);
	}
</style>
