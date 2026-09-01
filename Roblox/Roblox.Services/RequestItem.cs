using System.Data;
using Dapper;
using Roblox.Services.DbModels;

namespace Roblox.Services
{
    public class RequestItemService : ServiceBase
    {
        public class ItemRequestEntry
        {
            public long id { get; set; }
            public string type { get; set; }
            public string name { get; set; }
            public string description { get; set; }
            public int robux_price { get; set; }
            public int tix_price { get; set; }
            public bool is_limited { get; set; }
            public int stock { get; set; }
            public string? asset_url { get; set; }
            public string? rbxm_path { get; set; }
            public string? obj_path { get; set; }
            public int status { get; set; }
            public long submitter_id { get; set; }
            public DateTime created { get; set; }
            public DateTime updated { get; set; }
        }

        public async Task<long> InsertRequest(ItemRequestEntry request)
        {
            request.created = DateTime.UtcNow;
            request.updated = DateTime.UtcNow;
            var sql = @"
                INSERT INTO item_requests (
                    type, name, description, robux_price, tix_price, is_limited, stock, 
                    asset_url, rbxm_path, obj_path, status, submitter_id, created, updated
                ) VALUES (
                    @type, @name, @description, @robux_price, @tix_price, @is_limited, @stock,
                    @asset_url, @rbxm_path, @obj_path, @status, @submitter_id, @created, @updated
                ) RETURNING id;
            ";
            return await db.QuerySingleAsync<long>(sql, request);
        }

        public async Task<IEnumerable<ItemRequestEntry>> GetPendingRequests()
        {
            return await db.QueryAsync<ItemRequestEntry>("SELECT * FROM item_requests WHERE status = 0 ORDER BY created DESC");
        }

        public async Task<ItemRequestEntry?> GetRequestById(long id)
        {
            return await db.QuerySingleOrDefaultAsync<ItemRequestEntry>("SELECT * FROM item_requests WHERE id = :id", new { id });
        }

        public async Task UpdateRequestStatus(long id, int status)
        {
            await db.ExecuteAsync("UPDATE item_requests SET status = :status, updated = :updated WHERE id = :id", new
            {
                status = status,
                updated = DateTime.UtcNow,
                id = id
            });
        }
        
        public async Task Initialize()
        {
            var sql = @"
                CREATE TABLE IF NOT EXISTS item_requests (
                    id bigserial PRIMARY KEY,
                    type text NOT NULL,
                    name text NOT NULL,
                    description text,
                    robux_price integer DEFAULT 0,
                    tix_price integer DEFAULT 0,
                    is_limited boolean DEFAULT false,
                    stock integer DEFAULT 0,
                    asset_url text,
                    rbxm_path text,
                    obj_path text,
                    status integer DEFAULT 0,
                    submitter_id bigint DEFAULT 0,
                    created timestamp without time zone DEFAULT now(),
                    updated timestamp without time zone DEFAULT now()
                );
            ";
            await db.ExecuteAsync(sql);
        }
    }
}
