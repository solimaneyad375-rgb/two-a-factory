using Microsoft.Data.SqlClient;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is missing.");
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins("http://localhost", "http://127.0.0.1", "http://localhost:5500", "http://127.0.0.1:5500")
          .AllowAnyHeader().AllowAnyMethod()));
var app = builder.Build();
app.UseCors();

const string ensureSql = "IF OBJECT_ID(N'dbo.ResourceDocuments', N'U') IS NULL BEGIN CREATE TABLE dbo.ResourceDocuments (ResourceName nvarchar(50) NOT NULL CONSTRAINT PK_ResourceDocuments PRIMARY KEY, JsonData nvarchar(max) NOT NULL, CreatedAt datetime2(0) NOT NULL CONSTRAINT DF_ResourceDocuments_CreatedAt DEFAULT SYSUTCDATETIME(), UpdatedAt datetime2(0) NOT NULL CONSTRAINT DF_ResourceDocuments_UpdatedAt DEFAULT SYSUTCDATETIME(), CONSTRAINT CK_ResourceDocuments_JsonData CHECK (ISJSON(JsonData)=1)); END;";
string[] allowed = ["settings", "auth", "users", "items", "customers", "suppliers", "ovens", "cutters", "invoices"];
async Task EnsureTable(CancellationToken ct) {
    await using var con = new SqlConnection(connectionString);
    await con.OpenAsync(ct);
    await using var cmd = new SqlCommand(ensureSql, con);
    await cmd.ExecuteNonQueryAsync(ct);
}
app.MapGet("/api/health", async (CancellationToken ct) => {
    try {
        await EnsureTable(ct);
        await using var con = new SqlConnection(connectionString);
        await con.OpenAsync(ct);
        await using var cmd = new SqlCommand("SELECT DB_NAME()", con);
        var db = (string?)await cmd.ExecuteScalarAsync(ct);
        return Results.Ok(new { status = "ok", database = db, timeUtc = DateTime.UtcNow });
    } catch (Exception ex) {
        app.Logger.LogError(ex, "Database health check failed");
        return Results.Problem("تعذر الاتصال بقاعدة البيانات. راجع اسم SQL Server وصلاحيات Windows Authentication.", statusCode: 503);
    }
});
app.MapGet("/api/data/{resource}", async (string resource, CancellationToken ct) => {
    resource = resource.ToLowerInvariant();
    if (!allowed.Contains(resource)) return Results.NotFound();
    try {
        await EnsureTable(ct);
        await using var con = new SqlConnection(connectionString);
        await con.OpenAsync(ct);
        await using var cmd = new SqlCommand("SELECT JsonData FROM dbo.ResourceDocuments WHERE ResourceName=@name", con);
        cmd.Parameters.AddWithValue("@name", resource);
        var value = await cmd.ExecuteScalarAsync(ct);
        if (value is null || value is DBNull) return Results.NotFound();
        return Results.Content((string)value, "application/json; charset=utf-8");
    } catch (Exception ex) {
        app.Logger.LogError(ex, "Read failed for resource {Resource}", resource);
        return Results.Problem("فشل قراءة البيانات من SQL Server.", statusCode: 503);
    }
});
app.MapPut("/api/data/{resource}", async (string resource, JsonElement payload, CancellationToken ct) => {
    resource = resource.ToLowerInvariant();
    if (!allowed.Contains(resource)) return Results.BadRequest(new { message = "Unknown resource." });
    if (payload.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null) return Results.BadRequest(new { message = "JSON payload is required." });
    var json = payload.GetRawText();
    try {
        await EnsureTable(ct);
        await using var con = new SqlConnection(connectionString);
        await con.OpenAsync(ct);
        const string sql = @"UPDATE dbo.ResourceDocuments SET JsonData=@json, UpdatedAt=SYSUTCDATETIME() WHERE ResourceName=@name; IF @@ROWCOUNT=0 INSERT INTO dbo.ResourceDocuments(ResourceName, JsonData) VALUES(@name, @json);";
        await using var cmd = new SqlCommand(sql, con);
        cmd.Parameters.Add("@name", System.Data.SqlDbType.NVarChar, 50).Value = resource;
        cmd.Parameters.Add("@json", System.Data.SqlDbType.NVarChar, -1).Value = json;
        await cmd.ExecuteNonQueryAsync(ct);
        return Results.Ok(new { saved = true, resource, updatedAtUtc = DateTime.UtcNow });
    } catch (Exception ex) {
        app.Logger.LogError(ex, "Write failed for resource {Resource}", resource);
        return Results.Problem("فشل حفظ البيانات في SQL Server.", statusCode: 503);
    }
});
app.MapGet("/", () => Results.Ok(new { name = "FactoryTowA API", docs = "/api/health", database = "FactoryTowA_DB" }));
app.Run();
