# Backend Proxy Controller Implementation

To fix the CORS issues with the Geoapify API, we need to implement a proxy controller in the backend. This controller will forward requests to the Geoapify API and return the responses to the frontend.

## Implementation Steps

1. Create a new controller in your backend API project:

```csharp
using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Threading.Tasks;

namespace CarPooling.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProxyController : ControllerBase
    {
        private readonly HttpClient _httpClient;

        public ProxyController(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        [HttpGet("geocode")]
        public async Task<IActionResult> Geocode([FromQuery] string address, [FromQuery] string apiKey)
        {
            var url = $"https://api.geoapify.com/v1/geocode/autocomplete?text={Uri.EscapeDataString(address)}&format=json&apiKey={apiKey}";
            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, "Failed to fetch geocoding data");
            }

            var content = await response.Content.ReadAsStringAsync();
            return Content(content, "application/json");
        }

        [HttpGet("route")]
        public async Task<IActionResult> Route(
            [FromQuery] double startLat, 
            [FromQuery] double startLng, 
            [FromQuery] double endLat, 
            [FromQuery] double endLng, 
            [FromQuery] string apiKey)
        {
            var url = $"https://api.geoapify.com/v1/routing?waypoints={startLat},{startLng}|{endLat},{endLng}&mode=drive&apiKey={apiKey}";
            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, "Failed to fetch routing data");
            }

            var content = await response.Content.ReadAsStringAsync();
            return Content(content, "application/json");
        }
    }
}
```

2. Register the HttpClient in your `Startup.cs` or `Program.cs`:

```csharp
// In ConfigureServices method
services.AddHttpClient();
```

3. Make sure your backend API has CORS configured to allow requests from your frontend:

```csharp
// In ConfigureServices method
services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", builder =>
    {
        builder.WithOrigins("http://localhost:4200") // Your Angular app URL
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

// In Configure method
app.UseCors("AllowAngularApp");
```

4. Test the proxy endpoints:
   - `GET /api/proxy/geocode?address=Alexandria&apiKey=your_api_key`
   - `GET /api/proxy/route?startLat=31.2&startLng=29.9&endLat=30.0&endLng=31.2&apiKey=your_api_key`

## Alternative Solution

If you don't want to modify the backend, you can also use Angular's built-in proxy configuration:

1. Create a file called `proxy.conf.json` in your Angular project root:

```json
{
  "/geoapify": {
    "target": "https://api.geoapify.com",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": {
      "^/geoapify": ""
    }
  }
}
```

2. Update your `angular.json` to use the proxy config:

```json
"serve": {
  "builder": "@angular-devkit/build-angular:dev-server",
  "options": {
    "browserTarget": "carpooling:build",
    "proxyConfig": "proxy.conf.json"
  },
  // ...
}
```

3. Then update the `RouteService` to use the proxy:

```typescript
geocoding(address: string): Observable<any> {
  const url = `/geoapify/v1/geocode/autocomplete?text=${encodeURIComponent(address)}&format=json&apiKey=${this.key}`;
  return this.http.get(url).pipe(
    catchError(this.handleError('Geocode address'))
  );
}
```

This approach only works during development with Angular's dev server. For production, you would still need the backend proxy. 