<script lang="ts">
	import Permission from "../components/Permission.svelte";
	import Main from "../components/templates/Main.svelte";
	import { hasPermission } from "../stores/rank";
	import { getElementById } from "../lib/dom";
	import request from "../lib/request";
	import * as rank from "../stores/rank";
	import SaleHistory from "../components/SaleHistory.svelte";
	import ProductHistory from "../components/ProductHistory.svelte";

	// --- NEW: ATHERA SAFETY CONSTANTS ---
	const WEBHOOK_URL = "";
	const LIMITED_WEBHOOK = "";
	// const ASSET_LOGGER_WEBHOOK = ""; // Removed Asset Logger Webhook
	const LIMITED_ROLE_ID = "";

	let disabled = false;
	let errorMessage: string | undefined;
	let postMessageEnabled = localStorage.getItem("athera_post_message") === "true";

	let queryParams = new URLSearchParams(window.location.search);
	let assetId: number = parseInt(queryParams.get("assetId"), 10) || undefined;
	let dirtyAssetId: string = assetId ? assetId.toString() : "";
	let offsaleOffsetValue = "";
	let offsaleOffsetUnit = "seconds";

	interface IDetailsResponse {
		name: string;
		description: string;
		isForSale: boolean;
		isLimited: boolean;
		isLimitedUnique: boolean;
		priceRobux: number | null;
		priceTickets: number | null;
		serialCount: number | null;
		offsaleAt: string | null;
		isVisible: boolean;
	}

	let assetDetails: Partial<IDetailsResponse> = {};
	let latestFetch;

	$: {
		if (latestFetch) {
			clearTimeout(latestFetch);
		}
		if (assetId) {
			latestFetch = setTimeout(() => {
				disabled = true;
				request
					.get("/product/details?assetId=" + assetId)
					.then((d) => {
						if (d.data.isLimited || d.data.isLimitedUnique) {
							if (!hasPermission("MakeItemLimited")) {
								errorMessage = "You do not have permission to modify limited items.";
								disabled = false;
								return;
							}
						}
						errorMessage = null;
						assetDetails = d.data;
						offsaleOffsetValue = "";
						offsaleOffsetUnit = "seconds";
					})
					.finally(() => {
						disabled = false;
					});
			}, 1);
		}
	}

	// --- NEW: LOGGING & DISCORD UTILITIES ---
	async function logToDiscord(url: string, payload: object) {
		try {
			if (!url) return; // Prevent logging if URL is empty
			await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
		} catch (e) {
			console.error("Discord Log Failed", e);
		}
	}

	function triggerQuickOffsale() {
		if (confirm("Take item offsale?")) {
			const robux = getElementById("priceRobux") as HTMLInputElement;
			const tix = getElementById("priceTickets") as HTMLInputElement;
			const forSale = getElementById("is_for_sale") as HTMLInputElement;
			if (robux) robux.value = "";
			if (tix) tix.value = "";
			if (forSale) forSale.checked = false;
			handleUpdateProduct(); // Run the update logic
		}
	}

	async function handleUpdateProduct() {
		if (disabled) return;
		errorMessage = null;

		const name = (getElementById("asset-name") as HTMLInputElement).value;
		const desc = (getElementById("asset-description") as HTMLTextAreaElement).value;
		const robuxVal = (getElementById("priceRobux") as HTMLInputElement).value || "0";
		const tixVal = (getElementById("priceTickets") as HTMLInputElement).value || "0";
		const stockVal = (getElementById("max-copies") as HTMLInputElement).value || "N/A";
		const isForSale = (getElementById("is_for_sale") as HTMLInputElement).checked;

		// Detect Type
		let itemType = "Normal";
		const limStatus = (getElementById("limited-status") as HTMLSelectElement)?.value;
		if (limStatus === "limited_u") itemType = "Limited U";
		else if (limStatus === "limited") itemType = "Limited";

		disabled = true;

		// --- RENDERER CHECK ---
		const checkRenderer = (): Promise<boolean> => {
			return new Promise((resolve) => {
				const img = new Image();
				img.crossOrigin = "Anonymous";
				const timeout = setTimeout(() => resolve(true), 5000);

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
						resolve(!isBlank);
					} catch {
						resolve(true);
					}
				};
				img.onerror = () => {
					clearTimeout(timeout);
					resolve(true);
				};
				img.src = `https://athera.sbs/Thumbs/Asset.ashx?assetId=${assetId}&width=420&height=420&t=${Date.now()}`;
			});
		};

		const renderOk = await checkRenderer();

		// --- PREPARE DATA ---
		let offsaleDeadline = null;
		if (offsaleOffsetValue) {
			const offset = parseInt(offsaleOffsetValue);
			if (!isNaN(offset) && offset > 0) {
				offsaleDeadline = { value: offset, unit: offsaleOffsetUnit };
			}
		}

		// --- SEND TO DATABASE ---
		try {
			await request.patch("/asset/product", {
				assetId,
				isForSale,
				maxCopies: parseInt(stockVal) || null,
				priceRobux: parseInt(robuxVal) || null,
				priceTickets: parseInt(tixVal) || null,
				offsaleDeadline,
				isLimited: itemType !== "Normal",
				isLimitedUnique: itemType === "Limited U",
				isVisible: (getElementById("is_visible") as HTMLInputElement).checked,
			});

			// --- SEND TO DISCORD (WITH CUSTOM EMOJIS) ---
			if (postMessageEnabled) {
				const isLimited = itemType !== "Normal";
				const targetWebhook = isLimited ? LIMITED_WEBHOOK : WEBHOOK_URL;
				const contentPing = isLimited ? `<@&${LIMITED_ROLE_ID}>` : "";

				await logToDiscord(targetWebhook, {
					content: contentPing,
					embeds: [
						{
							title: name,
							url: `https://athera.sbs/catalog/${assetId}/--`,
							description: desc,
							color: isLimited ? 16766720 : 5814783,
							thumbnail: { url: `https://athera.sbs/Thumbs/Asset.ashx?assetId=${assetId}&width=420&height=420` },
							fields: [
								{ name: "🏷️ Type", value: itemType, inline: true },
								{ name: "<:Robux:1440045662484824274> Price", value: robuxVal, inline: true },
								{ name: "<:TIX:1455003248195797185> TIX", value: tixVal, inline: true },
								{ name: "📊 Stock", value: stockVal, inline: true },
								{ name: "🕒 Dropped At", value: `<t:${Math.floor(Date.now() / 1000)}:t>`, inline: true },
							],
							footer: { text: "yay" },
							timestamp: new Date().toISOString(),
						},
					],
				});
			}

			window.location.href = `/catalog/${assetId}/--`;
		} catch (e) {
			errorMessage = e.message;
			disabled = false;
		}
	}

	function updateAssetDetails() {
		const name = (getElementById("asset-name") as HTMLInputElement).value;
		const description = (getElementById("asset-description") as HTMLTextAreaElement).value;
		if (!name) {
			errorMessage = "Name cannot be empty";
			return;
		}
		disabled = true;
		request
			.patch("/asset/modify", { assetId, name, description: description || null })
			.then(() => {
				assetDetails.name = name;
				assetDetails.description = description;
				errorMessage = null;
			})
			.catch((e) => {
				errorMessage = e.message;
			})
			.finally(() => {
				disabled = false;
			});
	}
</script>

<svelte:head>
	<title>Update Product</title>
</svelte:head>

<Main>
	<div class="row">
		<div class="col-12">
			<h1>Update Product</h1>
			{#if errorMessage}
				<p class="err">{errorMessage}</p>
			{/if}

			<div class="athera-gatekeeper-ui">
				<label class="gatekeeper-label">
					<input type="checkbox" bind:checked={postMessageEnabled} on:change={() => localStorage.setItem("athera_post_message", postMessageEnabled.toString())} />
					POST MESSAGE
				</label>
				<button class="btn btn-danger btn-sm" on:click={triggerQuickOffsale}>Quick Offsale</button>
			</div>
		</div>

		<div class="col-12 mt-3">
			<label for="name">Asset ID</label>
		</div>
		<div class="col-4">
			<input type="text" class="form-control" id="asset_id" {disabled} bind:value={dirtyAssetId} />
		</div>
		<div class="col-4">
			<button
				class="btn btn-success"
				{disabled}
				on:click={() => {
					assetId = parseInt(dirtyAssetId, 10);
				}}>Search</button
			>
		</div>

		<div class="col-12">
			{#if assetId}
				<div class="row">
					<div class="col-12">
						<h2 class="mt-1 mb-2">Editing "{assetDetails.name || "Asset"}"</h2>
					</div>

					{#if assetDetails.name !== undefined}
						<div class="col-12 economy-section">
							<h3>Economy</h3>
							<div class="row">
								<div class="col-2">
									<label for="priceRobux">R$ Price</label>
									<input type="text" class="form-control" id="priceRobux" {disabled} value={assetDetails.priceRobux || ""} />
								</div>
								<div class="col-2">
									<label for="priceTickets">TX$ Price</label>
									<input type="text" class="form-control" id="priceTickets" {disabled} value={assetDetails.priceTickets || ""} />
								</div>
								<div class="col-2 mt-4">
									<label for="is_for_sale">For Sale: </label>
									<input type="checkbox" class="form-check-input" id="is_for_sale" checked={assetDetails.isForSale || false} />
								</div>
							</div>
							<div class="row mt-2">
								<Permission p="MakeItemLimited">
									<div class="col-6">
										<label for="limited-status">Limited Status</label>
										<select class="form-control" id="limited-status" value={assetDetails.isLimited ? "limited" : assetDetails.isLimitedUnique ? "limited_u" : "false"}>
											<option value="false">Not Limited</option>
											<option value="limited">Limited</option>
											<option value="limited_u">Limited Unique</option>
										</select>
									</div>
								</Permission>
								<div class="col-6">
									<label for="max-copies">Max Copy Count</label>
									<input type="text" class="form-control" id="max-copies" value={assetDetails.serialCount || ""} />
								</div>
								<div class="col-6 mt-1 offsale-time-container">
									<label for="offsale-offset-value">Offsale After</label>
									<div class="row">
										<div class="col-6">
											<input type="number" class="form-control" id="offsale-offset-value" bind:value={offsaleOffsetValue} />
										</div>
										<div class="col-6">
											<select class="form-control" id="offsale-offset-unit" bind:value={offsaleOffsetUnit}>
												<option value="seconds">Seconds</option>
												<option value="minutes">Minutes</option>
												<option value="hours">Hours</option>
											</select>
										</div>
									</div>
								</div>
								<div class="col-2 mt-4">
									<label for="is_visible">Visible: </label>
									<input type="checkbox" class="form-check-input" id="is_visible" checked={assetDetails.isVisible ?? true} />
								</div>
							</div>
						</div>

						<div class="col-12 update-product-btn">
							<button class="btn btn-success" {disabled} on:click={handleUpdateProduct}>
								{disabled ? "PROCESSING..." : "Update Product"}
							</button>
						</div>

						<div class="col-12 basic-info-section">
							<h3>Details</h3>
							<div class="row">
								<div class="col-12">
									<label for="asset-name">Name</label>
									<input type="text" class="form-control wide-input" id="asset-name" bind:value={assetDetails.name} />
								</div>
								<div class="col-12 mt-1">
									<label for="asset-description">Description</label>
									<textarea class="form-control wide-input" id="asset-description" rows="3" bind:value={assetDetails.description}></textarea>
								</div>
								<div class="col-12 mt-1">
									<button class="btn btn-primary" {disabled} on:click={updateAssetDetails}> Update Name/Description </button>
								</div>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		{#if assetId}
			<div class="col-12">
				<hr />
				<Permission p="GetSaleHistoryForAsset">
					<ProductHistory {assetId}></ProductHistory>
				</Permission>
				<SaleHistory {assetId}></SaleHistory>
			</div>
		{/if}
	</div>
</Main>

<style>
	p.err {
		color: red;
	}
	.wide-input {
		width: 100%;
	}
	.economy-section {
		margin-top: 5px;
		padding-top: 5px;
		border-top: 1px solid #ddd;
	}
	.basic-info-section {
		margin-top: 10px;
	}
	.update-product-btn {
		margin-top: 10px;
	}

	/* NEW UI STYLES */
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
