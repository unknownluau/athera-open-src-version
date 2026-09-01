<script lang="ts">
	import { navigate } from "svelte-routing";
	import Main from "../components/templates/Main.svelte";
	import request from "../lib/request";
	import { hasPermission } from "../stores/rank";
	import * as rank from "../stores/rank";

	const WEBHOOK_URL = "";

	let assetId: string = "";
	let RAPVal: string = "";
	let disabled = false;
	let loading = false;
	let errmsg: string | undefined;
	let successmsg: string | undefined;
	let postMessageEnabled = localStorage.getItem("athera_post_message") === "true";

	let assetDetails: any = {};
	let latestFetch;
	let oldRAP: string = "0";

	$: {
		if (latestFetch) {
			clearTimeout(latestFetch);
		}
		if (assetId && assetId.toString().length > 2) {
			latestFetch = setTimeout(() => {
				request
					.get("/product/details?assetId=" + assetId)
					.then((d) => {
						assetDetails = d.data;
						oldRAP = (d.data.recentAveragePrice ?? d.data.RecentAveragePrice ?? d.data.rap ?? d.data.RAP ?? "0").toString();
					})
					.catch(() => {
						assetDetails = {};
					});
			}, 500);
		} else {
			assetDetails = {};
		}
	}

	async function logToDiscord(url: string, payload: object) {
		try {
			if (!url) return;
			await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
		} catch (e) {
			console.error("Discord Log Failed", e);
		}
	}

	rank.promise.then(() => {
		if (!rank.hasPermission("SetAssetProduct")) {
			errmsg = "You don't have permission to set RAP";
			disabled = true;
		}
	});

	async function setRap() {
		errmsg = undefined;
		successmsg = undefined;
		loading = true;

		if (!assetId || RAPVal === null || RAPVal === undefined || RAPVal === "") {
			errmsg = "Both Asset ID and RAP value are required";
			loading = false;
			return;
		}

		const RAP = parseFloat(RAPVal);
		if (isNaN(RAP) || RAP < 0 || RAP > 100000000) {
			errmsg = "RAP must be a number between 0 and 100 million";
			loading = false;
			return;
		}

		try {
			let finalName = assetDetails.name;
			let finalOldRap = oldRAP;

			if (!finalName || assetDetails.id != assetId) {
				try {
					const d = await request.get("/product/details?assetId=" + assetId);
					finalName = d.data.name;
					finalOldRap = (d.data.recentAveragePrice ?? d.data.RecentAveragePrice ?? d.data.rap ?? d.data.RAP ?? "0").toString();
				} catch (e) {
					console.error("Failed to fetch pre-update details", e);
				}
			}

			const response = await request.post(`/asset/set-rap`, {
				assetId: parseInt(assetId),
				rap: RAP,
			});

			successmsg = `Set RAP for asset ${assetId} to ${RAP.toLocaleString()}`;

			if (postMessageEnabled) {
				await logToDiscord(WEBHOOK_URL, {
					embeds: [
						{
							title: finalName || "Asset " + assetId,
							url: `https://athera.sbs/catalog/${assetId}/--`,
							description: "Value has changed.",
							color: 16766720,
							thumbnail: { url: `https://athera.sbs/Thumbs/Asset.ashx?assetId=${assetId}&width=420&height=420` },
							fields: [
								{ name: "Old Value", value: finalOldRap, inline: true },
								{ name: "New Value", value: RAPVal, inline: true },
							],
							timestamp: new Date().toISOString(),
						},
					],
				});
			}
		} catch (error) {
			errmsg = error.message || "Failed to set RAP, please try again";
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Set RAP</title>
</svelte:head>

<Main>
	<div class="row">
		<div class="col-12">
			<h1>Set RAP</h1>

			{#if errmsg}
				<div class="alert alert-danger">{errmsg}</div>
			{/if}

			{#if successmsg}
				<div class="alert alert-success">{successmsg}</div>
			{/if}

			<div class="athera-gatekeeper-ui">
				<label class="gatekeeper-label">
					<input type="checkbox" bind:checked={postMessageEnabled} on:change={() => localStorage.setItem("athera_post_message", postMessageEnabled.toString())} />
					POST MESSAGE
				</label>
			</div>
		</div>

		{#if assetDetails.name}
			<div class="col-12 mt-2">
				<h2>Editing "{assetDetails.name}"</h2>
			</div>
		{/if}

		<div class="col-12 mt-3">
			<form on:submit|preventDefault={setRap}>
				<div class="mb-3">
					<label for="asset-id" class="form-label">Asset ID *</label>
					<input type="number" class="form-control" id="asset-id" bind:value={assetId} required disabled={disabled || loading} />
				</div>

				<div class="mb-3">
					<label for="rap-value" class="form-label">RAP Value *</label>
					<input type="number" class="form-control" id="rap-value" bind:value={RAPVal} placeholder="RAP" required disabled={disabled || loading} />
				</div>

				<div class="col-12 mt-4">
					<button type="submit" class="btn btn-success" disabled={disabled || loading || !assetId}>
						{#if loading}
							Setting RAP...
						{:else}
							Set
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
</Main>

<style>
	.alert {
		margin-bottom: 1rem;
	}

	.athera-gatekeeper-ui {
		margin-top: 10px;
		padding: 10px;
		background: #f8f9fa;
		border-left: 4px solid #28a745;
		display: flex;
		gap: 20px;
		align-items: center;
		border-radius: 4px;
	}
	.gatekeeper-label {
		font-weight: bold;
		font-size: 12px;
		display: flex;
		align-items: center;
		gap: 5px;
		margin-bottom: 0;
	}
</style>
