<script lang="ts">
    import { onMount } from "svelte";
    import Main from "../components/templates/Main.svelte";
    import request from "../lib/request";
    import * as rank from "../stores/rank";

    let code: string = "";
    let selectedTierId: string = "";
    let maxUses: string = "1";
    let isActive: boolean = true;

    let vouchers: VoucherEntry[] = [];
    let selectedVoucher: VoucherEntry | null = null;
    let redemptions: RedemptionEntry[] = [];
    let hidemaxed: boolean = true;
    let limit: string = "1000000";
    let offset: string = "0";

    let tiers: TierEntry[] = [];
    let editingTier: TierEntry | null = null;
    let tierName: string = "";
    let tierPriceUsd: string = "";
    let tierAssetId: string = "";
    let tierRobux: string = "";
    let tierIncludesAll: boolean = false;

    let countdownEnabled: boolean = false;
    let countdownEndDate: string = '';
    let countdownLoading: boolean = false;

    let disabled = false;
    let loading = false;
    let islistloading = false;
    let redemptionLoading = false;
    let tierLoading = false;
    let errormsg: string | undefined;
    let successmsg: string | undefined;
    let activeTab: 'create' | 'list' | 'tiers' | 'countdown' = 'create';

    interface VoucherEntry {
        id: number;
        code: string;
        price_usd: number;
        created_at: string;
        expires_at: string | null;
        maxuses: number | null;
        uses: number | null;
        active: boolean;
    }

    interface RedemptionEntry {
        id: number;
        donate_code_id: number;
        user_id: number;
        price_usd: number;
        redeemed_at: string;
        username: string;
    }

    interface TierEntry {
        id: number;
        price_usd: number;
        name: string;
        asset_id: number;
        robux: number;
        includes_all_items: boolean;
        created_at: string;
    }

    rank.promise.then(() => {
        if (!rank.hasPermission("GiveUserItem")) {
            errormsg = "You don't have permission to manage donation vouchers";
            disabled = true;
        }
    });

    function generateCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        return `${segment()}-${segment()}-${segment()}-${segment()}`;
    }

    async function loadVouchers() {
        try {
            islistloading = true;
            errormsg = undefined;
            const response = await request.get(`/donate/codes/list?limit=${limit}&offset=${offset}`);
            vouchers = Array.isArray(response) ? response : response.data;
            if (!Array.isArray(vouchers)) throw new Error("Bad response format");
        } catch (error) {
            errormsg = error.message || "Failed to load vouchers";
            vouchers = [];
        } finally {
            islistloading = false;
        }
    }

    async function deleteVoucher(donateCodeId: number) {
        if (!confirm('Are you sure you want to delete this donation voucher?')) return;
        try {
            loading = true;
            errormsg = undefined;
            await request.delete(`/donate/codes/delete`, { data: { DonateCodeId: donateCodeId } });
            successmsg = "Donation voucher deleted successfully";
            await loadVouchers();
            selectedVoucher = null;
            redemptions = [];
        } catch (error) {
            errormsg = error.message || "Failed to delete voucher";
        } finally {
            loading = false;
        }
    }

    async function loadRedemptions(donateCodeId: number) {
        try {
            redemptionLoading = true;
            errormsg = undefined;
            const response = await request.get(`/donate/codes/redemptions?donateCodeId=${donateCodeId}&limit=${limit}&offset=${offset}`);
            redemptions = Array.isArray(response) ? response : response.data;
            if (!Array.isArray(redemptions)) throw new Error("Invalid response format");
            selectedVoucher = vouchers.find(v => v.id === donateCodeId) || null;
        } catch (error) {
            errormsg = error.message || "Failed to load redemptions";
            redemptions = [];
        } finally {
            redemptionLoading = false;
        }
    }

    async function toggleActive(donateCodeId: number, currentStatus: boolean) {
        try {
            loading = true;
            errormsg = undefined;
            await request.post(`/donate/codes/toggle-active`, {
                DonateCodeId: donateCodeId,
                IsActive: !currentStatus
            });
            successmsg = `Voucher ${currentStatus ? 'deactivated' : 'activated'} successfully`;
            await loadVouchers();
        } catch (error) {
            errormsg = error.message || "Failed to toggle voucher status";
        } finally {
            loading = false;
        }
    }

    async function createVoucher() {
        errormsg = undefined;
        successmsg = undefined;
        loading = true;
        try {
            const tier = tiers.find(t => t.id === parseInt(selectedTierId));
            await request.post(`/donate/codes/create`, {
                Code: code.toUpperCase(),
                PriceUsd: tier ? tier.price_usd : parseInt(priceUsd),
                MaxUses: parseInt(maxUses),
                IsActive: isActive
            });
            successmsg = "Donation voucher created successfully!";
            code = "";
            selectedTierId = "";
            maxUses = "1";
            isActive = true;
            await loadVouchers();
        } catch (error) {
            errormsg = error.message || "Failed to create voucher";
        } finally {
            loading = false;
        }
    }

    async function loadTiers() {
        try {
            tierLoading = true;
            errormsg = undefined;
            const response = await request.get(`/donate/tiers/list`);
            tiers = Array.isArray(response) ? response : response.data;
            if (!Array.isArray(tiers)) throw new Error("Bad response format");
        } catch (error) {
            errormsg = error.message || "Failed to load tiers";
            tiers = [];
        } finally {
            tierLoading = false;
        }
    }

    function startEditTier(tier: TierEntry) {
        editingTier = tier;
        tierName = tier.name;
        tierPriceUsd = tier.price_usd.toString();
        tierAssetId = tier.asset_id.toString();
        tierRobux = tier.robux.toString();
        tierIncludesAll = tier.includes_all_items;
    }

    function cancelEditTier() {
        editingTier = null;
        tierName = "";
        tierPriceUsd = "";
        tierAssetId = "";
        tierRobux = "";
        tierIncludesAll = false;
    }

    async function saveTier() {
        errormsg = undefined;
        successmsg = undefined;
        loading = true;
        try {
            const data = {
                Name: tierName,
                PriceUsd: parseInt(tierPriceUsd),
                AssetId: parseInt(tierAssetId),
                Robux: parseInt(tierRobux) || 0,
                IncludesAllItems: tierIncludesAll
            };
            if (editingTier) {
                await request.post(`/donate/tiers/update`, { TierId: editingTier.id, ...data });
                successmsg = "Tier updated successfully!";
            } else {
                await request.post(`/donate/tiers/create`, data);
                successmsg = "Tier created successfully!";
            }
            cancelEditTier();
            await loadTiers();
        } catch (error) {
            errormsg = error.message || "Failed to save tier";
        } finally {
            loading = false;
        }
    }

    async function deleteTier(tierId: number) {
        if (!confirm('Are you sure you want to delete this tier?')) return;
        try {
            loading = true;
            errormsg = undefined;
            await request.delete(`/donate/tiers/delete`, { data: { TierId: tierId } });
            successmsg = "Tier deleted successfully!";
            if (editingTier?.id === tierId) cancelEditTier();
            await loadTiers();
        } catch (error) {
            errormsg = error.message || "Failed to delete tier";
        } finally {
            loading = false;
        }
    }

    async function loadCountdown() {
        try {
            countdownLoading = true;
            const response = await request.get(`/donate/settings`);
            countdownEnabled = response.countdown_enabled ?? false;
            const raw = response.countdown_end_date ?? '';
            if (raw) {
                countdownEndDate = raw.slice(0, 16);
            }
        } catch (error) {
            errormsg = error.message || "Failed to load countdown settings";
        } finally {
            countdownLoading = false;
        }
    }

    async function saveCountdown() {
        try {
            loading = true;
            errormsg = undefined;
            await request.post(`/donate/settings`, {
                CountdownEnabled: countdownEnabled,
                CountdownEndDate: countdownEndDate ? new Date(countdownEndDate).toISOString() : null
            });
            successmsg = "Countdown settings saved!";
        } catch (error) {
            errormsg = error.message || "Failed to save countdown settings";
        } finally {
            loading = false;
        }
    }

    $: selectedTier = tiers.find(t => t.id === parseInt(selectedTierId)) || null;

    onMount(() => {
        loadVouchers();
        loadTiers();
    });
</script>

<svelte:head>
    <title>Donation Vouchers</title>
</svelte:head>

<Main>
    <div class="row">
        <div class="col-12">
            <h1>Donation Vouchers</h1>

            {#if errormsg}
                <div class="alert alert-danger">{errormsg}</div>
            {/if}

            {#if successmsg}
                <div class="alert alert-success">{successmsg}</div>
            {/if}

            <ul class="nav nav-tabs mb-3">
                <li class="nav-item">
                    <button class="nav-link {activeTab === 'create' ? 'active' : ''}" on:click={() => activeTab = 'create'}>
                        Create a Voucher
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link {activeTab === 'list' ? 'active' : ''}" on:click={() => { activeTab = 'list'; loadVouchers(); }}>
                        View Vouchers
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link {activeTab === 'tiers' ? 'active' : ''}" on:click={() => { activeTab = 'tiers'; loadTiers(); }}>
                        Manage Tiers
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link {activeTab === 'countdown' ? 'active' : ''}" on:click={() => { activeTab = 'countdown'; loadCountdown(); }}>
                        Countdown
                    </button>
                </li>
            </ul>
        </div>

        {#if activeTab === 'create'}
            <div class="col-12 mt-3">
                <form on:submit|preventDefault={createVoucher}>
                    <div class="mb-3">
                        <label for="code" class="form-label">Voucher Code *</label>
                        <div class="input-group">
                            <input type="text" class="form-control" id="code" bind:value={code}
                                placeholder="e.g. ABCD-EFGH-IJKL" required minlength="4" maxlength="50"
                                disabled={disabled || loading} />
                            <button type="button" class="btn btn-outline-secondary" on:click={() => { code = generateCode(); }}
                                disabled={disabled || loading}>Generate</button>
                        </div>
                        <div class="form-text">4-50 characters. Will be uppercased automatically.</div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="tier-select" class="form-label">Donation Tier *</label>
                            <select class="form-select" id="tier-select" bind:value={selectedTierId}
                                required disabled={disabled || loading}>
                                <option value="">-- Select a tier --</option>
                                {#each tiers as tier}
                                    <option value={tier.id}>${tier.price_usd} - {tier.name}</option>
                                {/each}
                            </select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="max-uses" class="form-label">Max Uses *</label>
                            <input type="number" class="form-control" id="max-uses" bind:value={maxUses}
                                required min="1" max="1000000" disabled={disabled || loading} />
                        </div>
                    </div>
                    {#if selectedTier}
                        <div class="alert alert-info mb-3">
                            <strong>${selectedTier.price_usd} tier:</strong> grants "{selectedTier.name}" + {selectedTier.robux.toLocaleString()} Robux
                            {#if selectedTier.includes_all_items}+ all lower tier items{/if}
                        </div>
                    {/if}
                    <div class="mb-3 form-check">
                        <input type="checkbox" class="form-check-input" id="is-active" bind:checked={isActive}
                            disabled={disabled || loading} />
                        <label class="form-check-label" for="is-active">Active</label>
                    </div>
                    <div class="d-grid gap-2">
                        <button type="submit" class="btn btn-success"
                            disabled={disabled || loading || !code || !selectedTierId || !maxUses}>
                            {#if loading} Creating... {:else} Create Voucher {/if}
                        </button>
                    </div>
                </form>
            </div>
        {:else if activeTab === 'list'}
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
                                    Hide maxed vouchers
                                </label>
                            </div>
                        </div>
                        <button class="btn btn-primary btn-sm" on:click={loadVouchers} disabled={islistloading}>
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
                                <p class="mt-2">Loading vouchers...</p>
                            </div>
                        {:else if vouchers.filter(v => !hidemaxed || !v.maxuses || (v.uses ?? 0) < v.maxuses).length === 0}
                            <div class="alert alert-info">No donation vouchers found</div>
                        {:else}
                            <div class="table-responsive">
                                <table class="table table-striped table-hover">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Code</th>
                                            <th>Price</th>
                                            <th>Uses</th>
                                            <th>Status</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {#each vouchers.filter(v => !hidemaxed || !v.maxuses || (v.uses ?? 0) < v.maxuses) as voucher}
                                            <tr class={selectedVoucher?.id === voucher.id ? 'table-primary' : ''}>
                                                <td>{voucher.id}</td>
                                                <td>
                                                    <code>{voucher.code}</code>
                                                    {#if voucher.maxuses && (voucher.uses ?? 0) >= voucher.maxuses}
                                                        <span class="badge bg-danger ms-2">MAX</span>
                                                    {/if}
                                                </td>
                                                <td>${voucher.price_usd}</td>
                                                <td>{voucher.uses ?? 0}/{voucher.maxuses ?? '∞'}</td>
                                                <td>
                                                    {#if voucher.active}
                                                        <span class="badge bg-success">Active</span>
                                                    {:else}
                                                        <span class="badge bg-secondary">Inactive</span>
                                                    {/if}
                                                </td>
                                                <td>{new Date(voucher.created_at).toLocaleString()}</td>
                                                <td>
                                                    <div class="btn-group btn-group-sm">
                                                        <button
                                                            class="btn btn-primary"
                                                            on:click={() => loadRedemptions(voucher.id)}
                                                            disabled={redemptionLoading}
                                                            title="View redemptions"
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            class="btn {voucher.active ? 'btn-warning' : 'btn-success'}"
                                                            on:click={() => toggleActive(voucher.id, voucher.active)}
                                                            disabled={loading}
                                                            title={voucher.active ? 'Deactivate' : 'Activate'}
                                                        >
                                                            {voucher.active ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                        <button
                                                            class="btn btn-danger"
                                                            on:click={() => deleteVoucher(voucher.id)}
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

                {#if selectedVoucher}
                    <div class="card mt-3">
                        <div class="card-header">
                            <h5 class="mb-0">Redemptions for <code>{selectedVoucher.code}</code> (${selectedVoucher.price_usd})</h5>
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
                                <div class="alert alert-info">No redemptions found for this voucher</div>
                            {:else}
                                <div class="table-responsive">
                                    <table class="table table-striped table-hover">
                                        <thead>
                                            <tr>
                                                <th>User</th>
                                                <th>Price</th>
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
                                                    <td>${redemption.price_usd}</td>
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

        {:else if activeTab === 'tiers'}
            <div class="col-12 mt-3">
                <div class="row">
                    <div class="col-md-4">
                        <div class="card mb-3">
                            <div class="card-header">
                                <h5 class="mb-0">{editingTier ? 'Edit Tier' : 'Create Tier'}</h5>
                            </div>
                            <div class="card-body">
                                <form on:submit|preventDefault={saveTier}>
                                    <div class="mb-3">
                                        <label class="form-label">Tier Name *</label>
                                        <input type="text" class="form-control" bind:value={tierName}
                                            placeholder="e.g. Sea Traveler's Panama" required disabled={loading} />
                                    </div>
                                    <div class="row">
                                        <div class="col-6 mb-3">
                                            <label class="form-label">Price (USD) *</label>
                                            <input type="number" class="form-control" bind:value={tierPriceUsd}
                                                placeholder="10" required min="1" max="10000" disabled={loading} />
                                        </div>
                                        <div class="col-6 mb-3">
                                            <label class="form-label">Robux *</label>
                                            <input type="number" class="form-control" bind:value={tierRobux}
                                                placeholder="1100" min="0" max="1000000" disabled={loading} />
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Asset ID *</label>
                                        <input type="number" class="form-control" bind:value={tierAssetId}
                                            placeholder="Catalog asset ID" required disabled={loading} />
                                    </div>
                                    <div class="mb-3 form-check">
                                        <input type="checkbox" class="form-check-input" id="tier-includes-all"
                                            bind:checked={tierIncludesAll} disabled={loading} />
                                        <label class="form-check-label" for="tier-includes-all">Includes all lower tier items</label>
                                    </div>
                                    <div class="d-flex gap-2">
                                        <button type="submit" class="btn btn-success btn-sm"
                                            disabled={loading || !tierName || !tierPriceUsd || !tierAssetId}>
                                            {#if loading} Saving... {:else} {editingTier ? 'Update' : 'Create'} {/if}
                                        </button>
                                        {#if editingTier}
                                            <button type="button" class="btn btn-secondary btn-sm" on:click={cancelEditTier}
                                                disabled={loading}>Cancel</button>
                                        {/if}
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-8">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="mb-0">Tiers</h5>
                            <button class="btn btn-primary btn-sm" on:click={loadTiers} disabled={tierLoading}>
                                {#if tierLoading} Loading... {:else} Refresh {/if}
                            </button>
                        </div>
                        {#if tierLoading}
                            <div class="text-center py-4">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        {:else if tiers.length === 0}
                            <div class="alert alert-info">No tiers yet. Create one to get started.</div>
                        {:else}
                            <div class="tier-grid">
                                {#each tiers as tier}
                                    <div class="tier-card {editingTier?.id === tier.id ? 'tier-card-active' : ''}">
                                        <div class="tier-thumb-wrap">
                                            <img
                                                src={`/thumbs/asset.ashx?assetId=${tier.asset_id}&width=200&height=200`}
                                                alt={tier.name}
                                                class="tier-thumb"
                                                on:error={(e) => e.target.src = '/img/placeholder.png'}
                                            />
                                            {#if tier.includes_all_items}
                                                <span class="tier-badge">All Items</span>
                                            {/if}
                                        </div>
                                        <p class="tier-price">${tier.price_usd}</p>
                                        <p class="tier-name">{tier.name}</p>
                                        <p class="tier-robux">+{tier.robux.toLocaleString()} Robux</p>
                                        <div class="tier-btn-row">
                                            <button class="tier-btn tier-btn-edit"
                                                on:click={() => startEditTier(tier)} disabled={loading}>Edit</button>
                                            <button class="tier-btn tier-btn-delete"
                                                on:click={() => deleteTier(tier.id)} disabled={loading}>Delete</button>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        {:else if activeTab === 'countdown'}
            <div class="col-12 col-md-6 mt-3">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Countdown Settings</h5>
                        <button class="btn btn-primary btn-sm" on:click={loadCountdown} disabled={countdownLoading}>
                            {#if countdownLoading} Loading... {:else} Refresh {/if}
                        </button>
                    </div>
                    <div class="card-body">
                        {#if countdownLoading}
                            <div class="text-center py-4">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        {:else}
                            <div class="mb-3 form-check">
                                <input type="checkbox" class="form-check-input" id="countdown-enabled"
                                    bind:checked={countdownEnabled} disabled={loading} />
                                <label class="form-check-label" for="countdown-enabled">Show countdown banner on donate page</label>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">End Date</label>
                                <input type="datetime-local" class="form-control" bind:value={countdownEndDate}
                                    disabled={loading || !countdownEnabled} />
                                <div class="form-text">The countdown timer will count down to this date/time.</div>
                            </div>
                            <button class="btn btn-success" on:click={saveCountdown} disabled={loading}>
                                {#if loading} Saving... {:else} Save Settings {/if}
                            </button>
                        {/if}
                    </div>
                </div>
            </div>
        {/if}
    </div>
</Main>

<style>
    :global(.tier-grid) {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
        gap: 16px;
    }

    :global(.tier-card) {
        display: flex;
        padding: 14px;
        box-shadow: 0 1px 3px rgba(25, 25, 25, 0.15);
        border-radius: 6px;
        flex-direction: column;
        align-items: center;
        background: var(--bs-body-bg, #fff);
        transition: transform 150ms ease, box-shadow 150ms ease;
    }
    :global(.tier-card:hover) {
        transform: translateY(-3px);
        box-shadow: 0 4px 10px rgba(25, 25, 25, 0.25);
    }
    :global(.tier-card-active) {
        border: 2px solid #0d6efd;
        box-shadow: 0 5px 16px rgba(13, 110, 253, 0.25);
    }

    :global(.tier-thumb-wrap) {
        width: 100%;
        position: relative;
        aspect-ratio: 1 / 1;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 10px;
        background: var(--bs-tertiary-bg, #e3e3e3);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    :global(.tier-thumb) {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    :global(.tier-badge) {
        position: absolute;
        top: 6px;
        right: 6px;
        color: #fff;
        font-size: 10px;
        font-weight: 600;
        padding: 3px 6px;
        border-radius: 3px;
        background: #17a2b8;
    }

    :global(.tier-price) {
        color: #191919;
        margin: 0;
        font-size: 24px;
        font-weight: 700;
        line-height: 1;
    }

    :global(.tier-name) {
        color: var(--bs-body-color, #191919);
        margin: 0;
        font-size: 13px;
        font-weight: 600;
        text-align: center;
        min-height: 18px;
        margin-bottom: 4px;
    }

    :global(.tier-robux) {
        color: var(--bs-secondary-color, #6c757d);
        margin: 0;
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 10px;
    }

    :global(.tier-btn-row) {
        display: flex;
        gap: 6px;
        width: 100%;
        margin-top: auto;
    }

    :global(.tier-btn) {
        flex: 1;
        border: none;
        cursor: pointer;
        padding: 6px 0;
        font-size: 13px;
        font-weight: 600;
        border-radius: 4px;
        color: #fff;
    }

    :global(.tier-btn-edit) {
        background: #0d6efd;
    }
    :global(.tier-btn-edit:hover) { background: #0b5ed7; }

    :global(.tier-btn-delete) {
        background: #dc3545;
    }
    :global(.tier-btn-delete:hover) { background: #bb2d3b; }
</style>
