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
            // demo-user-1: utente esistente con profilo completo (scenario "existing")
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
            },
            new()
            {
                AadOid = "demo-user-4",
                DisplayName = "Andrea Ferretti",
                Email = "andrea.ferretti@example.com",
                OfficeLocation = "Milano",
                Role = "DevOps Engineer",
                Department = "Platform Engineering",
                Skills = ["Azure", "Kubernetes", "Terraform"],
                AiTools = ["Copilot", "Azure OpenAI"],
                Interests = ["Montagna", "Jazz"]
            },
            new()
            {
                AadOid = "demo-user-5",
                DisplayName = "Elena Martini",
                Email = "elena.martini@example.com",
                OfficeLocation = "Milano",
                Role = "Business Development Manager",
                Department = "Sales",
                Skills = ["TypeScript", "Comunicazione", "CRM"],
                AiTools = ["Copilot"],
                Interests = ["Viaggi", "Running"]
            },
            // --- Utenti Agic (seed hackathon) ---
            new() { AadOid = "agic-marco-rossi", DisplayName = "Marco Rossi", Email = "marco.rossi@agic.it", OfficeLocation = "Torino", Role = "AI Engineer", Department = "AI Factory", Skills = ["Azure", "Python", "Azure OpenAI", "Azure AI Search", "SQL", "Semantic Kernel"], Certifications = ["AI-102", "DP-100"], AiTools = ["Copilot", "Claude", "LangChain"], AiDescription = "Costruisco agenti RAG su Azure OpenAI e oriento i prototipi con Claude.", Hobbies = ["Running", "Trekking", "Padel"], Interests = ["Viaggi", "Startup"] },
            new() { AadOid = "agic-giulia-ferrari", DisplayName = "Giulia Ferrari", Email = "giulia.ferrari@agic.it", OfficeLocation = "Milano", Role = "Data Scientist", Department = "AI Factory", Skills = ["Azure", "Python", "Azure OpenAI", "Azure AI Search", "SQL", "Databricks", "Pandas"], Certifications = ["DP-100", "DP-203"], AiTools = ["Copilot", "Claude", "LangChain", "ChatGPT"], AiDescription = "Sperimento pipeline RAG e valutazione modelli; uso molto Claude per il prompt design.", Hobbies = ["Running"], Interests = ["Viaggi", "Libri"] },
            new() { AadOid = "agic-luca-bianchi", DisplayName = "Luca Bianchi", Email = "luca.bianchi@agic.it", OfficeLocation = "Roma", Role = "Machine Learning Engineer", Department = "AI Factory", Skills = ["Azure", "Python", "Azure OpenAI", "Azure AI Search", "SQL", "PyTorch"], Certifications = ["AI-102"], AiTools = ["Copilot", "Claude", "LangChain"], AiDescription = "Porto in produzione modelli ML e LLM orchestrati con LangChain su Azure.", Hobbies = ["Running", "Ciclismo"], Interests = ["Viaggi"] },
            new() { AadOid = "agic-sara-conti", DisplayName = "Sara Conti", Email = "sara.conti@agic.it", OfficeLocation = "Torino", Role = "AI Engineer", Department = "Data, BI & Analytics", Skills = ["Azure", "Python", "Azure OpenAI", "Azure AI Search", "SQL"], Certifications = ["AI-102", "DP-203"], AiTools = ["Copilot", "Claude", "LangChain", "Cursor"], AiDescription = "Realizzo copiloti interni; prototipo le UI con Cursor e i flussi con LangChain.", Hobbies = ["Running", "Yoga"], Interests = ["Viaggi", "Arte"] },
            new() { AadOid = "agic-davide-greco", DisplayName = "Davide Greco", Email = "davide.greco@agic.it", OfficeLocation = "Milano", Role = "Frontend Developer", Department = "Digital Experience", Skills = ["TypeScript", "React", "Next.js", "Tailwind CSS", "Node.js", "JavaScript"], AiTools = ["Cursor", "GitHub Copilot", "ChatGPT"], AiDescription = "Sviluppo SPA in React/Next.js e accelero il lavoro con Cursor.", Hobbies = ["Fotografia", "Calcio"], Interests = ["Design", "Cinema"] },
            new() { AadOid = "agic-martina-romano", DisplayName = "Martina Romano", Email = "martina.romano@agic.it", OfficeLocation = "Torino", Role = "UX/UI Designer", Department = "Digital Experience", Skills = ["Figma", "React", "TypeScript", "Tailwind CSS", "Design System"], AiTools = ["Cursor", "Midjourney", "ChatGPT"], AiDescription = "Disegno design system e prototipo concept visivi con Midjourney.", Hobbies = ["Fotografia", "Padel"], Interests = ["Design", "Arte"] },
            new() { AadOid = "agic-alessandro-costa", DisplayName = "Alessandro Costa", Email = "alessandro.costa@agic.it", OfficeLocation = "Roma", Role = "Full-Stack Developer", Department = "Digital Experience", Skills = ["TypeScript", "React", "Next.js", "Tailwind CSS", "Node.js", "C#", ".NET"], Certifications = ["AZ-204"], AiTools = ["GitHub Copilot", "Cursor", "Claude"], AiDescription = "Full-stack su React e .NET; uso GitHub Copilot e Cursor ogni giorno.", Hobbies = ["Fotografia", "Videogiochi"], Interests = ["Design"] },
            new() { AadOid = "agic-chiara-marino", DisplayName = "Chiara Marino", Email = "chiara.marino@agic.it", OfficeLocation = "Milano", Role = "Frontend Developer", Department = "Modern Work", Skills = ["TypeScript", "React", "Next.js", "Tailwind CSS", "Node.js"], AiTools = ["Cursor", "GitHub Copilot"], AiDescription = "Mi occupo di front-end accessibile e componenti riutilizzabili.", Hobbies = ["Fotografia", "Yoga"], Interests = ["Design", "Viaggi"] },
            new() { AadOid = "agic-federico-esposito", DisplayName = "Federico Esposito", Email = "federico.esposito@agic.it", OfficeLocation = "Roma", Role = "Power Platform Consultant", Department = "Low-Code & Collaboration", Skills = ["Power Platform", "Power Automate", "Power Apps", "Dataverse", "Dynamics 365"], Certifications = ["PL-400", "PL-600"], AiTools = ["Copilot", "n8n"], AiDescription = "Automatizzo processi con Power Automate e n8n; sperimento Copilot Studio.", Hobbies = ["Scacchi", "Board Games"], Interests = ["Storia"] },
            new() { AadOid = "agic-valentina-gallo", DisplayName = "Valentina Gallo", Email = "valentina.gallo@agic.it", OfficeLocation = "Milano", Role = "Dynamics 365 Consultant", Department = "Business Applications", Skills = ["Power Platform", "Power Automate", "Dataverse", "Dynamics 365", "Power Apps"], Certifications = ["MB-210", "PL-600"], AiTools = ["Copilot", "n8n"], AiDescription = "Configuro Dynamics 365 Sales e orchestro integrazioni low-code.", Hobbies = ["Scacchi", "Padel"], Interests = ["Storia", "Viaggi"] },
            new() { AadOid = "agic-matteo-fontana", DisplayName = "Matteo Fontana", Email = "matteo.fontana@agic.it", OfficeLocation = "Torino", Role = "Power Platform Consultant", Department = "Low-Code & Collaboration", Skills = ["Power Platform", "Power Automate", "Power Apps", "Dataverse", "SharePoint"], Certifications = ["PL-400", "MS-700"], AiTools = ["Copilot", "n8n"], AiDescription = "Realizzo app aziendali in Power Apps e automazioni con n8n.", Hobbies = ["Board Games"], Interests = ["Storia", "Startup"] },
            new() { AadOid = "agic-francesca-rizzo", DisplayName = "Francesca Rizzo", Email = "francesca.rizzo@agic.it", OfficeLocation = "Roma", Role = "Business Analyst", Department = "Business Applications", Skills = ["Power Platform", "Power Automate", "SQL", "Power BI", "Requirements"], Certifications = ["PL-900", "PL-300"], AiTools = ["Copilot", "n8n", "ChatGPT"], AiDescription = "Traduco esigenze di business in soluzioni Power Platform.", Hobbies = ["Scacchi", "Cucina"], Interests = ["Storia", "Libri"] },
            new() { AadOid = "agic-andrea-moretti", DisplayName = "Andrea Moretti", Email = "andrea.moretti@agic.it", OfficeLocation = "Milano", Role = "Cloud Architect", Department = "Cloud Infrastructure", Skills = ["Azure", "Terraform", "Bicep", "Kubernetes", "Docker", "Azure DevOps"], Certifications = ["AZ-305", "AZ-104"], AiTools = ["GitHub Copilot", "Copilot"], AiDescription = "Disegno landing zone Azure e automatizzo l'infra con Terraform.", Hobbies = ["Ciclismo", "Padel"], Interests = ["Sostenibilità"] },
            new() { AadOid = "agic-elena-barbieri", DisplayName = "Elena Barbieri", Email = "elena.barbieri@agic.it", OfficeLocation = "Torino", Role = "DevOps Engineer", Department = "Cloud Infrastructure", Skills = ["Azure", "Terraform", "Bicep", "Kubernetes", "Docker", "Azure DevOps", "Linux"], Certifications = ["AZ-104", "CKA"], AiTools = ["GitHub Copilot", "Copilot"], AiDescription = "Costruisco pipeline CI/CD e gestisco cluster Kubernetes.", Hobbies = ["Ciclismo"], Interests = ["Sostenibilità", "Astronomia"] },
            new() { AadOid = "agic-simone-lombardi", DisplayName = "Simone Lombardi", Email = "simone.lombardi@agic.it", OfficeLocation = "Roma", Role = "Cloud Engineer", Department = "Cloud Infrastructure", Skills = ["Azure", "Terraform", "Bicep", "Docker", "Azure DevOps"], Certifications = ["AZ-104", "AZ-305"], AiTools = ["GitHub Copilot", "Copilot"], AiDescription = "Provisioning e hardening di ambienti Azure con IaC.", Hobbies = ["Ciclismo", "Running"], Interests = ["Sostenibilità"] },
            new() { AadOid = "agic-paolo-de-luca", DisplayName = "Paolo De Luca", Email = "paolo.luca@agic.it", OfficeLocation = "Milano", Role = "Solution Architect", Department = "Cloud Infrastructure", Skills = ["Azure", "Terraform", "Kubernetes", "Docker", "Azure DevOps", ".NET"], Certifications = ["AZ-305", "TOGAF"], AiTools = ["GitHub Copilot", "Copilot", "Claude"], AiDescription = "Architetto soluzioni cloud-native e guido le scelte tecniche.", Hobbies = ["Trekking", "Padel"], Interests = ["Sostenibilità", "Startup"] },
            new() { AadOid = "agic-antonio-greco", DisplayName = "Antonio Greco", Email = "antonio.greco@agic.it", OfficeLocation = "Milano", Role = "Data Engineer", Department = "Data, BI & Analytics", Skills = ["Python", "Azure", "Azure Data Factory", "SQL", "Pandas", "T-SQL"], AiTools = ["Copilot", "GitHub Copilot", "ChatGPT"], AiDescription = "Costruisco pipeline dati e lakehouse su Azure.", Hobbies = ["Running"], Interests = ["Astronomia"] },
            new() { AadOid = "agic-elisa-ferraro", DisplayName = "Elisa Ferraro", Email = "elisa.ferraro@agic.it", OfficeLocation = "Roma", Role = "BI Consultant", Department = "Data, BI & Analytics", Skills = ["Azure", "Power Query", "Power BI", "T-SQL"], AiTools = ["Copilot", "ChatGPT"], AiDescription = "Progetto modelli semantici e dashboard in Power BI.", Hobbies = ["Trekking", "Running", "Cucina"], Interests = ["Startup", "Cinema"] },
            new() { AadOid = "agic-riccardo-villa", DisplayName = "Riccardo Villa", Email = "riccardo.villa@agic.it", OfficeLocation = "Torino", Role = "Backend Developer", Department = "Digital Experience", Skills = [".NET", "Azure Functions", "C#", "REST API"], Certifications = ["AZ-204"], AiTools = ["Copilot", "Cursor"], AiDescription = "Sviluppo API .NET e microservizi su Azure.", Hobbies = ["Board Games"], Interests = ["Design"] },
            new() { AadOid = "agic-beatrice-sala", DisplayName = "Beatrice Sala", Email = "beatrice.sala@agic.it", OfficeLocation = "Milano", Role = "Cybersecurity Specialist", Department = "Cybersecurity", Skills = ["Entra ID", "KQL", "Microsoft Graph", "Azure"], AiTools = ["Copilot"], AiDescription = "Monitoro le minacce con Sentinel e scrivo query KQL.", Hobbies = ["Calcio", "Arrampicata", "Fotografia"], Interests = ["Libri"] },
            new() { AadOid = "agic-stefano-ricci", DisplayName = "Stefano Ricci", Email = "stefano.ricci@agic.it", OfficeLocation = "Roma", Role = "Project Manager", Department = "Practice PM", Skills = ["Azure DevOps", "Stakeholder Management", "Risk Management", "Kanban", "Scrum"], Certifications = ["PMP"], AiTools = ["Perplexity"], AiDescription = "Coordino team Agile e gestisco il delivery dei progetti.", Hobbies = ["Fotografia", "Cucina"], Interests = ["Vino"] },
            new() { AadOid = "agic-laura-de-santis", DisplayName = "Laura De Santis", Email = "laura.santis@agic.it", OfficeLocation = "Torino", Role = "Scrum Master", Department = "Practice PM", Skills = ["Facilitation", "Azure DevOps", "Jira", "Scrum", "Kanban"], AiTools = ["Copilot"], AiDescription = "Facilito le cerimonie Agile e rimuovo gli impedimenti.", Hobbies = ["Tennis", "Trekking"], Interests = ["Astronomia"] },
            new() { AadOid = "agic-giorgio-bruno", DisplayName = "Giorgio Bruno", Email = "giorgio.bruno@agic.it", OfficeLocation = "Milano", Role = "SharePoint Consultant", Department = "Modern Work", Skills = ["Microsoft Graph", "Power Platform", "SPFx", "Power Automate", "SharePoint"], Certifications = ["PL-400", "MS-700"], AiTools = ["Copilot", "n8n"], AiDescription = "Realizzo intranet moderne su SharePoint e Viva.", Hobbies = ["Pianoforte", "Trekking", "Basket"], Interests = ["Crypto", "Libri"] },
            new() { AadOid = "agic-silvia-caruso", DisplayName = "Silvia Caruso", Email = "silvia.caruso@agic.it", OfficeLocation = "Roma", Role = "Cloud Engineer", Department = "Cloud Infrastructure", Skills = ["Kubernetes", "Docker", "Azure", "Linux"], AiTools = ["GitHub Copilot"], AiDescription = "Automatizzo infrastruttura e deploy su Azure.", Hobbies = ["Basket", "Fotografia", "Tennis"], Interests = ["Podcast", "Musica elettronica"] },
            new() { AadOid = "agic-nicola-ferrara", DisplayName = "Nicola Ferrara", Email = "nicola.ferrara@agic.it", OfficeLocation = "Torino", Role = "Data Scientist", Department = "AI Factory", Skills = ["Pandas", "Python", "Azure AI Search", "scikit-learn", "PyTorch"], Certifications = ["DP-100"], AiTools = ["ChatGPT", "Claude", "Copilot"], AiDescription = "Addestro modelli e prototipo soluzioni di GenAI.", Hobbies = ["Trekking"], Interests = ["Libri"] },
            new() { AadOid = "agic-federica-rinaldi", DisplayName = "Federica Rinaldi", Email = "federica.rinaldi@agic.it", OfficeLocation = "Milano", Role = "Business Analyst", Department = "Advisory & Compliance", Skills = ["SQL", "Scrum", "Power BI", "Requirements", "Process Mapping", "Power Platform"], Certifications = ["PL-900", "PSM I"], AiTools = ["Copilot", "ChatGPT"], AiDescription = "Analizzo i processi e definisco i requisiti con gli stakeholder.", Hobbies = ["Arrampicata", "Calcio"], Interests = ["Storia"] },
            new() { AadOid = "agic-tommaso-galli", DisplayName = "Tommaso Galli", Email = "tommaso.galli@agic.it", OfficeLocation = "Roma", Role = "UX/UI Designer", Department = "Digital Experience", Skills = ["Figma", "Design System", "Prototyping", "UX Research", "Tailwind CSS"], AiTools = ["Midjourney", "ChatGPT", "Cursor"], AiDescription = "Disegno esperienze utente e prototipi ad alta fedeltà.", Hobbies = ["Cucina", "Trekking", "Basket"], Interests = ["Astronomia"] },
            new() { AadOid = "agic-ilaria-martini", DisplayName = "Ilaria Martini", Email = "ilaria.martini@agic.it", OfficeLocation = "Torino", Role = "Dynamics 365 Consultant", Department = "Business Applications", Skills = ["Dataverse", "Power Automate", "X++", "Power Platform", "Dynamics 365"], Certifications = ["PL-600", "MB-330"], AiTools = ["Copilot"], AiDescription = "Implemento Dynamics 365 Finance & Operations.", Hobbies = ["Nuoto"], Interests = ["Storia"] },
            new() { AadOid = "agic-emanuele-leone", DisplayName = "Emanuele Leone", Email = "emanuele.leone@agic.it", OfficeLocation = "Milano", Role = "Data Engineer", Department = "Data, BI & Analytics", Skills = ["Databricks", "Azure", "T-SQL", "Azure Data Factory", "Python", "Spark"], AiTools = ["Copilot", "GitHub Copilot"], AiDescription = "Costruisco pipeline dati e lakehouse su Azure.", Hobbies = ["Videogiochi", "Ciclismo"], Interests = ["Fantascienza"] },
            new() { AadOid = "agic-roberta-longo", DisplayName = "Roberta Longo", Email = "roberta.longo@agic.it", OfficeLocation = "Roma", Role = "BI Consultant", Department = "Data, BI & Analytics", Skills = ["DAX", "Power Query", "SQL", "Power BI"], AiTools = ["ChatGPT", "Copilot"], AiDescription = "Progetto modelli semantici e dashboard in Power BI.", Hobbies = ["Board Games", "Padel"], Interests = ["Viaggi"] },
            new() { AadOid = "agic-pietro-serra", DisplayName = "Pietro Serra", Email = "pietro.serra@agic.it", OfficeLocation = "Torino", Role = "Backend Developer", Department = "Digital Experience", Skills = ["Entity Framework", "Azure Functions", "C#", ".NET", "REST API"], AiTools = ["Copilot", "GitHub Copilot", "Cursor"], AiDescription = "Sviluppo API .NET e microservizi su Azure.", Hobbies = ["Trekking"], Interests = ["Storia", "Sostenibilità"] },
            new() { AadOid = "agic-camilla-vitale", DisplayName = "Camilla Vitale", Email = "camilla.vitale@agic.it", OfficeLocation = "Milano", Role = "Cybersecurity Specialist", Department = "Cybersecurity", Skills = ["Azure", "Entra ID", "Microsoft Sentinel", "Microsoft Graph"], Certifications = ["SC-200", "AZ-500"], AiTools = ["Copilot"], AiDescription = "Monitoro le minacce con Sentinel e scrivo query KQL.", Hobbies = ["Videogiochi", "Pianoforte"], Interests = ["Design"] },
            new() { AadOid = "agic-lorenzo-pellegrino", DisplayName = "Lorenzo Pellegrino", Email = "lorenzo.pellegrino@agic.it", OfficeLocation = "Roma", Role = "Project Manager", Department = "Practice PM", Skills = ["Kanban", "Stakeholder Management", "Scrum", "Risk Management"], Certifications = ["PMP"], AiTools = ["ChatGPT", "Perplexity"], AiDescription = "Coordino team Agile e gestisco il delivery dei progetti.", Hobbies = ["Ciclismo"], Interests = ["Astronomia", "Jazz"] },
            new() { AadOid = "agic-arianna-gentile", DisplayName = "Arianna Gentile", Email = "arianna.gentile@agic.it", OfficeLocation = "Torino", Role = "Scrum Master", Department = "Practice PM", Skills = ["Jira", "Scrum", "Azure DevOps", "Kanban", "Facilitation"], AiTools = ["Copilot", "ChatGPT"], AiDescription = "Facilito le cerimonie Agile e rimuovo gli impedimenti.", Hobbies = ["Fotografia", "Cucina", "Pianoforte"], Interests = ["Storia"] },
            new() { AadOid = "agic-gabriele-mancini", DisplayName = "Gabriele Mancini", Email = "gabriele.mancini@agic.it", OfficeLocation = "Milano", Role = "SharePoint Consultant", Department = "Modern Work", Skills = ["SharePoint", "Power Platform", "Microsoft Graph", "SPFx", "Power Automate"], Certifications = ["PL-400"], AiTools = ["Copilot", "n8n"], AiDescription = "Realizzo intranet moderne su SharePoint e Viva.", Hobbies = ["Trekking"], Interests = ["Cinema", "Startup"] },
            new() { AadOid = "agic-veronica-testa", DisplayName = "Veronica Testa", Email = "veronica.testa@agic.it", OfficeLocation = "Roma", Role = "Cloud Engineer", Department = "Cloud Infrastructure", Skills = ["Bicep", "Docker", "Linux", "Azure", "Azure DevOps", "Terraform"], Certifications = ["AZ-104", "AZ-305"], AiTools = ["Copilot"], AiDescription = "Automatizzo infrastruttura e deploy su Azure.", Hobbies = ["Chitarra"], Interests = ["Storia"] },
            new() { AadOid = "agic-daniele-marchetti", DisplayName = "Daniele Marchetti", Email = "daniele.marchetti@agic.it", OfficeLocation = "Torino", Role = "Data Scientist", Department = "AI Factory", Skills = ["scikit-learn", "Azure OpenAI", "PyTorch", "SQL", "Pandas"], Certifications = ["DP-100", "AI-102"], AiTools = ["Copilot"], AiDescription = "Addestro modelli e prototipo soluzioni di GenAI.", Hobbies = ["Yoga", "Pianoforte"], Interests = ["Musica elettronica"] },
            new() { AadOid = "agic-serena-coppola", DisplayName = "Serena Coppola", Email = "serena.coppola@agic.it", OfficeLocation = "Milano", Role = "Business Analyst", Department = "Advisory & Compliance", Skills = ["Scrum", "Power BI", "SQL", "Requirements", "Power Platform"], Certifications = ["PSM I", "PL-900"], AiTools = ["Copilot"], AiDescription = "Analizzo i processi e definisco i requisiti con gli stakeholder.", Hobbies = ["Basket", "Trekking", "Padel"], Interests = ["Startup"] },
            new() { AadOid = "agic-mirko-santoro", DisplayName = "Mirko Santoro", Email = "mirko.santoro@agic.it", OfficeLocation = "Roma", Role = "Backend Developer", Department = "Digital Experience", Skills = ["Entity Framework", "Azure Functions", ".NET", "SQL"], Certifications = ["AZ-204"], AiTools = ["GitHub Copilot"], AiDescription = "Sviluppo API .NET e microservizi su Azure.", Hobbies = ["Scacchi", "Padel", "Chitarra"], Interests = ["Sostenibilità"] },
            new() { AadOid = "agic-alice-farina", DisplayName = "Alice Farina", Email = "alice.farina@agic.it", OfficeLocation = "Torino", Role = "UX/UI Designer", Department = "Digital Experience", Skills = ["Figma", "Prototyping", "UX Research", "Design System"], AiTools = ["Midjourney", "ChatGPT"], AiDescription = "Disegno esperienze utente e prototipi ad alta fedeltà.", Hobbies = ["Yoga", "Chitarra", "Basket"], Interests = ["Storia"] },
            new() { AadOid = "agic-cristian-palmieri", DisplayName = "Cristian Palmieri", Email = "cristian.palmieri@agic.it", OfficeLocation = "Milano", Role = "Data Engineer", Department = "Data, BI & Analytics", Skills = ["SQL", "Databricks", "Azure", "Python"], Certifications = ["DP-100", "DP-203"], AiTools = ["GitHub Copilot", "Copilot", "ChatGPT"], AiDescription = "Costruisco pipeline dati e lakehouse su Azure.", Hobbies = ["Yoga"], Interests = ["Viaggi", "Sostenibilità"] },
            new() { AadOid = "agic-noemi-sorrentino", DisplayName = "Noemi Sorrentino", Email = "noemi.sorrentino@agic.it", OfficeLocation = "Roma", Role = "BI Consultant", Department = "Data, BI & Analytics", Skills = ["SQL", "Power Query", "DAX", "Azure", "T-SQL"], AiTools = ["Copilot"], AiDescription = "Progetto modelli semantici e dashboard in Power BI.", Hobbies = ["Ciclismo", "Tennis", "Nuoto"], Interests = ["Arte", "Design"] },
            new() { AadOid = "agic-fabio-donati", DisplayName = "Fabio Donati", Email = "fabio.donati@agic.it", OfficeLocation = "Torino", Role = "Cloud Engineer", Department = "Cloud Infrastructure", Skills = ["Bicep", "Azure DevOps", "Kubernetes", "Docker", "Linux"], Certifications = ["AZ-305", "AZ-104"], AiTools = ["Copilot"], AiDescription = "Automatizzo infrastruttura e deploy su Azure.", Hobbies = ["Trekking"], Interests = ["Libri"] },
            new() { AadOid = "agic-eleonora-bernardi", DisplayName = "Eleonora Bernardi", Email = "eleonora.bernardi@agic.it", OfficeLocation = "Milano", Role = "Dynamics 365 Consultant", Department = "Business Applications", Skills = ["Power Automate", "Dataverse", "X++", "Power Platform", "Dynamics 365"], Certifications = ["MB-330", "PL-600"], AiTools = ["Copilot"], AiDescription = "Implemento Dynamics 365 Finance & Operations.", Hobbies = ["Basket"], Interests = ["Astronomia"] },
            new() { AadOid = "agic-manuel-riva", DisplayName = "Manuel Riva", Email = "manuel.riva@agic.it", OfficeLocation = "Roma", Role = "Cybersecurity Specialist", Department = "Cybersecurity", Skills = ["Azure", "Microsoft Sentinel", "KQL", "Microsoft Graph", "Defender"], Certifications = ["SC-200", "AZ-500"], AiTools = ["ChatGPT", "Copilot"], AiDescription = "Monitoro le minacce con Sentinel e scrivo query KQL.", Hobbies = ["Arrampicata", "Scacchi"], Interests = ["Sostenibilità"] },
            new() { AadOid = "agic-giada-fabbri", DisplayName = "Giada Fabbri", Email = "giada.fabbri@agic.it", OfficeLocation = "Torino", Role = "Project Manager", Department = "Practice PM", Skills = ["Stakeholder Management", "Kanban", "Azure DevOps", "Risk Management", "Scrum"], Certifications = ["PSM I", "PMP"], AiTools = ["Copilot", "ChatGPT"], AiDescription = "Coordino team Agile e gestisco il delivery dei progetti.", Hobbies = ["Nuoto", "Board Games", "Giardinaggio"], Interests = ["Astronomia", "Musica elettronica"] },
            new() { AadOid = "agic-samuele-monti", DisplayName = "Samuele Monti", Email = "samuele.monti@agic.it", OfficeLocation = "Milano", Role = "Data Scientist", Department = "AI Factory", Skills = ["SQL", "Azure AI Search", "Azure OpenAI", "Python", "Pandas"], Certifications = ["AI-102", "DP-100"], AiTools = ["LangChain", "Claude"], AiDescription = "Addestro modelli e prototipo soluzioni di GenAI.", Hobbies = ["Scacchi"], Interests = ["Viaggi"] },
            new() { AadOid = "agic-martina-parisi", DisplayName = "Martina Parisi", Email = "martina.parisi@agic.it", OfficeLocation = "Roma", Role = "Business Analyst", Department = "Advisory & Compliance", Skills = ["Process Mapping", "Scrum", "Requirements", "Power BI"], Certifications = ["PL-900"], AiTools = ["ChatGPT", "Copilot"], AiDescription = "Analizzo i processi e definisco i requisiti con gli stakeholder.", Hobbies = ["Scacchi"], Interests = ["Libri"] },
            new() { AadOid = "agic-filippo-grassi", DisplayName = "Filippo Grassi", Email = "filippo.grassi@agic.it", OfficeLocation = "Torino", Role = "Backend Developer", Department = "Digital Experience", Skills = [".NET", "Docker", "REST API", "SQL", "C#"], AiTools = ["Copilot"], AiDescription = "Sviluppo API .NET e microservizi su Azure.", Hobbies = ["Board Games"], Interests = ["Podcast", "Volontariato"] },
            new() { AadOid = "agic-chiara-negri", DisplayName = "Chiara Negri", Email = "chiara.negri@agic.it", OfficeLocation = "Milano", Role = "BI Consultant", Department = "Data, BI & Analytics", Skills = ["Azure", "DAX", "Power Query", "Power BI", "SQL", "T-SQL"], Certifications = ["PL-300"], AiTools = ["ChatGPT", "Copilot"], AiDescription = "Progetto modelli semantici e dashboard in Power BI.", Hobbies = ["Board Games", "Fotografia"], Interests = ["Storia", "Cinema"] },
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

        // Match per lo scenario "utente esistente" (demo-user-1 = Giulia Rossi):
        //   - 2 match attivi (connected / coffee_scheduled)
        //   - 2 match da verificare (pending)
        dbCtx.Matches.AddRange(
            new Match { UserAId = seedUsers[0].Id, UserBId = seedUsers[1].Id, MatchScore = 0.82, Status = "connected" },
            new Match { UserAId = seedUsers[0].Id, UserBId = seedUsers[2].Id, MatchScore = 0.71, Status = "coffee_scheduled" },
            new Match { UserAId = seedUsers[0].Id, UserBId = seedUsers[3].Id, MatchScore = 0.65, Status = "pending" },
            new Match { UserAId = seedUsers[0].Id, UserBId = seedUsers[4].Id, MatchScore = 0.58, Status = "pending" }
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

app.Run();
