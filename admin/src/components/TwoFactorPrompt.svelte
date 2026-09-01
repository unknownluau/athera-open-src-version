<script lang="ts">
	import request from "../lib/request";
	import { promise as rankPromise } from "../stores/rank";

	let code = "";
	let error = "";
	let loading = false;

	async function submit() {
		if (code.length !== 6) {
			error = "Code must be 6 digits";
			return;
		}
		loading = true;
		error = "";
		try {
			await request.post("/2fa/verify", { code });
			window.location.reload();
		} catch (e) {
			error = e.message || "Invalid code";
		} finally {
			loading = false;
		}
	}
</script>

<div class="container mt-5">
	<div class="row justify-content-center">
		<div class="col-md-6">
			<div class="card-body p-5 text-center">
				<h3 class="mb-4">2FA Verfication</h3>
				<p class="text-muted mb-4">Enter your 2FA code to enter the admin panel.</p>
				
				{#if error}
					<div class="alert alert-danger">{error}</div>
				{/if}
				<form on:submit|preventDefault={submit}>
					<div class="mb-4">
						<input
							type="text"
							class="form-control form-control-lg text-center"
							placeholder="000000"
							maxlength="6"
							bind:value={code}
							disabled={loading}
						/>
					</div>
					<button class="btn btn-primary btn-lg w-100" type="submit" disabled={loading}>
						{loading ? "verifying..." : "submit"}
					</button>
				</form>
			</div>
		</div>
	</div>
</div>

<style>
	input {
		font-size: 2rem;
		letter-spacing: 0.5rem;
	}
</style>
