<script>
	let { children } = $props();
</script>

<svelte:head>
	<title>Sinhala Cards</title>
</svelte:head>

{@render children()}

<style>
	:global(*) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(body) {
		background: #ff8d01;
		min-height: 100vh;
		font-family: Georgia, serif;
	}
</style>
