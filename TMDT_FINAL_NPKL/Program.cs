using Microsoft.AspNetCore.Components;
using Microsoft.EntityFrameworkCore;
using TMDT_FINAL_NPKL.Entities;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          policy.WithOrigins("http://127.0.0.1:5500", "http://localhost:5500") // Chỉ định Port của Frontend
                                .AllowAnyHeader()                     // Cho phép mọi header (Content-Type, Authorization...)
                                .AllowAnyMethod()                     // Cho phép mọi HTTP method (GET, POST, PUT, DELETE, OPTIONS)
                                .AllowCredentials();                  // Bắt buộc nếu có dùng Cookie hoặc Token Authentication
                      });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddControllers();
object value = builder.Services.AddSwaggerGen();



// Add services to the container.
builder.Services.AddControllersWithViews();
builder.Services.AddMemoryCache();
builder.Services.AddDbContext<WebTmdtContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("WEB_TMDT")));


// 1. Đọc cấu hình từ appsettings.json
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["Key"];

// 2. Cấu hình Authentication & JWT
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],      // Lấy Issuer từ appsettings
        ValidAudience = jwtSettings["Audience"],  // Lấy Audience từ appsettings
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)) // Lấy Key từ appsettings
    };
});

builder.Services.AddAuthorization();
var app = builder.Build();

if (app.Environment.IsDevelopment())

{

    app.UseSwagger();

    app.UseSwaggerUI();

}

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseCors(MyAllowSpecificOrigins);
app.UseAuthentication();
app.UseAuthorization();

app.UseStaticFiles();
app.MapStaticAssets();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();


app.Run();
