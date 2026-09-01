<script lang="ts">
    import Main from "../components/templates/Main.svelte";
    import request from "../lib/request";
    import * as rank from "../stores/rank";
    let OBJ: File | null = null;
    let RBXM: File | null = null;
    let disabled = false;
    let loading = false;
    let errmsg: string | undefined;
    let result: { assetId?: number, meshId?: number } = {};
    let assetTypeId: string = "4";
    let name: string = "";
    let description: string = "";

    rank.promise.then(() => {
        if (!rank.hasPermission("CreateAsset")) {
            errmsg = "You don't have permission to create assets";
            disabled = true;
        }
    });

    async function upload() {
        errmsg = undefined;
        result = {};
        loading = true;

        try {
            const formData = new FormData();
            formData.append("OBJ", OBJ);
            formData.append("RBXM", RBXM);
            formData.append("Name", name);
            formData.append("Description", description);
            formData.append("AssetType", assetTypeId);

            const response = await request.post(
                "/asset/create-custom-asset",
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            result = response.data;
        } catch (error: any) {
            errmsg = error.response?.data?.error || 
                    error.message || 
                    "Failed to migrate asset, please try again";
        } finally {
            loading = false;
        }
    }

    function handleOBJ(event: Event) {
        const input = event.target as HTMLInputElement;
        OBJ = input.files?.[0] ?? null;
    }

    function handleRBXM(event: Event) {
        const input = event.target as HTMLInputElement;
        RBXM = input.files?.[0] ?? null;
    }
</script>

<svelte:head>
    <title>Create Custom Item</title>
</svelte:head>

<Main>
    <div class="row">
        <div class="col-12">
            <h1>Create Custom Item</h1>
            {#if errmsg}
                <div class="alert alert-danger">{errmsg}</div>
            {/if}

            {#if result && result.meshId !== undefined}
                    <p>Link: <a href={`/catalog/${result.meshId + 1}/--`}>View on site</a></p>
                    <p>Product: <a href={`/admin/product/update?assetId=${result.meshId + 1}`}>Update Product</a></p>
            {/if}
        </div>

        <div class="col-12 mt-3">
            <form on:submit|preventDefault={upload}>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="name" class="form-label">Name *</label>
                        <input 
                            type="text" 
                            class="form-control" 
                            id="name" 
                            bind:value={name}
                            required
                            disabled={disabled || loading}
                        />
                    </div>

                    <div class="col-md-6 mb-3">
                        <label for="assettype" class="form-label">Type *</label>
                        <select 
                            class="form-control" 
                            id="assettype" 
                            bind:value={assetTypeId}
                            disabled={disabled || loading}
                        >
                            {#await request.get("/asset/types") then data}
                                {#each Object.getOwnPropertyNames(data.data) as element}
                                    {#if !isNaN(parseInt(element))}
                                        <option value={element}>{data.data[element]}</option>
                                    {/if}
                                {/each}
                            {/await}
                        </select>
                    </div>

                    <div class="col-12 mb-3">
                        <label for="description" class="form-label">Description (Optional)</label>
                        <input 
                            type="text" 
                            class="form-control" 
                            id="description" 
                            bind:value={description}
                            disabled={disabled || loading}
                        />
                    </div>
					
                    <div class="col-md-6 mb-3">
                        <label for="rbxm-file" class="form-label">RBXM *</label>
                        <input 
                            type="file" 
                            class="form-control"
                            id="rbxm-file" 
                            accept=".rbxm,.rbxmx"
                            on:change={handleRBXM}
                            required
                            disabled={disabled || loading}
                        />
                    </div>

                    <div class="col-md-6 mb-3">
                        <label for="obj-file" class="form-label">OBJ *</label>
                        <input 
                            type="file" 
                            class="form-control"
                            id="obj-file" 
                            accept=".obj"
                            on:change={handleOBJ}
                            required
                            disabled={disabled || loading}
                        />
                    </div>
                </div>

                <div class="col-12 mt-4">
					<button 
						type="submit" 
						class="btn btn-success"
						disabled={loading}
					>
						{#if loading}
							Creating Asset...
						{:else}
							Create Asset
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