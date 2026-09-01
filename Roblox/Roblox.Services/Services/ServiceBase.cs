using System.Text.RegularExpressions;
using Dapper;
using Npgsql;
using Roblox.Cache;
using Roblox.Services.Exceptions;

namespace Roblox.Services
{
    public class ServiceBase : IDisposable
    {
        public NpgsqlConnection? transactionConnection { get; set; }
        public NpgsqlConnection db => transactionConnection ?? Database.connection;

        public DistributedCache redis => Roblox.Services.Cache.distributed;

        private static Regex keywordRegex = new Regex("[a-zA-Z0-9]+");
        protected string FilterKeyword(string dirtyKeyword)
        {
            var newKeyword = keywordRegex.Match(dirtyKeyword);
            return newKeyword.Value;
        }

        public async Task<T> InTransaction<T>(Func<NpgsqlTransaction,Task<T>> cb)
        {
            if (transactionConnection != null)
            {
                return await cb(null!);
            }

            Database.AcquireConnectionMutex("InTransaction<T>");
            NpgsqlConnection con;
            NpgsqlTransaction trx;
            try
            {
                con = Database.unsafeConnection;
                transactionConnection = con;
                con.Open();
                trx = con.BeginTransaction();
            }
            finally
            {
                Database.ReleaseConnectionMutex();
            }
            
            try
            {
                var result = await cb(trx);
                await trx.CommitAsync();
                return result;
            }
            catch (System.Exception e)
            {
                Console.WriteLine("[info] Transaction Failure. MSG={0} STACK={1}", e.Message, e.StackTrace);
                await trx.RollbackAsync();
                throw;
            }
            finally
            {
                transactionConnection = null;
                await con.CloseAsync();
            }
        }

        public async Task<T> InLock<T>(string lockName, TimeSpan expiration, Func<Task<T>> cb)
        {
            await using (var redLock = await Cache.redLock.CreateLockAsync(lockName, expiration))
            {
                if (redLock.IsAcquired)
                {
                    var result = await cb();
                    return result;
                }
            }

            throw new LockNotAcquiredException();
        }

        public async Task<long> InsertAsync<T>(string tableName, T obj)
        {
            var tableData = Database.tableToColumnMap[tableName];
            var idColumn = "id";
            if (!tableData.Contains(idColumn))
            {
                idColumn = tableData.First();
            }
            return await InsertAsync(tableName, idColumn, obj);
        }
        
        public async Task<long> InsertAsync<T>(string tableName, string keyName, T obj)
        {
            var tableData = Database.tableToColumnMap[tableName];
            if (tableData == null || !Database.tableNames.Contains(tableName)) throw new Exception("Invalid table name: " + tableName);
            if (!tableData.Contains(keyName))
                throw new Exception("Column " + keyName + " does not exist in table " + tableName);
            
            var columnList = new List<string>();
            var props = typeof(T).GetProperties();
            if (obj is Dictionary<string, dynamic?> dict)
            {
                foreach (var kvp in dict)
                {
                    if (!tableData.Contains(kvp.Key))
                        throw new Exception("Column \"" + kvp.Key + "\" of table " + tableName + " does not exist");

                    columnList.Add(kvp.Key);
                }
            }
            else
            {
                foreach (var item in props)
                {
                    if (!tableData.Contains(item.Name))
                        throw new Exception("Column \"" + item.Name + "\" of table " + tableName + " does not exist");

                    columnList.Add(item.Name);
                }
            }

            tableName = "\"" + tableName + "\"";
            var query = $"INSERT INTO {tableName} ({string.Join(",", columnList)}) VALUES ({string.Join(",", columnList.Select(c => ":" + c))}) RETURNING " + keyName;
            var result = await db.ExecuteReaderAsync(query, obj);
            await result.ReadAsync();
            long id;
            try
            {
                id = result.GetInt64(0);
                if (id == 0)
                    throw new Exception("No ID in returned sql");
            }
            catch (InvalidCastException)
            {
                id = 0;
            }
            
            await result.CloseAsync();
            return id;
        }

        public async Task UpdateAsync<TKey, TUpdateObject>(string tableName, TKey foreignKey, TUpdateObject obj)
        {
            await UpdateAsync(tableName, "id", foreignKey, obj);
        }
        
        public async Task UpdateAsync<TKey,TUpdateObject>(string tableName, string foreignKeyName, TKey foreignKey, TUpdateObject obj)
        {
            var tableData = Database.tableToColumnMap[tableName];
            if (tableData == null || !Database.tableNames.Contains(tableName)) throw new Exception("Invalid table name: " + tableName);
            if (!tableData.Contains(foreignKeyName))
            {
                throw new Exception("Foreign key " + foreignKeyName + " does not exist in table " + tableName);
            }
            
            var columnList = new List<string>();
            var queryParameters = new DynamicParameters();

            if (obj is DynamicParameters par)
            {
                queryParameters.AddDynamicParams(par);
                foreach (var col in par.ParameterNames)
                {
                    if (!tableData.Contains(col))
                        throw new Exception("Column \"" + col + "\" of table " + tableName + " does not exist");
                        
                    columnList.Add(col);
                }
            }
            else
            {
                var props = typeof(TUpdateObject).GetProperties();
                foreach (var item in props)
                {
                    if (!tableData.Contains(item.Name))
                        throw new Exception("Column \"" + item.Name + "\" of table " + tableName + " does not exist");

                    columnList.Add(item.Name);
                    queryParameters.Add(item.Name, item.GetValue(obj));
                }
            }

            var updateColumns = new List<string>();
            foreach (var item in columnList)
            {
                updateColumns.Add($"\"{item}\" = :{item}");
            }
            
            queryParameters.Add("foreignKeyVal", foreignKey);
            var escapedTableName = "\"" + tableName + "\"";
            var escapedForeignKeyName = "\"" + foreignKeyName + "\"";

            var query = $"UPDATE {escapedTableName} SET {string.Join(",", updateColumns)} WHERE {escapedForeignKeyName} = :foreignKeyVal";
            await db.ExecuteAsync(query, queryParameters);
        }

        public async Task<IEnumerable<TReturnType>> MultiGetAsync<TReturnType, TSearchType>(string tableName, string columnToSearchOn, IEnumerable<string> columns, IEnumerable<TSearchType> items, string sqlOperator = "=")
        {
            sqlOperator = sqlOperator.ToLower();
            var tableData = Database.tableToColumnMap[tableName];
            if (tableData == null || !Database.tableNames.Contains(tableName)) throw new Exception("Invalid table name: " + tableName);
            if (!tableData.Contains(columnToSearchOn))
            {
                throw new Exception("Column " + columnToSearchOn + " does not exist in table " + tableName);
            }

            var columnsList = columns.ToList();
            var itemsList = items.ToList();
            foreach (var item in columnsList)
            {
                if (!tableData.Contains(item))
                {
                    throw new Exception("Column " + item + " does not exist in table " + tableName);
                }
            }

            if (sqlOperator != "=" && sqlOperator != "ilike" && sqlOperator != "like")
            {
                throw new Exception("Unsupported sql operator: " + sqlOperator);
            }

            var whereClauses = new List<string>();
            var obj = new DynamicParameters();
            for (var i = 0; i < itemsList.Count; i++)
            {
                var paramName = "param" + i;
                whereClauses.Add($"\"{columnToSearchOn}\" {sqlOperator} :{paramName}");
                obj.Add(paramName, itemsList[i]);
            }
            var query = $"SELECT {string.Join(",", columnsList)} FROM \"{tableName}\" WHERE {string.Join(" OR ", whereClauses)}";
            return await db.QueryAsync<TReturnType>(query, obj);
        }

        public void Dispose()
        {
        }
    }
}