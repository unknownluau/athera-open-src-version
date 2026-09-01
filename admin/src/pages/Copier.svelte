<script lang="ts">
	import Main from "../components/templates/Main.svelte";
	import request from "../lib/request";

	let sourceDomain = "";
	let sourceAssetId = "";
	let isForSale = false;
	let price = "";
	let loading = false;
	let result: string | undefined;
	let error: string | undefined;

	let packageAssetId = "";
	let packageSubAssetIds = "";
	let packageLoading = false;
	let packageResult: string | undefined;
	let packageError: string | undefined;

	let activeTab: "asset" | "package" = "asset";

	async function copyAsset() {
		loading = true;
		error = undefined;
		result = undefined;
		try {
			const body: Record<string, any> = {
				sourceDomain,
				sourceAssetId: parseInt(sourceAssetId, 10),
				isForSale,
			};
			if (price) body.price = parseInt(price, 10);
			const res = await request.post("/copier/asset", body);
			result = `Asset copied! ID: ${res.data.assetId}`;
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	async function copyPackage() {
		packageLoading = true;
		packageError = undefined;
		packageResult = undefined;
		try {
			const res = await request.post("/copier/package", {
				sourceDomain,
				sourceAssetId: parseInt(packageAssetId, 10),
				packageSubAssetIds,
			});
			packageResult = `Package copied! Asset ID: ${res.data.assetId} (${res.data.subAssetsCopied} sub-assets copied)`;
		} catch (e) {
			packageError = e.message;
		} finally {
			packageLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Copier</title>
</svelte:head>

<Main>
	<div class="row">
		<div class="col-12">
			<h1>Copier</h1>
			<p class="text-muted">Copy assets and packages from any ath era revival.</p>

			<div class="mb-3">
				<label for="sourceDomain">Source Domain</label>
				<input type="text" class="form-control" id="sourceDomain" bind:value={sourceDomain} placeholder="e.g. https://example.com" disabled={loading || packageLoading} />
				<small class="text-muted">The base URL of the source instance (with or without https://)</small>
			</div>

			<ul class="nav nav-tabs mb-3">
				<li class="nav-item">
					<button class="nav-link" class:active={activeTab === "asset"} on:click|preventDefault={() => activeTab = "asset"}>Copy Asset</button>
				</li>
				<li class="nav-item">
					<button class="nav-link" class:active={activeTab === "package"} on:click|preventDefault={() => activeTab = "package"}>Copy Package</button>
				</li>
			</ul>

			{#if activeTab === "asset"}
				<div class="card mb-4">
					<div class="card-body">
						<h5>Copy Single Asset</h5>
						<div class="row">
							<div class="col-6 mb-3">
								<label for="sourceAssetId">Source Asset ID</label>
								<input type="number" class="form-control" id="sourceAssetId" bind:value={sourceAssetId} disabled={loading} />
							</div>
							<div class="col-6 mb-3">
								<label for="price">Price (Robux, optional)</label>
								<input type="number" class="form-control" id="price" bind:value={price} placeholder="Leave empty for source price" disabled={loading} />
							</div>
							<div class="col-6 mb-3">
								<div class="form-check">
									<input type="checkbox" class="form-check-input" id="isForSale" bind:checked={isForSale} disabled={loading} />
									<label class="form-check-label" for="isForSale">Mark as for sale</label>
								</div>
							</div>
						</div>
						<button class="btn btn-success" disabled={loading} on:click|preventDefault={copyAsset}>
							{loading ? "Copying..." : "Copy Asset"}
						</button>
					</div>
				</div>
			{/if}

			{#if activeTab === "package"}
				<div class="card mb-4">
					<div class="card-body">
						<h5>Copy Package</h5>
						<p class="text-muted">Copies a package and all specified sub-assets from the source domain.</p>
						<div class="row">
							<div class="col-6 mb-3">
								<label for="packageAssetId">Package Asset ID</label>
								<input type="number" class="form-control" id="packageAssetId" bind:value={packageAssetId} disabled={packageLoading} />
							</div>
							<div class="col-6 mb-3">
								<label for="packageSubAssetIds">Sub-asset IDs</label>
								<input type="text" class="form-control" id="packageSubAssetIds" bind:value={packageSubAssetIds} placeholder="e.g. 1234, 5678, 9012" disabled={packageLoading} />
								<small class="text-muted">Comma-separated IDs of assets that belong to this package</small>
							</div>
						</div>
						<button class="btn btn-success" disabled={packageLoading} on:click|preventDefault={copyPackage}>
							{packageLoading ? "Copying..." : "Copy Package"}
						</button>
					</div>
				</div>
			{/if}

			{#if activeTab === "asset" && result}
				<div class="alert alert-success">{result}</div>
			{/if}
			{#if activeTab === "asset" && error}
				<div class="alert alert-danger">{error}</div>
			{/if}
			{#if activeTab === "package" && packageResult}
				<div class="alert alert-success">{packageResult}</div>
			{/if}
			{#if activeTab === "package" && packageError}
				<div class="alert alert-danger">{packageError}</div>
			{/if}
		</div>
	</div>
</Main>
