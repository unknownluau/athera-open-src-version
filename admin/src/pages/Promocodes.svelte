<script lang="ts">
    import { onMount } from "svelte";
    import Main from "../components/templates/Main.svelte";
    import request from "../lib/request";
    import * as rank from "../stores/rank";

    let code: string = "";
    let assetId: string = "";
    let robuxAmount: string = "";
    let expiresinval: string = "";
    let expiresin: 'seconds' | 'minutes' | 'hours' | 'days' = 'hours';
    let expiresNever: boolean = true;
    let maxUses: string = "1";
    let isActive: boolean = true;

    let promocodes: PCEntry[] = [];
    let selectedpc: PCEntry | null = null;
    let redemptions: PCREntry[] = [];
	let hidemaxed: boolean = true;
    let limit: string = "1000000";
    let offset: string = "0";

    let disabled = false;
    let loading = false;
    let islistloading = false;
    let redemptionLoading = false;
    let errormsg: string | undefined;
    let successmsg: string | undefined;
    let activeTab: 'create' | 'list' = 'create';

    interface PCEntry {
        id: number;
        code: string;
        asset_id: number | null;
        robux: number | null;
        created_at: string;
        expires_at: string | null;
        maxuses: number;
        uses: number;
        active: boolean;
    }
    
    interface PCREntry {
        id: number;
        promocode: number;
        user_id: number;
        redeemed_at: string;
        asset_id: number | null;
        robux: number | null;
        username: string;
    }
    
    rank.promise.then(() => {
        if (!rank.hasPermission("GiveUserItem")) {
            errormsg = "You don't have permission to manage promocodes";
            disabled = true;
        }
    });
    
    async function loadpromocodes() {
        try {
            islistloading = true;
            errormsg = undefined;
            const response = await request.get(`/promocodes/list?limit=${limit}&offset=${offset}`);

            promocodes = Array.isArray(response) ? response : response.data;
            
            if (!Array.isArray(promocodes)) {
                throw new Error("Bad response format");
            }
        } catch (error) {
            console.error("Failed to load promocodes:", error);
            errormsg = error.message || "Failed to load promocodes";
            promocodes = [];
        } finally {
            islistloading = false;
        }
    }
	
	async function deletepromocode(promocodeID: number) {
        if (!confirm('Are you sure you want to delete this promocode?')) {
            return;
        }

        try {
            loading = true;
            errormsg = undefined;
            await request.delete(`/promocodes/delete`, {
                data: { promocodeID }
            });
            successmsg = `Promocode deleted successfully`;
            await loadpromocodes();
            selectedpc = null;
            redemptions = [];
        } catch (error) {
            console.error("Failed to delete Promocode:", error);
            errormsg = error.message || "Failed to delete Promocode";
        } finally {
            loading = false;
        }
    }

    async function loadRedemptions(promocodeID: number) {
        try {
            redemptionLoading = true;
            errormsg = undefined;
            const response = await request.get(`/promocodes/redemptions?promocodeID=${promocodeID}&limit=${limit}&offset=${offset}`);

            redemptions = Array.isArray(response) ? response : response.data;
            
            if (!Array.isArray(redemptions)) {
                throw new Error("Invalid response format from server");
            }
            
            selectedpc = promocodes.find(pc => pc.id === promocodeID) || null;
        } catch (error) {
            console.error("Failed to load redemptions:", error);
            errormsg = error.message || "Failed to load redemptions";
            redemptions = [];
        } finally {
            redemptionLoading = false;
        }
    }
    
    async function toggleActive(promocodeID: number, currentStatus: boolean) {
        try {
            loading = true;
            errormsg = undefined;
            await request.post(`/promocodes/toggle-active`, {
                promocodeID,
                isActive: !currentStatus
            });
            successmsg = `Promocode ${currentStatus ? 'deactivated' : 'activated'} successfully`;
            await loadpromocodes();
        } catch (error) {
            console.error("Failed to toggle Promocode status:", error);
            errormsg = error.message || "Failed to toggle Promocode status";
        } finally {
            loading = false;
        }
    }

    async function createpromocode() {
        errormsg = undefined;
        successmsg = undefined;
        loading = true;
        
        try {
            const reqData: any = {
                Code: code.toUpperCase(),
                AssetId: assetId ? parseInt(assetId) : null,
                Robux: robuxAmount ? parseInt(robuxAmount) : null,
                MaxUses: parseInt(maxUses),
                IsActive: isActive
            };

            if (!expiresNever && expiresinval) {
                const value = parseInt(expiresinval);
                if (isNaN(value) || value <= 0) {
                    throw new Error("Expiration value must be a positive number");
                }

                switch (expiresin) {
                    case 'seconds':
                        reqData.ExpiresInSeconds = value;
                        break;
                    case 'minutes':
                        reqData.ExpiresInMinutes = value;
                        break;
                    case 'hours':
                        reqData.ExpiresInHours = value;
                        break;
                    case 'days':
                        reqData.ExpiresInDays = value;
                        break;
                }
            }

            const response = await request.post(`/promocodes/create`, reqData);
            
            successmsg = `Promocode created successfully! You can view it in the View Promocodes section.`;
            code = "";
            assetId = "";
            robuxAmount = "";
            expiresinval = "";
            expiresin = 'hours';
            expiresNever = true;
            maxUses = "1";
            isActive = true;
            
            await loadpromocodes();
        } catch (error) {
            console.error("Failed to create promocode:", error);
            errormsg = error.message || "Failed to create promocode, Please try again";
        } finally {
            loading = false;
        }
    }
	
    function formatTimeRemaining(expiresAt: string | null): string {
        if (!expiresAt) return "Never";
        
        const now = new Date();
        const expiryDate = new Date(expiresAt);
        
        const nowUtc = Date.UTC(
            now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
            now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()
        );
        
        const expiryUtc = expiryDate.getTime();
        const diffMs = expiryUtc - nowUtc;
        
        if (diffMs <= 0) return "Expired";
        
        const diffSec = Math.round(diffMs / 1000);
        const diffMin = Math.round(diffMs / (1000 * 60));
        const diffHours = Math.round(diffMs / (1000 * 60 * 60));
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffSec < 60) return `Expires in ${diffSec} second${diffSec !== 1 ? 's' : ''}`;
        if (diffMin < 60) return `Expires in ${diffMin} minute${diffMin !== 1 ? 's' : ''}`;
        if (diffHours < 24) return `Expires in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
        return `Expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    }

    onMount(() => {
        loadpromocodes();
    });
</script>

<svelte:head>
    <title>Promocodes</title>
</svelte:head>

<Main>
    <div class="row">
        <div class="col-12">
            <h1>Promocodes</h1>
            
            {#if errormsg}
                <div class="alert alert-danger">{errormsg}</div>
            {/if}
            
            {#if successmsg}
                <div class="alert alert-success">{successmsg}</div>
            {/if}
            
            <ul class="nav nav-tabs mb-3">
                <li class="nav-item">
                    <button 
                        class="nav-link {activeTab === 'create' ? 'active' : ''}" 
                        on:click={() => activeTab = 'create'}
                    >
                        Create a Promocode
                    </button>
                </li>
                <li class="nav-item">
                    <button 
                        class="nav-link {activeTab === 'list' ? 'active' : ''}" 
                        on:click={() => {
                            activeTab = 'list';
                            loadpromocodes();
                        }}
                    >
                        View Promocodes
                    </button>
                </li>
            </ul>
        </div>
        
        {#if activeTab === 'create'}
            <div class="col-12 mt-3">
                <form on:submit|preventDefault={createpromocode}>
                    <div class="mb-3">
                        <label for="code" class="form-label">Promocode *</label>
                        <input 
                            type="text" 
                            class="form-control" 
                            id="code" 
                            bind:value={code}
                            placeholder="Code"
                            required
                            minlength="4"
                            maxlength="50"
                            disabled={disabled || loading}
                        />
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="asset-id" class="form-label">Asset ID</label>
                            <input 
                                type="number" 
                                class="form-control" 
                                id="asset-id" 
                                bind:value={assetId}
                                disabled={disabled || loading || !!robuxAmount}
                            />
							<div class="form-text">You must have at least Robux or an Asset ID</div>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                            <label for="robux-amount" class="form-label">Robux</label>
                            <input 
                                type="number" 
                                class="form-control" 
                                id="robux-amount" 
                                bind:value={robuxAmount}
                                min="0"
                                max="1000000"
                                disabled={disabled || loading || !!assetId}
                            />
                        </div>
                    </div>
                    
					<div class="row">
						<div class="col-md-6 mb-3">
							<label class="form-label">Expiration</label>
							<div class="input-group">
								<div class="form-check">
									<input 
										type="checkbox" 
										class="form-check-input" 
										id="expires-never" 
										bind:checked={expiresNever}
										disabled={disabled || loading}
									/>
									<label class="form-check-label" for="expires-never">Never</label>
								</div>
							</div>
							{#if !expiresNever}
								<div class="input-group mt-2">
									<input 
										type="number" 
										class="form-control" 
										bind:value={expiresinval}
										placeholder="Enter value"
										min="1"
										disabled={disabled || loading}
									/>
									<select 
										class="form-select" 
										bind:value={expiresin}
										disabled={disabled || loading}
									>
										<option value="seconds">Seconds from now</option>
										<option value="minutes">Minutes from now</option>
										<option value="hours" selected>Hours from now</option>
										<option value="days">Days from now</option>
									</select>
								</div>
							{/if}
						</div>               
    
						<div class="col-md-6 mb-3">
							<label for="max-uses" class="form-label">Max Uses *</label>
							<input 
								type="number" 
								class="form-control" 
								id="max-uses" 
								bind:value={maxUses}
								required
								min="1"
								max="1000000"
								disabled={disabled || loading}
							/>
							<div class="form-text">Between 1 - 1 million</div>
						</div>
					</div>

                    <div class="mb-3 form-check">
                        <input 
                            type="checkbox" 
                            class="form-check-input" 
                            id="is-active" 
                            bind:checked={isActive}
                            disabled={disabled || loading}
                        />
                        <label class="form-check-label" for="is-active">Active</label>
                    </div>
                    
                    <div class="d-grid gap-2">
                        <button 
                            type="submit" 
                            class="btn btn-success"
                            disabled={disabled || loading || !code || !maxUses || (!assetId && !robuxAmount)}
                        >
                            {#if loading}
                                Creating...
                            {:else}
                                Create
                            {/if}
                        </button>
                    </div>
                </form>
            </div>
        {:else}
			<div class="col-12 mt-3">
				<div class="card">
					<div class="card-header d-flex justify-content-between align-items-center">
						<div class="d-flex align-items-center gap-2">
							<div class="form-check">
								<input 
									class="form-check-input" 
									type="checkbox" 
									id="hidemaxedtog"
									bind:checked={hidemaxed}
								>
								<label class="form-check-label fw-semibold" for="hidemaxedtog">
									Hide maxed codes
								</label>
							</div>
						</div>
						<button class="btn btn-primary btn-sm" on:click={loadpromocodes} disabled={islistloading}>
							{#if islistloading}
								Refreshing...
							{:else}
								Refresh
							{/if}
						</button>
					</div>
					<div class="card-body">
						{#if islistloading}
							<div class="text-center py-4">
								<div class="spinner-border text-primary" role="status">
									<span class="visually-hidden">Loading...</span>
								</div>
								<p class="mt-2">Loading promocodes...</p>
							</div>
						{:else if promocodes.filter(pc => !hidemaxed || pc.uses < pc.maxuses).length === 0}
							<div class="alert alert-info">No promocodes found</div>
						{:else}
							<div class="table-responsive">
								<table class="table table-striped table-hover">
									<thead>
										<tr>
											<th>ID</th>
											<th>Code</th>
											<th>Reward</th>
											<th>Uses</th>
											<th>Status</th>
											<th>Created</th>
											<th>Expires</th>
											<th>Actions</th>
										</tr>
									</thead>
									<tbody>
										{#each promocodes.filter(pc => !hidemaxed || pc.uses < pc.maxuses) as promocode}
                                            <tr class={selectedpc?.id === promocode.id ? 'table-primary' : ''}>
                                                <td>{promocode.id}</td>
                                                <td>
                                                    <code>{promocode.code}</code>
                                                    {#if promocode.uses >= promocode.maxuses}
                                                        <span class="badge bg-danger ms-2">MAX</span>
                                                    {/if}
                                                </td>
                                                <td>
                                                    {#if promocode.asset_id}
                                                        Asset #{promocode.asset_id}
                                                    {:else if promocode.robux}
                                                        {promocode.robux} Robux
                                                    {/if}
                                                </td>
                                                <td>{promocode.uses}/{promocode.maxuses}</td>
                                                <td>
                                                    {#if promocode.active}
                                                        <span class="badge bg-success">Active</span>
                                                    {:else}
                                                        <span class="badge bg-secondary">Inactive</span>
                                                    {/if}
                                                </td>
                                                <td>{new Date(promocode.created_at).toLocaleString()}</td>
												<td>
													{#if promocode.expires_at}
														{formatTimeRemaining(promocode.expires_at)}
													{:else}
														Never
													{/if}
												</td>
												<td>
													<div class="btn-group btn-group-sm">
														<button 
															class="btn btn-primary"
															on:click={() => loadRedemptions(promocode.id)}
															disabled={redemptionLoading}
															title="View redemptions"
														>
															View
														</button>
														<button 
															class="btn {promocode.active ? 'btn-warning' : 'btn-success'}"
															on:click={() => toggleActive(promocode.id, promocode.active)}
															disabled={loading}
															title={promocode.active ? 'Deactivate' : 'Activate'}
														>
															{promocode.active ? 'Deactivate' : 'Activate'}
														</button>
														<button 
															class="btn btn-danger"
															on:click={() => deletepromocode(promocode.id)}
															disabled={loading}
															title="Delete"
														>
															Delete
														</button>
													</div>
												</td>
                                            </tr>
                                        {/each}
                                    </tbody>
                                </table>
                            </div>
                        {/if}
                    </div>
                </div>
                
                {#if selectedpc}
                    <div class="card mt-3">
                        <div class="card-header">
                            <h5 class="mb-0">Redemptions for <code>{selectedpc.code}</code></h5>
                        </div>
                        <div class="card-body">
                            {#if redemptionLoading}
                                <div class="text-center py-4">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <p class="mt-2">Loading...</p>
                                </div>
                            {:else if redemptions.length === 0}
                                <div class="alert alert-info">No redemptions found for this code</div>
                            {:else}
                                <div class="table-responsive">
                                    <table class="table table-striped table-hover">
                                        <thead>
                                            <tr>
                                                <th>User</th>
                                                <th>Reward</th>
                                                <th>Redeemed At</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {#each redemptions as redemption}
                                                <tr>
                                                    <td>
                                                        {#if redemption.username}
                                                            {redemption.username} (ID: {redemption.user_id})
                                                        {:else}
                                                            User ID: {redemption.user_id}
                                                        {/if}
                                                    </td>
                                                    <td>
                                                        {#if redemption.asset_id}
                                                            Asset #{redemption.asset_id}
                                                        {:else if redemption.robux}
                                                            {redemption.robux} Robux
                                                        {/if}
                                                    </td>
                                                    <td>{new Date(redemption.redeemed_at).toLocaleString()}</td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                            {/if}
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</Main>

<style>
    .alert {
        margin-bottom: 1rem;
    }
    .form-text {
        font-size: 0.85rem;
        color: #6c757d;
    }
    .nav-tabs {
        margin-bottom: 1rem;
    }
    .table-responsive {
        overflow-x: auto;
    }
    code {
        background-color: #f8f9fa;
        padding: 0.2rem 0.4rem;
        border-radius: 0.25rem;
    }
    .text-center {
        text-align: center;
    }
    .py-4 {
        padding-top: 1.5rem;
        padding-bottom: 1.5rem;
    }
    .mt-2 {
        margin-top: 0.5rem;
    }
    .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
    .btn-group .btn {
        padding: 0.25rem 0.5rem;
    }
    .btn-group-sm .btn {
        font-size: 0.875rem;
    }
</style>