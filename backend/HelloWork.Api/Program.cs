using HelloWork.Api.Infrastructure;
using HelloWork.Api.Models;
using HelloWork.Api.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

var isDevBypass = builder.Configuration["AzureAd:TenantId"] == "dev-bypass";

if (isDevBypass)
{
    // ⚠️  DEV ONLY — bypasses Azure AD, auto-authenticates as seed user demo-user-1
    builder.Services.AddAuthentication(DevBypassAuthHandler.SchemeName)
        .AddScheme<AuthenticationSchemeOptions, DevBypassAuthHandler>(
            DevBypassAuthHandler.SchemeName, _ => { });
}
else
{
    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            var instance = builder.Configuration["AzureAd:Instance"]?.TrimEnd('/') ?? "https://login.microsoftonline.com";
            var tenantId = builder.Configuration["AzureAd:TenantId"] ?? "common";
            options.Authority = $"{instance}/{tenantId}/v2.0";
            options.Audience = builder.Configuration["AzureAd:Audience"];
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidAudience = builder.Configuration["AzureAd:Audience"]
            };
        });
}

builder.Services.AddAuthorization();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<MatchingService>();
builder.Services.AddScoped<AadGraphService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddApplicationInsightsTelemetry();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbCtx = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    if (app.Environment.IsDevelopment())
    {
        // In dev: ricrea il DB da zero ad ogni avvio per garantire schema pulito
        dbCtx.Database.EnsureDeleted();
    }
    dbCtx.Database.EnsureCreated();

    if (!dbCtx.Users.Any())
    {
        var seedUsers = new List<User>
        {
            new()
            {
                AadOid = "demo-user-1",
                DisplayName = "Giulia Rossi",
                Email = "giulia.rossi@example.com",
                OfficeLocation = "Milano",
                Role = "Cloud Solution Architect",
                Department = "Modern Work",
                Skills = ["Azure", "TypeScript", "Scrum"],
                Certifications = ["AZ-305"],
                AiTools = ["Copilot", "Claude", "Azure OpenAI"],
                Hobbies = ["Running", "Fotografia"],
                Interests = ["Jazz", "Viaggi"]
            },
            new()
            {
                AadOid = "demo-user-2",
                DisplayName = "Marco Bianchi",
                Email = "marco.bianchi@example.com",
                OfficeLocation = "Roma",
                Role = "Data & AI Engineer",
                Department = "AI Factory",
                Skills = ["Python", "Azure", "MLOps"],
                Certifications = ["DP-100"],
                AiTools = ["Copilot", "LangChain", "n8n"],
                Hobbies = ["Corsa", "Scacchi"],
                Interests = ["Jazz", "Libri"]
            },
            new()
            {
                AadOid = "demo-user-3",
                DisplayName = "Sara Conti",
                Email = "sara.conti@example.com",
                OfficeLocation = "Torino",
                Role = "Product Designer",
                Department = "Digital Experience",
                Skills = ["Figma", "Design System", "Facilitation"],
                Certifications = ["PSM I"],
                AiTools = ["Copilot", "Claude"],
                Hobbies = ["Yoga", "Fotografia"],
                Interests = ["Arte", "Viaggi"]
            }
        };

        dbCtx.Users.AddRange(seedUsers);
        await dbCtx.SaveChangesAsync();

        var groups = new List<Group>
        {
            new()
            {
                Name = "Azure Champions",
                Description = "Best practice, certificazioni e casi d'uso cloud.",
                TagsJson = System.Text.Json.JsonSerializer.Serialize(new[] { "Azure", "Cloud", "Architecture" }),
                CreatedBy = seedUsers[0].Id,
                IsSystemSuggested = true,
                MemberCount = 2
            },
            new()
            {
                Name = "AI Makers",
                Description = "Prompt, agenti e casi pratici di GenAI in delivery.",
                TagsJson = System.Text.Json.JsonSerializer.Serialize(new[] { "Copilot", "AI", "Automation" }),
                CreatedBy = seedUsers[1].Id,
                IsSystemSuggested = true,
                MemberCount = 2
            },
            new()
            {
                Name = "Photo Walk Club",
                Description = "Community interna per appassionati di fotografia.",
                TagsJson = System.Text.Json.JsonSerializer.Serialize(new[] { "Fotografia", "Creative", "Community" }),
                CreatedBy = seedUsers[2].Id,
                IsSystemSuggested = false,
                MemberCount = 1
            }
        };

        dbCtx.Groups.AddRange(groups);
        dbCtx.GroupMembers.AddRange(
            new GroupMember { GroupId = groups[0].Id, UserId = seedUsers[0].Id },
            new GroupMember { GroupId = groups[0].Id, UserId = seedUsers[1].Id },
            new GroupMember { GroupId = groups[1].Id, UserId = seedUsers[0].Id },
            new GroupMember { GroupId = groups[1].Id, UserId = seedUsers[1].Id },
            new GroupMember { GroupId = groups[2].Id, UserId = seedUsers[2].Id }
        );
        await dbCtx.SaveChangesAsync();
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }))
   .AllowAnonymous()
   .ExcludeFromDescription();

app.Run();
