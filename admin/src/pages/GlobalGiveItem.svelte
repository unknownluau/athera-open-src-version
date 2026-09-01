<script lang="ts">
	import Main from "../components/templates/Main.svelte";
	import request from "../lib/request";

	let assetId = "";
	let disabled = false;
	let errorMessage = "";
	let successMessage = "";
	let progress = "";
	let isSending = false;

	const fetchAllUsers = async () => {
		let allUsers = [];
		let offset = 0;
		let limit = 100;
		let keepFetching = true;

		while (keepFetching) {
			try {
				const res = await request.get(`/users?limit=${limit}&offset=${offset}&orderByColumn=user.id&orderByMode=asc`);
				const users = res.data.data;
				if (users.length === 0) {
					keepFetching = false;
				} else {
					allUsers = [...allUsers, ...users];
					offset += limit;
					progress = `Fetching users... (${allUsers.length} found)`;
				}
			} catch (e) {
				console.error("Error fetching users", e);
				throw new Error("Failed to fetch users list.");
			}
		}
		return allUsers;
	};

	const giveItemToUser = async (userId: number, assetId: number) => {
		try {
			await request.post("/giveitem", {
				userId,
				assetId,
				copies: 1,
				giveSerial: false,
			});
			return true;
		} catch (e) {
			console.error(`Failed to give item to user ${userId}`, e);
			return false;
		}
	};

	const giveGlobalItem = async () => {
		if (!assetId) {
			errorMessage = "Asset ID is required.";
			return;
		}

		disabled = true;
		errorMessage = "";
		successMessage = "";
		isSending = true;
		progress = "Starting...";

		try {
			progress = "Fetching all users...";
			const users = await fetchAllUsers();

			let sentCount = 0;
			let failCount = 0;
			const total = users.length;
			const assetIdNum = parseInt(assetId, 10);

			for (let i = 0; i < total; i++) {
				const user = users[i];
				progress = `Giving item... ${i + 1}/${total}`;
				const success = await giveItemToUser(user.id, assetIdNum);
				if (success) {
					sentCount++;
				} else {
					failCount++;
				}
			}

			successMessage = `Item given to ${sentCount} users. Failed: ${failCount}`;
			progress = "Completed.";
		} catch (e) {
			errorMessage = e.message || "An error occurred.";
		} finally {
			disabled = false;
			isSending = false;
		}
	};
</script>

<svelte:head>
	<title>Global Give Item</title>
</svelte:head>

<Main>
	<div class="row">
		<div class="col-12">
			<h1>Global Give Item</h1>
			<p class="text-muted">Give an asset to all users on the platform.</p>
			{#if errorMessage}
				<div class="alert alert-danger">{errorMessage}</div>
			{/if}
			{#if successMessage}
				<div class="alert alert-success">{successMessage}</div>
			{/if}
			{#if isSending}
				<div class="alert alert-info">{progress}</div>
			{/if}
		</div>
		<div class="col-12">
			<label for="asset-id">Asset ID <span class="text-danger">*</span></label>
			<input type="number" class="form-control" id="asset-id" bind:value={assetId} {disabled} placeholder="Asset ID" />
		</div>

		<div class="col-12 mt-4">
			<button class="btn btn-success" {disabled} on:click={giveGlobalItem}>
				{isSending ? "Giving Item..." : "Give Item To All Users"}
			</button>
		</div>
	</div>
</Main>
