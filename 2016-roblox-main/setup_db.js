const knex = require('knex')({
    client: 'postgresql',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'JpUhoOdFwH5Ph8QldjY9t',
        database: 'postgres'
    }
});

async function run() {
    try {
        const exists = await knex.schema.hasTable('ItemRequests');
        if (!exists) {
            await knex.schema.createTable('ItemRequests', (table) => {
                table.increments('id').primary();
                table.string('type').notNullable();
                table.string('name').notNullable();
                table.text('description');
                table.integer('robuxPrice').defaultTo(0);
                table.integer('tixPrice').defaultTo(0);
                table.boolean('isLimited').defaultTo(false);
                table.integer('stock').defaultTo(0);
                table.string('assetUrl'); 
                table.string('rbxmPath'); 
                table.string('objPath');
                table.integer('submitterId');
                table.integer('status').defaultTo(0);
                table.timestamp('created_at').defaultTo(knex.fn.now());
            });
            console.log('ItemRequests table created.');
        } else {
            console.log('ItemRequests table already exists.');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await knex.destroy();
    }
}

run();
