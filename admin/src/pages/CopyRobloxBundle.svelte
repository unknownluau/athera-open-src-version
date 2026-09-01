<script lang="ts">
	import { link } from "svelte-routing";
	import Main from "../components/templates/Main.svelte";
	import request from "../lib/request";
	import * as rank from "../stores/rank";

	// --- ASSET LOGGER CONFIG ---
	const ASSET_LOGGER_WEBHOOK = "";

	let disabled = false;
	let errorMessage: string | undefined;
	let createdAssetId: number | undefined;
	let force = "false";
	let didError = false;

	async function logToDiscord(url: string, payload: object) {
		try {
			await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
		} catch (e) {
			console.error("Discord Log Failed", e);
		}
	}

	const checkRenderer = (id: number): Promise<boolean> => {
		return new Promise((resolve) => {
			const img = new Image();
			img.crossOrigin = "Anonymous";
			const timeout = setTimeout(() => {
				logToDiscord(ASSET_LOGGER_WEBHOOK, { embeds: [{ title: "⚠️ Renderer Timeout", color: 15105570, fields: [{ name: "Asset ID", value: id.toString() }] }] });
				resolve(true);
			}, 5000);

			img.onload = () => {
				clearTimeout(timeout);
				const canvas = document.createElement("canvas");
				canvas.width = img.width;
				canvas.height = img.height;
				const ctx = canvas.getContext("2d");
				ctx.drawImage(img, 0, 0);
				try {
					const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
					let isBlank = true;
					for (let i = 3; i < data.length; i += 4) {
						if (data[i] > 10) {
							isBlank = false;
							break;
						}
					}
					if (isBlank) alert("Bundle image didn't render correctly!");
					resolve(!isBlank);
				} catch {
					resolve(true);
				}
			};
			img.onerror = () => {
				clearTimeout(timeout);
				resolve(true);
			};
			img.src = `https://athera.sbs/Thumbs/Asset.ashx?assetId=${id}&width=420&height=420&t=${Date.now()}`;
		});
	};

	async function handleCreateBundle() {
		const input = document.getElementById("url") as HTMLInputElement;
		const bundleIdMatch = input.value.match(/[0-9]+/);
		if (!bundleIdMatch) {
			errorMessage = "Invalid Bundle URL";
			return;
		}

		disabled = true;
		createdAssetId = undefined;
		errorMessage = undefined;

		try {
			const d = await request.post("/bundle/copy-from-roblox?bundleId=" + parseInt(bundleIdMatch[0], 10), {});
			createdAssetId = d.data.assetId;

			// Trigger Asset Logger
			const renderOk = await checkRenderer(createdAssetId);
			await logToDiscord(ASSET_LOGGER_WEBHOOK, {
				embeds: [
					{
						title: renderOk ? "✅ Bundle Renderer Success" : "⚠️ Bundle Renderer Warning",
						color: renderOk ? 3066993 : 15105570,
						fields: [{ name: "Asset ID", value: createdAssetId.toString() }],
						timestamp: new Date().toISOString(),
					},
				],
			});
		} catch (e) {
			errorMessage = e.message;
			didError = true;
		} finally {
			disabled = false;
		}
	}
</script>

<svelte:head>
	<title>Copy Roblox Bundle</title>
</svelte:head>

<Main>
	<div class="row">
		<div class="col-12">
			<h1>Copy Roblox Bundle</h1>
			{#if errorMessage}
				<p class="err">{errorMessage}</p>
			{/if}
			{#if createdAssetId !== undefined}
				<p>Link: <a href={`/catalog/${createdAssetId}/--`}>View on site</a></p>
				<p>Product: <a use:link href={`/admin/product/update?assetId=${createdAssetId}`}>Update Product</a></p>
			{/if}
		</div>
		<div class="col-12">
			<label for="url">Roblox URL</label>
			<input type="text" class="form-control" id="url" {disabled} />
		</div>

		<div class="col-6 mt-4">
			<button class="btn btn-success" {disabled} on:click|preventDefault={handleCreateBundle}>
				{disabled ? "Creating..." : "Create Bundle"}
			</button>
		</div>
	</div>
</Main>

<style>
	p.err {
		color: red;
	}
</style>
