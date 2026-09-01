<script lang="ts">
	import {navigate, link} from 'svelte-routing';
	import Main from "../components/templates/Main.svelte";
	import request from "../lib/request";
	import DashStatCard from "../components/DashStatCard.svelte";
	let usersJoinedPastHour: number;
	let usersJoinedPastDay: number;
	let usersOnline: number;
	let usersJoinedTotal: number;
	let usersActiveTotal: number;
	let usersInGame: {user_id: number; username: string; asset_id: number; asset_name: string;}[] | undefined;
	let numPendingAssets: number|undefined;
	let numPendingText: number|undefined;
	let numPendingReports: number|undefined;
	let totalAlts: number | undefined;

	Promise.all([
		request.get(`/groups/pending-icons`),
		request.get(`/assets/pending-assets`),
		request.get(`/icons/pending-assets`),
	]).then(d => {
		let count = 0;
		for (const result of d) {
			count += result.data.length;
		}
		numPendingAssets = count;
	})

	let showInGame = false;
	if (rank.hasPermission("GetUserJoinCount")) {
        request.get<{ total: number }>("/user-joins?period=past-hour").then((data) => {
            usersJoinedPastHour = data.data.total;
        });
		request.get<{ total: number }>("/user-joins?period=past-day").then((data) => {
			usersJoinedPastDay = data.data.total;
		});
		request.get<{ total: number }>("/user-joins?period=totalactive").then((data) => {
			usersActiveTotal = data.data.total;
		});
	}
	if (rank.hasPermission('GetUsersInGame')) {
		request.get('/players/in-game').then(data => {
			usersInGame = data.data;
		})
	}
	if (rank.hasPermission("ManageReports")) {
		request.get("/reports/list?status=Pending&offset=0&sort=Asc").then(data => {
			numPendingReports = data.data.length;
		});
	}
	if (rank.hasPermission('GetUsersOnline')) {
		request.get('/players/online-count').then(t => {
			usersOnline = t.data.total;
		})
	}
	if (rank.hasPermission("GetUserJoinCount")) {
		request.get<{ total: number }>("/user-joins?period=total").then((data) => {
			usersJoinedTotal = data.data.total;
		});
	}
    if (rank.hasPermission("GetUsersList")) {
        request.get("/users/alts").then((response) => { 
            if (!response.data || !response.data.data) {
                console.error("[error] bad alt structure");
                totalAlts = 0;
                return;
            }

            const altdata = response.data.data;

            let count = 0;
            for (const group in altdata) {
                if (altdata[group]?.users?.length > 1) {
                    count++;
                }
            }
            
            console.log("[info] alt groups:", count);
            totalAlts = count;
        }).catch(error => {
            console.error("[error] error getting alts:", error);
            totalAlts = 0;
        });
    }
	import * as rank from "../stores/rank";
	import Permission from "../components/Permission.svelte";
import { get } from 'svelte/store';
import dayjs from 'dayjs';
import { now } from 'svelte/internal';
</script>

<svelte:head>
	<title>Dashboard</title>
</svelte:head>

<Main>
	<div class="row">
		<div class="col-12">
			<h1>Dashboard</h1>
		</div>
	</div>

	<div class="row">
		<Permission p="GetUserJoinCount">
			<DashStatCard key={((typeof usersJoinedPastHour === "number" && usersJoinedPastHour.toLocaleString()) || "-") + '/' + ((typeof usersJoinedPastDay === "number" && usersJoinedPastDay.toLocaleString()) || "-")} value="Users Signed Up, Past Hour/Day" cardClasses="bg-success bg-gradient" />
		</Permission>
		<Permission p="GetUsersOnline">
			<DashStatCard key={((typeof usersOnline === "number" && usersOnline.toLocaleString()) || "-")} value="Users Online" cardClasses="bg-primary bg-gradient" />
		</Permission>
		<Permission p="GetUsersInGame">
			<DashStatCard 
				onClick={() => {
					showInGame = !showInGame;
				}} 
				key={((usersInGame && usersInGame.length.toLocaleString()) || "-")} 
				value="Users In-Game" 
				cardClasses="bg-primary bg-gradient pointer" 
			/>
		</Permission>
		{#if numPendingAssets != undefined}
			<DashStatCard onClick={() => {
				navigate('/admin/asset/approval');
			}} value='Num Pending Assets' key={numPendingAssets.toLocaleString()} cardClasses="bg-warning bg-gradient pointer" />
		{/if}
		{#if numPendingReports != undefined}
			<DashStatCard onClick={() => {
				navigate('/admin/reports');
			}} value='Num Pending Reports' key={numPendingReports.toLocaleString()} cardClasses="bg-danger bg-gradient pointer" />
		{/if}
		<Permission p="GetUserJoinCount">
			<DashStatCard 
				key={((typeof usersJoinedTotal === "number" && usersJoinedTotal.toLocaleString()) || "-")} 
				value="Total Users" 
				cardClasses="bg-info bg-gradient" 
			/>
			<DashStatCard 
				key={((typeof usersActiveTotal === "number" && usersActiveTotal.toLocaleString()) || "-")} 
				value="Total (Active) Users" 
				cardClasses="bg-secondary bg-gradient" 
			/>
		</Permission>
		<Permission p="GetUsersList">
			<DashStatCard 
				onClick={() => {
					navigate('/admin/alts');
				}}
				key={((typeof totalAlts === "number" && totalAlts.toLocaleString()) || "-")} 
				value="Num Possible Alts" 
				cardClasses="bg-info bg-gradient pointer" 
			/>
		</Permission>
	</div>

	{#if showInGame}
		<div class="row mt-4">
			<div class="col-12">
				<hr />
				<h3 class="mt-4 mb-4">Users In-Game</h3>
			</div>
			{#if usersInGame.length === 0}
				<div class="col-12">
					<p>No users in game</p>
				</div>
			{/if}
			{#each usersInGame as data}
				<div class="col-12 col-md-6 col-lg-4">
					<div class="card card-body">
						<div class="row">
							<div class="col-6 col-md-3">
								<img class="avatar-thumb" src={`/Thumbs/Avatar.ashx?height=420&width=420&userid=${data.user_id}&v=0`} alt='User avatar' />
							</div>
							<div class="col-6 col-md-9">
								<p><a href={`/users/${data.user_id}/profile`}>{data.username}</a></p>
								<p>Game: <a href={`/games/${data.asset_id}/--`}>{data.asset_name}</a></p>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<div class="row">
		<Permission p="SetAlert">
			<div class="col-12 mt-4">
				<div class="card">
					<div class="card-body">
						<h3>Manage Site-Wide Alert</h3>
						<p>To clear the alert, empty the text box and press submit.</p>
						{#await request.get("/alert") then alertInfo}
							<input placeholder="Alert Text" class="form-control" type="text" id="sitewide-alert-text" value={alertInfo.data.Text} />
							<input placeholder="Alert URL" class="form-control" type="text" id="sitewide-alert-url" value={alertInfo.data.LinkUrl} />
							<button
								class="btn btn-success mt-2"
								on:click={(e) => {
									e.preventDefault();
									let msg = document.getElementById("sitewide-alert-text");
									let url = document.getElementById("sitewide-alert-url");
									request
										.post("/alert", {
											// @ts-ignore
											text: msg.value,
											// @ts-ignore
											url: url.value,
										})
										.then(() => {
											alert("Site-wide updated!");
										})
										.finally(() => {});
								}}>Submit</button
							>
						{/await}
					</div>
				</div>
			</div>
		</Permission>
	</div>
</Main>