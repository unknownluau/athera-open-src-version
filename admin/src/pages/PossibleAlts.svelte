<script lang="ts">
	import { link } from "svelte-routing";
	import Main from "../components/templates/Main.svelte";
	import request from "../lib/request";
	import * as rank from "../stores/rank";
	
	let ipdata: {
		[hashed: string]: {
			users: {
				user_id: number;
				username: string;
				hashed_ip: string;
				last_seen: string;
				status: number;
				block_status: number;
			}[];
		};
	};
	let loading = false;

	$: if (rank.hasPermission("GetUsersList")) {
		loading = true;
		request.get("/users/alts")
			.then((res) => {
				ipdata = res.data?.data;
			})
			.finally(() => {
				loading = false;
			});
	}

	function getVPN(user1, user2) {
		const one = user1.block_status;
		const two = user2.block_status;
		
		if (one === 0 && two === 0) return "No";
		if (one === 1 && two === 1) return "Yes (both)";
		if (one === 2 && two === 2) return "Unsure (both)";
		
		let result = [];
		if (one === 1) result.push(`Yes for ${user1.username}`);
		if (one === 2) result.push(`Unsure for ${user1.username}`);
		if (two === 1) result.push(`Yes for ${user2.username}`);
		if (two === 2) result.push(`Unsure for ${user2.username}`);
		
		return result.join(", ");
	}
</script>

<svelte:head>
	<title>Possible Alts</title>
</svelte:head>

{#await rank.promise then _}
	<Main>
		{#if !rank.hasPermission("GetUsersList")}
			<div class="alert alert-danger">
				You don't have permission to view this page.
			</div>
		{:else}
			<div class="row">
				<div class="col-12">
					<h1>Possible Alts</h1>
					
					{#if loading}
						<div class="text-center my-4">
							<div class="spinner-border" role="status">
								<span class="visually-hidden">Loading...</span>
							</div>
						</div>
					{:else if ipdata}
						<div class="table-responsive">
							<table class="table table-striped">
								<thead>
									<tr>
										<th>Hashed IP</th>
										<th>User 1</th>
										<th>User 2</th>
										<th>Last Seen</th>
										<th>VPN?</th>
									</tr>
								</thead>
								<tbody>
									{#each Object.values(ipdata) as data}
										{#if data.users && data.users.length >= 2}
											<tr>
												<td>{data.users[0].hashed_ip.slice(0, 10)}...</td>
												<td>
													<a use:link href={`/admin/manage-user/${data.users[0].user_id}`}>
														{data.users[0].username} (ID: {data.users[0].user_id})
													</a>
												</td>
												<td>
													<a use:link href={`/admin/manage-user/${data.users[1].user_id}`}>
														{data.users[1].username} (ID: {data.users[1].user_id})
													</a>
												</td>
												<td>
													{new Date(data.users[0].last_seen).toLocaleString()}
												</td>
												<td>{getVPN(data.users[0], data.users[1])}</td>
											</tr>
										{/if}
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<div class="alert alert-info">
							Nothing found.
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</Main>
{/await}