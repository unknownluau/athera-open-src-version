const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const API_KEY = process.env.API_KEY;
const API_BASE_URL = process.env.API_BASE_URL || 'https://athera.sbs';
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const MODERATION_CHANNEL_ID = process.env.MODERATION_CHANNEL_ID;
const MODERATION_ROLE_ID = process.env.MODERATION_ROLE_ID;
const ALLOWED_GUILD_ID = '1502604287048683541'; // athera
const ALLOWED_USER_IDS = [
    '1302918658804416553',  // unknown
    '1073165217871171604',  // plutomaster
    '1440424399974170855',  // vaz
    '1319393072785653972',  // app
    '1483153230438334528'   // cryxel
];

const BOOSTS_FILE = path.join(__dirname, 'boosts.json');
const PROCESSED_ASSETS_FILE = path.join(__dirname, 'processed-assets.json');
const processedAssets = new Set();

function loadProcessedAssets() {
    try {
        if (fs.existsSync(PROCESSED_ASSETS_FILE)) {
            const data = JSON.parse(fs.readFileSync(PROCESSED_ASSETS_FILE, 'utf8'));
            data.forEach(id => processedAssets.add(id));
        }
    } catch (error) {
        console.error('Error loading processed assets:', error);
    }
}

function saveProcessedAssets() {
    try {
        fs.writeFileSync(PROCESSED_ASSETS_FILE, JSON.stringify([...processedAssets]), 'utf8');
    } catch (error) {
        console.error('Error saving processed assets:', error);
    }
}

const REWARD_ITEM_IDS = [];

function loadBoosts() {
    try {
        if (fs.existsSync(BOOSTS_FILE)) {
            return JSON.parse(fs.readFileSync(BOOSTS_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading boosts:', error);
    }
    return {};
}

function saveBoosts(boosts) {
    try {
        fs.writeFileSync(BOOSTS_FILE, JSON.stringify(boosts, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving boosts:', error);
    }
}

console.log('athera bot goin up');

if (!BOT_TOKEN || !CLIENT_ID) {
    console.error('Missing required environment variables!');
    process.exit(1);
}

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'ATHERA-botAPIkey': API_KEY || '',
        'User-Agent': 'DiscordBot/1.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    timeout: 15000,
    validateStatus: function (status) {
        return status < 600;
    }
});

async function checkPendingAssets() {
    if (!MODERATION_CHANNEL_ID) return;

    try {
        const assetsRes = await apiClient.get('/botapi/assets/pending-assets');
        if (assetsRes.data) {
            for (const asset of assetsRes.data) {
                const uniqueKey = 'asset:' + (asset.id || asset.asset_id);
                if (!processedAssets.has(uniqueKey)) {
                    try {
                        console.log('Sending asset moderation message for:', asset);
                        await sendModerationMessage(asset, 'asset');
                        processedAssets.add(uniqueKey);
                        saveProcessedAssets();
                    } catch (err) {
                        console.error('Error sending asset moderation message:', err);
                    }
                }
            }
        }

        const iconsRes = await apiClient.get('/botapi/icons/pending-assets');
        if (iconsRes.data) {
            for (const icon of iconsRes.data) {
                const uniqueKey = 'icon:' + (icon.id || icon.asset_id);
                if (!processedAssets.has(uniqueKey)) {
                    try {
                        console.log('Sending icon moderation message for:', icon);
                        await sendModerationMessage(icon, 'icon');
                        processedAssets.add(uniqueKey);
                        saveProcessedAssets();
                    } catch (err) {
                        console.error('Error sending icon moderation message:', err);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error checking pending assets:', error);
    }
}

async function sendModerationMessage(asset, mode) {
    const channel = await client.channels.fetch(MODERATION_CHANNEL_ID);
    if (!channel) {
        console.error('no mod channel');
        return;
    }
    
    const catalogAssetId = mode === 'icon' ? asset.asset_id : (asset.id || asset.asset_id);
    const moderationId = asset.id;
    const assetName = asset.name || `Asset ${catalogAssetId}`;
    const creatorName = asset.creatorName || asset.creatorname || 'Unknown';
    const creatorId = asset.creatorId || asset.user_id || 'Unknown';
    const assetUrl = `${API_BASE_URL}/catalog/${catalogAssetId}/--`;
    let previewUrl = '';
    if (asset.group_id) {
        previewUrl = '';
    } else if (asset.content_url) {
        previewUrl = asset.content_url.startsWith('http') ? asset.content_url : `${API_BASE_URL}${asset.content_url}`;
    }

    const embed = new EmbedBuilder()
        .setColor(0xFFA500)
        .setTitle(`Pending ${mode} Moderation: ${assetName}`)
        .setDescription(`**Asset ID:** ${catalogAssetId}\n**Creator:** ${creatorName} (ID: ${creatorId})\n**Link:** [Click here](${assetUrl})`)
        .setTimestamp();

    if (previewUrl && asset.assetType !== 'Audio' && asset.assetType !== 'Mesh') {
        embed.setImage(previewUrl);
    }

    const approveBtn = new ButtonBuilder()
        .setCustomId(`moderation_approve_${mode}_${moderationId}`)
        .setLabel('Approve')
        .setStyle(ButtonStyle.Success);

    const approve18Btn = new ButtonBuilder()
        .setCustomId(`moderation_approve18_${mode}_${moderationId}`)
        .setLabel('Approve (18+)')
        .setStyle(ButtonStyle.Primary);

    const declineBtn = new ButtonBuilder()
        .setCustomId(`moderation_decline_${mode}_${moderationId}`)
        .setLabel('Decline')
        .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder();
    
    if (mode === 'asset') {
        row.addComponents(approveBtn, approve18Btn, declineBtn);
    } else {
        row.addComponents(approveBtn, declineBtn);
    }

    const messageContent = `<@&${MODERATION_ROLE_ID}>`;
    await channel.send({
        content: messageContent,
        embeds: [embed],
        components: [row]
    });
}

function hasPermission(member) {
    if (member.permissions.has(PermissionFlagsBits.Administrator)) {
        return true;
    }
    if (MODERATION_ROLE_ID && member.roles.cache.has(MODERATION_ROLE_ID)) {
        return true;
    }
    if (ALLOWED_USER_IDS.includes(member.id)) {
        return true;
    }
    return false;
}

apiClient.interceptors.request.use(request => {
    console.log('\nAPI Request:');
    console.log(`URL: ${request.method?.toUpperCase()} ${request.baseURL}${request.url}`);
    if (request.params) console.log('Params:', request.params);
    if (request.data) console.log('Body:', JSON.stringify(request.data).substring(0, 500));
    return request;
});

apiClient.interceptors.response.use(
    response => {
        console.log('API Response:');
        console.log(`Status: ${response.status}`);
        if (response.data && typeof response.data === 'object') {
            console.log('Data:', JSON.stringify(response.data, null, 2).substring(0, 1000));
        }
        return response;
    },
    error => {
        console.error('API Error:');
        console.log(`Message: ${error.message}`);
        if (error.response) {
            console.log(`Status: ${error.response.status}`);
            console.log(`Data:`, error.response.data);
        }
        return Promise.reject(error);
    }
);

const pendingTransfers = new Map();

const commands = [
    new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Flip a coin and win or lose Robux')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount of Robux to bet (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        ),

    new SlashCommandBuilder()
        .setName('lookup')
        .setDescription('Look up a user by Discord ID, Athera ID, or Username')
        .addStringOption(option =>
            option.setName('target')
                .setDescription('Discord ID, Athera ID, or Username')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('resetpassword')
        .setDescription('[ADMIN] Reset a user\'s password')
        .addStringOption(option =>
            option.setName('user_id')
                .setDescription('Discord ID, Athera ID, or Username')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('punish')
        .setDescription('Punish a user')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of punishment')
                .setRequired(true)
                .addChoices(
                    { name: 'Warning', value: 'warning' },
                    { name: '1 Day Ban', value: '1day' },
                    { name: '3 Days Ban', value: '3days' },
                    { name: '7 Days Ban', value: '7days' },
                    { name: 'Permanent Ban', value: 'permanent' },
                    { name: 'IP Poison', value: 'ip' }
                )
        )
        .addStringOption(option =>
            option.setName('user_id')
                .setDescription('Discord ID, Athera ID, or Username')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('giverobux')
        .setDescription('Add Robux to a user')
        .addStringOption(option =>
            option.setName('target')
                .setDescription('Discord ID, Athera ID, or Username')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount of Robux to add')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('setrobux')
        .setDescription('Set a user\'s Robux balance')
        .addStringOption(option =>
            option.setName('target')
                .setDescription('Discord ID, Athera ID, or Username')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Total Robux amount to set')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('transferlimiteds')
        .setDescription('Transfer limited items from one user to another')
        .addStringOption(option =>
            option.setName('sender')
                .setDescription('User to take items from (Username, ID, or Mention)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('target')
                .setDescription('User to give items to (Username, ID, or Mention)')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('checkitem')
        .setDescription('Check if a user owns a specific item')
        .addStringOption(option =>
            option.setName('target')
                .setDescription('Discord ID, Athera ID, or Username')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('item_id')
                .setDescription('The ID of the item to check')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('giveitem')
        .setDescription('Give a user a specific item')
        .addStringOption(option =>
            option.setName('target')
                .setDescription('Discord ID, Athera ID, or Username')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('item_id')
                .setDescription('The ID of the item to give')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('removerobux')
        .setDescription('Remove Robux from a user')
        .addStringOption(option =>
            option.setName('target')
                .setDescription('Discord ID, Athera ID, or Username')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('amount')
                .setDescription('Amount of Robux to remove')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName('removeitem')
        .setDescription('Remove a specific item from a user')
        .addStringOption(option =>
            option.setName('target')
                .setDescription('Discord ID, Athera ID, or Username')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('item_id')
                .setDescription('The ID of the item to remove')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount of items to remove (defaults to 1)')
                .setRequired(false)
                .setMinValue(1)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('changeusername')
        .setDescription('Change a user\'s username')
        .addStringOption(option =>
            option.setName('target')
                .setDescription('Discord ID, Athera ID, or Username of the user')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('new_username')
                .setDescription('The new username for the user')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the game server')
        .addStringOption(option =>
            option.setName('target')
                .setDescription('Discord ID, Athera ID, or Username of the user')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
].map(command => command.toJSON());

async function registerCommands() {
    const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

    try {
        console.log('Registering slash commands...');

        const targetGuildId = GUILD_ID || ALLOWED_GUILD_ID;

        if (targetGuildId) {
            await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, targetGuildId),
                { body: commands }
            );
            console.log(`Commands registered to guild: ${targetGuildId}`);
        } else {
            await rest.put(
                Routes.applicationCommands(CLIENT_ID),
                { body: commands }
            );
            console.log('Commands registered globally');
        }

    } catch (error) {
        console.error('Failed to register commands:', error.message);
    }
}

client.once(Events.ClientReady, async () => {
    console.log(`Bot logged in as ${client.user.tag}!`);
    console.log(`Serving ${client.guilds.cache.size} server(s)`);

    loadProcessedAssets();

    client.guilds.cache.forEach(guild => {
        if (guild.id !== ALLOWED_GUILD_ID) {
            console.log(`leavin unauthzed server/s: ${guild.name} (${guild.id})`);
            guild.leave();
        }
    });

    client.user.setActivity('Making athera safer', { type: 'PLAYING' });

    await registerCommands();

    if (MODERATION_CHANNEL_ID) {
        setInterval(checkPendingAssets, 30000);
        await checkPendingAssets();
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;
    if (message.guild.id !== ALLOWED_GUILD_ID) return;

    if (message.type >= 8 && message.type <= 11) {
        console.log(`Boost detected from ${message.author.tag}`);
        await handleBoost(message);
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.guild && interaction.guild.id !== ALLOWED_GUILD_ID) return;
    if (!interaction.isButton()) return;
    if (!ALLOWED_USER_IDS.includes(interaction.user.id)) return;

    if (interaction.customId.startsWith('moderation_')) {
        await interaction.deferReply({ flags: 64 });
        
        if (!hasPermission(interaction.member)) {
            return interaction.editReply({ content: 'You don\'t have permission to moderate assets!', flags: 64 });
        }

        const parts = interaction.customId.split('_');
        const action = parts[1];
        const mode = parts[2];
        const assetId = parts[3];

        try {
            if (mode === 'asset') {
                if (action === 'approve') {
                    await apiClient.post('/botapi/asset/moderate', {
                        isApproved: true,
                        assetId: assetId,
                        is18Plus: false,
                        discordUserId: interaction.user.id
                    });
                } else if (action === 'approve18') {
                    await apiClient.post('/botapi/asset/moderate', {
                        isApproved: true,
                        assetId: assetId,
                        is18Plus: true,
                        discordUserId: interaction.user.id
                    });
                } else if (action === 'decline') {
                    await apiClient.post('/botapi/asset/moderate', {
                        isApproved: false,
                        assetId: assetId,
                        is18Plus: false,
                        discordUserId: interaction.user.id
                    });
                }
            } else if (mode === 'icon') {
                if (action === 'approve') {
                    await apiClient.post('/botapi/icon/moderate', {
                        isApproved: true,
                        iconId: assetId,
                        is18Plus: false,
                        discordUserId: interaction.user.id
                    });
                } else if (action === 'decline') {
                    await apiClient.post('/botapi/icon/moderate', {
                        isApproved: false,
                        iconId: assetId,
                        is18Plus: false,
                        discordUserId: interaction.user.id
                    });
                }
            }

            const embed = interaction.message.embeds[0];
            const updatedEmbed = EmbedBuilder.from(embed)
                .setColor(action.startsWith('approve') ? 0x00FF00 : 0xFF0000)
                .setTitle(`${action.startsWith('approve') ? 'Approved' : 'Declined'}: ${embed.title}`)
                .setFooter({ text: `Handled by ${interaction.user.tag}` });

            await interaction.message.edit({
                embeds: [updatedEmbed],
                components: []
            });

            await interaction.editReply({ content: `Successfully ${action.startsWith('approve') ? 'approved' : 'declined'} ${mode} ${assetId}!`, flags: 64 });
        } catch (error) {
            console.error('Moderation error:', error);
            await interaction.editReply({ content: `Error: ${error.message}`, flags: 64 });
        }
        return;
    }
});

client.on('guildCreate', guild => {
    if (guild.id !== ALLOWED_GUILD_ID) {
        console.log(`left unauthzed server: ${guild.name} (${guild.id})`);
        guild.leave();
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.guild && interaction.guild.id !== ALLOWED_GUILD_ID) return;
    if (!interaction.isCommand()) return;

    const { commandName, options, user, channel, guild } = interaction;

    const publicCommands = [];
    if (!publicCommands.includes(commandName) && !ALLOWED_USER_IDS.includes(user.id)) {
        return interaction.reply({
            content: 'you dont have permission to use this command GET OUTTA HERE',
            flags: 64
        });
    }

    try {
        switch (commandName) {
            case 'coinflip':
                await handleCoinflip(interaction, options, user);
                break;

            // case 'verify':
            //     await triggerVerification(interaction);
            //     break;

            case 'lookup':
                await handleLookup(interaction, options);
                break;

            case 'giverobux':
                await handleGiveRobux(interaction, options);
                break;

            case 'setrobux':
                await handleSetRobux(interaction, options);
                break;

            case 'resetpassword':
                await handleResetPassword(interaction, options, user);
                break;

            case 'removeitem':
                await handleRemoveItem(interaction, options);
                break;

            case 'punish':
                await handlePunish(interaction, options);
                break;

            case 'transferlimiteds':
                await handleTransferLimiteds(interaction, options);
                break;

            case 'removerobux':
                await handleRemoveRobux(interaction, options);
                break;

            case 'checkitem':
                await handleCheckItem(interaction, options);
                break;

            case 'giveitem':
                await handleGiveItem(interaction, options);
                break;

            case 'changeusername':
                await handleChangeUsername(interaction, options);
                break;

            case 'kick':
                await handleKick(interaction, options);
                break;
        }
    } catch (error) {
        console.error(`Command error (${commandName}):`, error);

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('Error')
            .setDescription(error.message.substring(0, 200))
            .setTimestamp();

        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [embed], flags: 64 });
            } else {
                await interaction.reply({ embeds: [embed], flags: 64 });
            }
        } catch (replyError) {
            console.error('Failed to send error message:', replyError);
        }
    }
});

async function handleCoinflip(interaction, options, user) {
    await interaction.deferReply();

    const amount = options.getInteger('amount');
    const discordId = user.id;

    console.log(`\nCoinflip: ${user.tag} betting ${amount} Robux`);

    try {
        // const response = await apiClient.get('/botapi/discord/coinflip', {
        //     params: {
        //         ID: discordId,
        //         amount: amount.toString()
        //     }
        // });

        // if (response.status >= 400) {
        //     let errorMsg = `API Error ${response.status}`;
        //     if (response.data?.error) errorMsg += `: ${response.data.error}`;
        //     if (response.data?.errors) errorMsg += `: ${JSON.stringify(response.data.errors)}`;
        //     throw new Error(errorMsg);
        // }

        // const data = response.data;

        // if (data.error) {
        //     const embed = new EmbedBuilder()
        //         .setColor(0xFFA500)
        //         .setTitle('Error')
        //         .setDescription(String(data.error))
        //         .setTimestamp();

        //     await interaction.editReply({ embeds: [embed] });
        //     return;
        // }

        // const embed = new EmbedBuilder()
        //     .setColor(data.Won ? 0x00FF00 : 0xFF0000)
        //     .setTitle(data.Won ? 'You Won!' : 'You Lost')
        //     .setDescription(data.Status || 'Coinflip completed')
        //     .addFields(
        //         { name: 'Bet Amount', value: `${amount} Robux`, inline: true },
        //         { name: 'Result', value: data.Won ? 'Heads (Win)' : 'Tails (Loss)', inline: true }
        //     )
        //     .setFooter({ text: `Flipped by ${user.username}` })
        //     .setTimestamp();

        // if (data.Winnings !== undefined) {
        //     embed.addFields({ name: 'Winnings', value: `${data.Winnings} Robux`, inline: true });
        // }

        // if (data.NewBalance !== undefined) {
        //     embed.addFields({ name: 'New Balance', value: `${data.NewBalance} Robux`, inline: true });
        // }

        // await interaction.editReply({ embeds: [embed] });

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('disabled')
            .setDescription('Coinflip command is disabled for now.')
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Coinflip error:', error.message);

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('Coinflip Failed')
            .setDescription('Could not process coinflip request')
            .addFields(
                { name: 'Error', value: error.message.substring(0, 100), inline: false },
                { name: 'Discord ID', value: discordId, inline: true },
                { name: 'Amount', value: `${amount} Robux`, inline: true }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
}

async function handleGiveRobux(interaction, options) {
    await interaction.deferReply({ flags: 64 });
    const targetRaw = options.getString('target');
    const target = targetRaw.replace(/[<@!>]/g, '');
    const amount = options.getInteger('amount');

    try {
        const response = await apiClient.get('/botapi/discord/add-robux', {
            params: { ID: target, amount: amount.toString() }
        });

        if (response.data.success) {
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('Robux Added')
                .setDescription(response.data.Status || `Successfully added ${amount} Robux to ${target}`)
                .addFields(
                    { name: 'Target', value: target, inline: true },
                    { name: 'Amount Added', value: amount.toString(), inline: true },
                    { name: 'New Balance', value: response.data.NewBalance.toString(), inline: true }
                )
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } else {
            throw new Error(response.data.error || 'Failed to add Robux');
        }
    } catch (error) {
        console.error('GiveRobux Error:', error.message);
        await interaction.editReply({ content: `Error adding Robux: ${error.message}` });
    }
}

async function handleSetRobux(interaction, options) {
    await interaction.deferReply({ flags: 64 });
    const targetRaw = options.getString('target');
    const target = targetRaw.replace(/[<@!>]/g, '');
    const amount = options.getInteger('amount');

    try {
        const response = await apiClient.get('/botapi/discord/set-robux', {
            params: { ID: target, amount: amount.toString() }
        });

        if (response.data.success) {
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('Robux Balance Set')
                .setDescription(response.data.Status || `Successfully set Robux balance for ${target} to ${amount}`)
                .addFields(
                    { name: 'Target', value: target, inline: true },
                    { name: 'Old Balance', value: response.data.OldBalance.toString(), inline: true },
                    { name: 'New Balance', value: response.data.NewBalance.toString(), inline: true }
                )
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } else {
            throw new Error(response.data.error || 'Failed to set Robux');
        }
    } catch (error) {
        console.error('SetRobux Error:', error.message);
        await interaction.editReply({ content: `Error setting Robux: ${error.message}` });
    }
}

async function handleLookup(interaction, options) {
    await interaction.deferReply({ flags: 64 });

    const targetRaw = options.getString('target');
    const target = targetRaw.replace(/[<@!>]/g, '');

    console.log(`\nLookup: Searching for user with input: ${target}`);

    let userData = null;
    let foundVia = '';

    try {
        const discordResponse = await apiClient.get(`/botapi/tickets/user/${target}`);
        if (discordResponse.status === 200) {
            userData = discordResponse.data;
            foundVia = 'Discord ID';
        }
    } catch (e) {}

    if (!userData) {
        try {
            const atheraResponse = await apiClient.get(`/botapi/tickets/athera/${encodeURIComponent(target)}`);
            if (atheraResponse.status === 200) {
                userData = atheraResponse.data;
                foundVia = 'Athera ID';
            }
        } catch (e) {}
    }

    if (!userData) {
        await interaction.editReply({
            content: `No user found for: \`${target}\``
        });
        return;
    }

    let robuxInfo = '';
    const userIdForRobux = userData.discordId || (foundVia === 'Discord ID' ? target : null);
    if (userIdForRobux) {
        try {
            const balanceResponse = await apiClient.get('/botapi/discord/get-robux', {
                params: { ID: userIdForRobux }
            });
            if (balanceResponse.data && balanceResponse.data.success) {
                robuxInfo = `\n**Robux:** ${balanceResponse.data.robux.toLocaleString()}`;
            }
        } catch (e) {}
    }

    const userId = userData.userId || userData.id || 'Unknown';
    const profileUrl = userId !== 'Unknown' ? `\n[Profile](${API_BASE_URL}/users/${userId}/profile)` : '';

    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('User Lookup')
        .setDescription(`Found user via **${foundVia}**${profileUrl}`)
        .addFields(
            { name: 'Username', value: userData.username || 'Unknown', inline: true },
            { name: 'User ID', value: userId.toString(), inline: true },
            { name: 'Discord', value: userData.discordId ? `<@${userData.discordId}> (\`${userData.discordId}\`)` : 'Not Linked', inline: true }
        )
        .setTimestamp();

    let meta = '';
    if (userData.created || userData.createdAt) meta += `**Created:** ${new Date(userData.created || userData.createdAt).toLocaleDateString()}\n`;
    if (userData.lastOnline) meta += `**Last Online:** ${new Date(userData.lastOnline).toLocaleDateString()}\n`;
    meta += robuxInfo;

    if (meta) {
        embed.addFields({ name: 'Details', value: meta, inline: false });
    }

    await interaction.editReply({ embeds: [embed] });
}

async function handleResetPassword(interaction, options, user) {
    await interaction.deferReply({ flags: 64 });

    const userIdRaw = options.getString('user_id');
    const userId = userIdRaw.replace(/[<@!>]/g, '');

    console.log(`\nReset Password: User ID ${userId} by ${user.tag}`);

    try {
        const response = await apiClient.get('/botapi/resetpassword', {
            params: { ID: userId }
        });

        if (response.status >= 400) {
            throw new Error(`API returned ${response.status}: ${JSON.stringify(response.data)}`);
        }

        const result = response.data;

        if (result.success) {
            try {
                const dmChannel = await user.createDM();
                await dmChannel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x00FF00)
                            .setTitle('Password Reset Successful')
                            .setDescription(`Password has been reset for user ID: ${userId}`)
                            .addFields(
                                { name: 'New Password', value: `\`${result.password}\``, inline: false },
                                { name: 'Important', value: 'Keep this password secure! Share it with the user carefully.', inline: false }
                            )
                            .setTimestamp()
                            .toJSON()
                    ]
                });

                await interaction.editReply({
                    content: 'Password reset successfully! Check your DMs for the new password.'
                });

            } catch (dmError) {
                console.error('DM error:', dmError);
                await interaction.editReply({
                    content: 'Password reset, but could not send DM. Enable DMs to receive password.'
                });
            }
        } else {
            await interaction.editReply({
                content: 'Password reset failed. Check user ID and try again.'
            });
        }

    } catch (error) {
        console.error('Reset password error:', error.message);
        await interaction.editReply({
            content: `Password reset failed: ${error.message.substring(0, 100)}`
        });
    }
}

async function handlePunish(interaction, options) {
    await interaction.deferReply({ flags: 64 });
    const type = options.getString('type');
    const userIdRaw = options.getString('user_id');
    const userId = userIdRaw.replace(/[<@!>]/g, '');

    try {
        const response = await apiClient.post('/botapi/discord/punish', {
            Type: type,
            ID: userId,
            AuthorId: interaction.user.id
        });

        if (response.data.success) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Punishment Applied')
                .setDescription(`Successfully applied **${type}** to user **${userId}**`)
                .addFields(
                    { name: 'Target', value: userId, inline: true },
                    { name: 'Type', value: type, inline: true },
                    { name: 'Result', value: response.data.message || 'Success', inline: false }
                )
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } else {
            throw new Error(response.data.error || 'Failed to apply punishment');
        }
    } catch (error) {
        console.error('Punish Error:', error.message);
        await interaction.editReply({ content: `Error applying punishment: ${error.message}` });
    }
}

async function handleTransferLimiteds(interaction, options) {
    await interaction.deferReply({ flags: 64 });
    const senderRaw = options.getString('sender');
    const targetRaw = options.getString('target');

    const sender = senderRaw.replace(/[<@!>]/g, '');
    const target = targetRaw.replace(/[<@!>]/g, '');

    console.log(`\nLimiteds Transfer: ${sender} -> ${target}`);

    try {
        const response = await apiClient.get('/botapi/discord/get-limiteds', {
            params: { ID: sender }
        });

        if (response.data.success) {
            const data = response.data;
            if (!data.limiteds || data.limiteds.length === 0) {
                return interaction.editReply(`lwk **${sender}** has no limiteds lmao`);
            }

            pendingTransfers.set(interaction.user.id, { sender, target });

            const select = new StringSelectMenuBuilder()
                .setCustomId('select_transfer_items')
                .setPlaceholder('Select items to transfer...')
                .setMinValues(1)
                .setMaxValues(Math.min(data.limiteds.length, 25));

            data.limiteds.slice(0, 25).forEach(item => {
                const label = `${item.name}${item.serial ? ` #${item.serial}` : ''}`;
                select.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(label.substring(0, 100))
                        .setDescription(`UAID: ${item.uaid}`)
                        .setValue(item.uaid.toString())
                );
            });

            const row = new ActionRowBuilder().addComponents(select);

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('Limiteds Transfer')
                .setDescription(`Found **${data.limiteds.length}** limiteds for **${sender}**.\nTotal RAP: **${data.totalRap.toLocaleString()}**\n\nSelect which ones to send to **${target}**:`)
                .setTimestamp();

            await interaction.editReply({
                embeds: [embed],
                components: [row]
            });
        } else {
            await interaction.editReply({ content: `Error: ${response.data.error || 'User not found'}` });
        }
    } catch (error) {
        console.error('Transfer Init Error:', error.message);
        await interaction.editReply({ content: `Failed to fetch limiteds: ${error.message}` });
    }
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== 'select_transfer_items') return;
    if (interaction.guild && interaction.guild.id !== ALLOWED_GUILD_ID) return;

    await interaction.deferReply({ flags: 64 });

    const state = pendingTransfers.get(interaction.user.id);
    if (!state) {
        return interaction.editReply('Session expired or not found. Try the command again.');
    }

    const uaids = interaction.values.map(v => parseInt(v));

    try {
        const response = await apiClient.post('/botapi/discord/transfer-limiteds', {
            sender: state.sender,
            target: state.target,
            userAssetIds: uaids
        });

        if (response.data.success) {
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('Transfer limiteds')
                .setDescription(`Successfully sent **${uaids.length}** item(s) from **${state.sender}** to **${state.target}**.`)
                .addFields(
                    { name: 'Items', value: `${uaids.length} items moved`, inline: true },
                    { name: 'Status', value: response.data.msg || 'Done', inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            pendingTransfers.delete(interaction.user.id);
        } else {
            await interaction.editReply({ content: `Transfer failed: ${response.data.error || 'Unknown error'}` });
        }
    } catch (error) {
        console.error('Transfer Execution Error:', error.message);
        await interaction.editReply({ content: `Critical failure during transfer: ${error.message}` });
    }
});

async function handleRemoveRobux(interaction, options) {
    await interaction.deferReply({ flags: 64 });
    const targetRaw = options.getString('target');
    const target = targetRaw.replace(/[<@!>]/g, '');
    const amount = options.getString('amount');

    try {
        const response = await apiClient.get('/botapi/discord/remove-robux', {
            params: { ID: target, amount: amount }
        });

        if (response.data.success) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Remove Robux')
                .setDescription(`Successfully removed **${amount}** Robux from **${target}**`)
                .addFields(
                    { name: 'Amount Removed', value: amount, inline: true },
                    { name: 'New Balance', value: response.data.NewBalance.toString(), inline: true }
                )
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } else {
            throw new Error(response.data.error || 'Failed to remove Robux');
        }
    } catch (error) {
        console.error('RemoveRobux Error:', error.message);
        await interaction.editReply({ content: `Error removing Robux: ${error.message}` });
    }
}

async function handleCheckItem(interaction, options) {
    await interaction.deferReply({ flags: 64 });
    const targetRaw = options.getString('target');
    const target = targetRaw.replace(/[<@!>]/g, '');
    const itemId = options.getString('item_id');

    try {
        const response = await apiClient.get('/botapi/discord/check-item', {
            params: { ID: target, assetId: itemId }
        });

        if (response.data.success) {
            const embed = new EmbedBuilder()
                .setColor(response.data.isOwned ? 0x00FF00 : 0xFF0000)
                .setTitle('Item Ownership Check')
                .setDescription(`User **${target}** ${response.data.isOwned ? 'owns' : 'doesnt own'} item **${itemId}**`)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } else {
            throw new Error(response.data.error || 'Failed to check item');
        }
    } catch (error) {
        console.error('CheckItem Error:', error.message);
        await interaction.editReply({ content: `Error checking item: ${error.message}` });
    }
}

async function handleRemoveItem(interaction, options) {
    await interaction.deferReply({ flags: 64 });
    const targetRaw = options.getString('target');
    const target = targetRaw.replace(/[<@!>]/g, '');
    const itemId = options.getString('item_id');
    const amount = options.getInteger('amount') || 1;

    try {
        const response = await apiClient.get('/botapi/discord/remove-item', {
            params: { ID: target, assetId: itemId }
        });

        if (response.data.success) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Item Removed')
                .setDescription(`Successfully removed **${amount}** item(s) of **${itemId}** from **${target}**`)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } else {
            throw new Error(response.data.error || 'Failed to remove item');
        }
    } catch (error) {
        console.error('RemoveItem Error:', error.message);
        await interaction.editReply({ content: `Error removing item: ${error.message}` });
    }
}

async function handleGiveItem(interaction, options) {
    await interaction.deferReply({ flags: 64 });
    const targetRaw = options.getString('target');
    const target = targetRaw.replace(/[<@!>]/g, '');
    const itemId = options.getString('item_id');

    try {
        const response = await apiClient.get('/botapi/discord/give-item', {
            params: { ID: target, assetId: itemId }
        });

        if (response.data.success) {
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('Item Granted')
                .setDescription(`Successfully gave item **${itemId}** to **${target}**`)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } else {
            throw new Error(response.data.error || 'Failed to give item');
        }
    } catch (error) {
        console.error('GiveItem Error:', error.message);
        await interaction.editReply({ content: `Error giving item: ${error.message}` });
    }
}

async function handleChangeUsername(interaction, options) {
    await interaction.deferReply({ flags: 64 });
    const targetRaw = options.getString('target');
    const target = targetRaw.replace(/[<@!>]/g, '');
    const newUsername = options.getString('new_username');

    console.log(`\nChange Username: Changing username for ${target} to ${newUsername} by ${interaction.user.tag}`);

    try {
        const response = await apiClient.post('/botapi/changeusername', {
            userId: target,
            newUsername: newUsername
        });

        if (response.data.success) {
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('Username Changed')
                .setDescription(`Successfully changed username from **${response.data.oldUsername}** to **${response.data.newUsername}**`)
                .addFields(
                    { name: 'Old Username', value: response.data.oldUsername, inline: true },
                    { name: 'New Username', value: response.data.newUsername, inline: true }
                )
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } else {
            throw new Error(response.data.message || 'Failed to change username');
        }
    } catch (error) {
        console.error('ChangeUsername Error:', error.message);
        await interaction.editReply({ content: `Error changing username: ${error.message}` });
    }
}

async function handleKick(interaction, options) {
    await interaction.deferReply({ flags: 64 });
    const targetRaw = options.getString('target');
    const target = targetRaw.replace(/[<@!>]/g, '');

    console.log(`\nKick: Kicking user ${target} by ${interaction.user.tag}`);

    try {
        const response = await apiClient.post('/botapi/kickuser', {
            userId: target
        });

        if (response.data.success) {
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('User Kicked')
                .setDescription(`Successfully kicked **${response.data.username}`)
                .addFields(
                    { name: 'Username', value: response.data.username, inline: true },
                    { name: 'Message', value: response.data.message, inline: true }
                )
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } else {
            throw new Error(response.data.message || 'Failed to kick user');
        }
    } catch (error) {
        console.error('Kick Error:', error.message);
        await interaction.editReply({ content: `Error kicking user: ${error.message}` });
    }
}

async function handleBoost(message) {
    const userId = message.author.id;
    const boosts = loadBoosts();

    boosts[userId] = (boosts[userId] || 0) + 1;
    saveBoosts(boosts);

    console.log(`User ${message.author.tag} now has ${boosts[userId]} boost(s).`);

    if (boosts[userId] >= 2) {
        console.log(`Rewarding ${message.author.tag} for 2 boosts!`);

        try {
            const robuxRes = await apiClient.get('/botapi/discord/add-robux', {
                params: { ID: userId, amount: '1000' }
            });

            const itemsGiven = [];
            const itemsOwned = [];
            const errors = [];

            for (const itemId of REWARD_ITEM_IDS) {
                try {
                    const checkRes = await apiClient.get('/botapi/discord/check-item', {
                        params: { ID: userId, assetId: itemId.toString() }
                    });

                    if (checkRes.data.success && !checkRes.data.isOwned) {
                        const giveRes = await apiClient.get('/botapi/discord/give-item', {
                            params: { ID: userId, assetId: itemId.toString() }
                        });
                        if (giveRes.data.success) {
                            itemsGiven.push(itemId);
                        } else {
                            errors.push(`Failed to give ${itemId}: ${giveRes.data.error}`);
                        }
                    } else if (checkRes.data.isOwned) {
                        itemsOwned.push(itemId);
                    }
                } catch (e) {
                    errors.push(`Error processing ${itemId}: ${e.message}`);
                }
            }

            boosts[userId] = 0;
            saveBoosts(boosts);

            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('reward for boostin the server :)')
                .setDescription(`Thank you for boosting the server twice, ${message.author}!`)
                .addFields(
                    { name: 'robucks', value: '1k robux', inline: true },
                    { name: 'items', value: itemsGiven.length > 0 ? itemsGiven.join(', ') : 'none (already owned)', inline: true }
                )
                .setTimestamp();

            if (itemsOwned.length > 0) {
                embed.setFooter({ text: `items already owned: ${itemsOwned.join(', ')}` });
            }

            if (errors.length > 0) {
                console.error('boost rewards had some errors:', errors);
            }

            await message.channel.send({ content: `${message.author}`, embeds: [embed] });

        } catch (error) {
            console.error('error rewarding boost:', error.message);
            await message.channel.send(`error rewarding ${message.author} for boost: ${error.message}`);
        }
    } else {
        await message.channel.send(`thank you for the boost, ${message.author}! youve boosted **${boosts[userId]}** time boost 1 more time and u get stuff in boost-perks :)`);
    }
}

client.on('error', console.error);
process.on('unhandledRejection', console.error);

console.log('Starting bot...');
client.login(BOT_TOKEN).catch(error => {
    console.error('Login failed:', error.message);
    process.exit(1);
});