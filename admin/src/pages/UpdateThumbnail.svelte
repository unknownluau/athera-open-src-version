<script lang="ts">
    import Main from "../components/templates/Main.svelte";
    import request from "../lib/request";
    import * as rank from "../stores/rank";

    let assetId: string = "";
    let thumbnailFile: File | null = null;
    let disabled = false;
    let loading = false;
    let errmsg: string | undefined;
    let successmsg: string | undefined;

    rank.promise.then(() => {
        if (!rank.hasPermission("SetAssetModerationStatus")) {
            errmsg = "You don't have permission to change thumbnails";
            disabled = true;
        }
    });

    async function changeThumbnail() {
        errmsg = undefined;
        successmsg = undefined;
        loading = true;

        if (!assetId || !thumbnailFile) {
            errmsg = "Both Asset ID and Thumbnail file are required";
            loading = false;
            return;
        }

        const formData = new FormData();
        formData.append("assetId", assetId);
        formData.append("thumbnail", thumbnailFile);

        try {
            const response = await request.post(
                `/asset/thumbnail?assetId=${assetId}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            successmsg = `Thumbnail for asset ${assetId} changed successfully! Please note, this update may not take effect on your browser, so you may have to clear your cache.`;
        } catch (error: any) {
            errmsg = error.message || "Failed to change thumbnail, please try again";
        } finally {
            loading = false;
        }
    }

    function handleupload(event: Event) {
        const input = event.target as HTMLInputElement;
        thumbnailFile = input.files?.[0] ?? null;
    }
</script>

<svelte:head>
    <title>Update Asset Thumbnail</title>
</svelte:head>

<Main>
    <div class="row">
        <div class="col-12">
            <h1>Update Asset Thumbnail</h1>

            {#if errmsg}
                <div class="alert alert-danger">{errmsg}</div>
            {/if}

            {#if successmsg}
                <div class="alert alert-success">{successmsg}</div>
            {/if}
        </div>

        <div class="col-12 mt-3">
            <form on:submit|preventDefault={changeThumbnail}>
                <div class="mb-3">
                    <label for="asset-id" class="form-label">Asset ID *</label>
                    <input 
                        type="number" 
                        class="form-control" 
                        id="asset-id" 
                        bind:value={assetId}
                        required
                        disabled={disabled || loading}
                    />
                </div>

                <div class="mb-3">
                    <label for="thumbfile" class="form-label">Thumbnail *</label>
                    <input 
                        type="file" 
                        class="form-control"
                        id="thumbfile" 
                        accept="image/png, image/jpeg"
                        on:change={handleupload}
                        required
                        disabled={disabled || loading}
                    />
                    <small class="form-text">Only PNG/JPEG images are allowed/work properly</small>
                </div>

                <div class="col-12 mt-4">
                    <button 
                        type="submit" 
                        class="btn btn-success"
                        disabled={disabled || loading || !assetId || !thumbnailFile}
                    >
                        {#if loading}
                            Updating...
                        {:else}
                            Apply
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
    .form-text {
        font-size: 0.85rem;
        color: #6c757d;
    }
</style>