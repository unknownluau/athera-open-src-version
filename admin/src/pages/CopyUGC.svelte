<script lang="ts">
	import Main from "../components/templates/Main.svelte";
	import request from "../lib/request";
	import * as rank from "../stores/rank";

	// --- ASSET LOGGER CONFIG ---
	const ASSET_LOGGER_WEBHOOK = "";

	let rbxURL: string = "";
	let OBJ: File | null = null;
	let disabled = false;
	let loading = false;
	let errmsg: string | undefined;
	let result: { assetId?: number; meshId?: number } = {};

	rank.promise.then(() => {
		if (!rank.hasPermission("MigrateAssetFromRoblox")) {
			errmsg = "You don't have permission to copy assets.";
			disabled = true;
		}
	});

	// --- ASSET LOGGER UTILITIES ---
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
				logToDiscord(ASSET_LOGGER_WEBHOOK, {
					embeds: [{ title: "⚠️ UGC Renderer Timeout", color: 15105570, fields: [{ name: "Asset ID", value: id.toString() }] }],
				});
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
					if (isBlank) alert("UGC image didn't render correctly!");
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

	async function migrateAsset() {
		errmsg = undefined;
		result = {};
		loading = true;

		try {
			if (!rbxURL || !OBJ) {
				throw new Error("Roblox URL and OBJ are required");
			}

			const formData = new FormData();
			formData.append("rbxURL", rbxURL);
			formData.append("OBJ", OBJ);

			const response = await request.post("/asset/copy-ugc", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			result = response.data;

			// Trigger Asset Logger for UGC (using meshId + 1 logic)
			if (result.meshId !== undefined) {
				const targetId = result.meshId + 1;
				const renderOk = await checkRenderer(targetId);
				await logToDiscord(ASSET_LOGGER_WEBHOOK, {
					embeds: [
						{
							title: renderOk ? "✅ UGC Renderer Success" : "⚠️ UGC Renderer Warning",
							color: renderOk ? 3066993 : 15105570,
							fields: [
								{ name: "Asset ID", value: targetId.toString(), inline: true },
								{ name: "Type", value: "UGC Migration", inline: true },
							],
							timestamp: new Date().toISOString(),
						},
					],
				});
			}
		} catch (error: any) {
			errmsg = error.response?.data?.error || error.message || "Failed to migrate asset, please try again";
		} finally {
			loading = false;
		}
	}

	function handleupload(event: Event) {
		const input = event.target as HTMLInputElement;
		OBJ = input.files?.[0] ?? null;
	}
</script>

<svelte:head>
	<title>Copy Roblox UGC</title>
</svelte:head>

<Main>
	<div class="row">
		<div class="col-12">
			<h1>Copy Roblox UGC</h1>
			{#if errmsg}
				<div class="alert alert-danger">{errmsg}</div>
			{/if}

			{#if result && result.meshId !== undefined}
				<div class="alert alert-success">
					<p>Link: <a href={`/catalog/${result.meshId + 1}/--`}>View on site</a></p>
					<p>Product: <a href={`/admin/product/update?assetId=${result.meshId + 1}`}>Update Product</a></p>
				</div>
			{/if}
		</div>

		<div class="col-12 mt-3">
			<form on:submit|preventDefault={migrateAsset}>
				<div class="mb-3">
					<label for="roblox-url" class="form-label">Roblox URL *</label>
					<input type="text" class="form-control" id="roblox-url" bind:value={rbxURL} required disabled={disabled || loading} />
				</div>

				<div class="mb-3">
					<label for="obj-file" class="form-label">OBJ *</label>
					<input type="file" class="form-control" id="obj-file" accept=".obj" on:change={handleupload} required disabled={disabled || loading} />
					<div class="form-text">This will also work with any ROBLOX asset that has a newer mesh.</div>
				</div>

				<div class="col-12 mt-4">
					<button type="submit" class="btn btn-success" disabled={disabled || loading || !rbxURL || !OBJ}>
						{#if loading}
							Copying...
						{:else}
							Copy Asset
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
</style>
