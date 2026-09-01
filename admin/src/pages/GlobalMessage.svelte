<script lang="ts">
	import { navigate } from "svelte-routing";
	import Main from "../components/templates/Main.svelte";
	import request from "../lib/request";

	let subject = "";
	let body = "";
	let disabled = false;
	let errorMessage = "";
	let successMessage = "";
	let progress = "";
	let isSending = false;

	const fetchAllUsers = async () => {
		let allUsers = [];
		let offset = 0;
		let limit = 1000;
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

	const sendMessageToUser = async (userId: number, subject: string, body: string) => {
		try {
			await request.post("/user/create-message", {
				userId,
				subject,
				body,
			});
			return true;
		} catch (e) {
			console.error(`Failed to send message to user ${userId}`, e);
			return false;
		}
	};

	const sendGlobalMessage = async () => {
		if (!subject || !body) {
			errorMessage = "Title and Message are required.";
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

			for (let i = 0; i < total; i++) {
				const user = users[i];
				progress = `Sending messages... ${i + 1}/${total}`;
				const success = await sendMessageToUser(user.id, subject, body);
				if (success) {
					sentCount++;
				} else {
					failCount++;
				}
			}

			successMessage = `Message sent to ${sentCount} users. Failed: ${failCount}`;
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
	<title>Global Message</title>
</svelte:head>

<Main>
	<div class="row">
		<div class="col-12">
			<h1>Global Message</h1>
			<p class="text-muted">Send a message to all users on the platform.</p>
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
			<label for="message-subject">Title <span class="text-danger">*</span></label>
			<input type="text" class="form-control" id="message-subject" bind:value={subject} {disabled} placeholder="Message Subject" />

			<label for="message-body" class="mt-2">Message <span class="text-danger">*</span></label>
			<textarea id="message-body" class="form-control" rows={12} bind:value={body} {disabled} placeholder="Message Body..."></textarea>
		</div>

		<div class="col-12 mt-4">
			<button class="btn btn-success" {disabled} on:click={sendGlobalMessage}>
				{isSending ? "Sending..." : "Send Message To All Users"}
			</button>
		</div>
	</div>
</Main>
