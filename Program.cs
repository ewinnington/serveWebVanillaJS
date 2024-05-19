using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();


app.UseDefaultFiles();

// Serve static files from the root of the website
app.UseStaticFiles();

// Data API endpoint with pagination
app.MapGet("/data", (HttpRequest request) =>
{
    int page = int.TryParse(request.Query["page"], out var p) ? p : 1;
    int pageSize = 10; // Set your page size
    int totalItems = 100; // Total number of items
    int totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

    var data = Enumerable.Range(1, totalItems) // Sample data
        .Select(i => new { Name = $"Item {i}", Url = $"https://example.com/{i}", Page = (i - 1) / pageSize + 1 })
        .Where(item => item.Page == page)
        .ToList();

    var response = new
    {
        TotalItems = totalItems,
        TotalPages = totalPages,
        CurrentPage = page,
        PageSize = pageSize,
        Data = data
    };

    return Results.Json(response);
});

app.Run();