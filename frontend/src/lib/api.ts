import { msalInstance } from '../main'
import { loginRequest } from './msalConfig'
import { DEV_BYPASS } from './devBypass'

const BASE_URL = '/api'

// ---------------------------------------------------------------------------
// MOCK DATA — matches backend seed data
// ---------------------------------------------------------------------------

const MOCK_GIULIA: UserProfile = {
  id: 'demo-user-1',
  displayName: 'Giulia Rossi',
  email: 'giulia.rossi@demo.local',
  officeLocation: 'Milano',
  role: 'Cloud Architect',
  department: 'Cloud',
  skills: ['Azure', 'Terraform', 'Kubernetes'],
  certifications: ['AZ-900', 'AZ-305'],
  aiTools: ['Claude', 'GitHub Copilot', 'Azure OpenAI'],
  aiDescription: 'Uso Claude per code review e Azure OpenAI per automazioni',
  hobbies: ['Running', 'Jazz'],
  interests: ['Remote Work', 'Open Source'],
  profileScore: 85,
}

const MOCK_MARCO: UserProfile = {
  id: 'demo-user-2',
  displayName: 'Marco Bianchi',
  email: 'marco.bianchi@demo.local',
  officeLocation: 'Roma',
  role: 'Data & AI Engineer',
  department: 'Data & AI',
  skills: ['Python', 'LangChain', 'FastAPI'],
  certifications: ['DP-900'],
  aiTools: ['Claude', 'LangChain'],
  aiDescription: 'Sfrutto LangChain per pipeline RAG',
  hobbies: ['Corsa', 'Jazz'],
  interests: ['Machine Learning', 'Open Source'],
  profileScore: 78,
}

const MOCK_SARA: UserProfile = {
  id: 'demo-user-3',
  displayName: 'Sara Conti',
  email: 'sara.conti@demo.local',
  officeLocation: 'Torino',
  role: 'Product Designer',
  department: 'Design',
  skills: ['Figma', 'User Research', 'Prototyping'],
  certifications: [],
  aiTools: ['Claude', 'Midjourney'],
  aiDescription: 'Claude per copywriting e ideazione UX',
  hobbies: ['Yoga', 'Fotografia'],
  interests: ['UX Design', 'Mindfulness'],
  profileScore: 72,
}

const MOCK_GROUPS: Group[] = [
  {
    id: 'group-1',
    name: 'Azure Champions',
    description: 'Community interna per professionisti Azure',
    tags: ['Azure', 'Cloud', 'Microsoft'],
    memberCount: 12,
    isSystemSuggested: true,
    isMember: true,
  },
  {
    id: 'group-2',
    name: 'AI Makers',
    description: 'Sperimentatori di AI e LLM in azienda',
    tags: ['AI', 'LLM', 'Python'],
    memberCount: 8,
    isSystemSuggested: true,
    isMember: false,
  },
  {
    id: 'group-3',
    name: 'Photo Walk Club',
    description: 'Appassionati di fotografia e passeggiate urbane',
    tags: ['Fotografia', 'Outdoor'],
    memberCount: 5,
    isSystemSuggested: false,
    isMember: false,
  },
]


const MOCK_MATCH_RESULT: MatchResult = {
  id: 'match-1',
  otherUser: MOCK_MARCO,
  matchScore: 0.82,
  status: 'coffee_scheduled',
  createdAt: new Date().toISOString(),
}

const MOCK_MAP_CLUSTERS = [
  { officeLocation: 'Milano', count: 5, lat: 45.4654, lng: 9.1859 },
  { officeLocation: 'Roma', count: 3, lat: 41.9028, lng: 12.4964 },
  { officeLocation: 'Torino', count: 2, lat: 45.0703, lng: 7.6869 },
]

const MOCK_EXTRA_USERS: UserProfile[] = [
  {
    id: "demo-user-4",
    displayName: "Marco Rossi",
    email: "marco.rossi@agic.it",
    officeLocation: "Torino",
    role: "AI Engineer",
    department: "AI Factory",
    skills: ["Azure", "Python", "Azure OpenAI", "Azure AI Search", "SQL", "Semantic Kernel"],
    certifications: ["AI-102", "DP-100"],
    aiTools: ["Copilot", "Claude", "LangChain"],
    aiDescription: "Costruisco agenti RAG su Azure OpenAI e oriento i prototipi con Claude.",
    hobbies: ["Running", "Trekking", "Padel"],
    interests: ["Viaggi", "Startup"],
    profileScore: 75,
  },
  {
    id: "demo-user-5",
    displayName: "Giulia Ferrari",
    email: "giulia.ferrari@agic.it",
    officeLocation: "Milano",
    role: "Data Scientist",
    department: "AI Factory",
    skills: ["Azure", "Python", "Azure OpenAI", "Azure AI Search", "SQL", "Databricks", "Pandas"],
    certifications: ["DP-100", "DP-203"],
    aiTools: ["Copilot", "Claude", "LangChain", "ChatGPT"],
    aiDescription: "Sperimento pipeline RAG e valutazione modelli; uso molto Claude per il prompt design.",
    hobbies: ["Running"],
    interests: ["Viaggi", "Libri"],
    profileScore: 75,
  },
  {
    id: "demo-user-6",
    displayName: "Luca Bianchi",
    email: "luca.bianchi@agic.it",
    officeLocation: "Roma",
    role: "Machine Learning Engineer",
    department: "AI Factory",
    skills: ["Azure", "Python", "Azure OpenAI", "Azure AI Search", "SQL", "PyTorch"],
    certifications: ["AI-102"],
    aiTools: ["Copilot", "Claude", "LangChain"],
    aiDescription: "Porto in produzione modelli ML e LLM orchestrati con LangChain su Azure.",
    hobbies: ["Running", "Ciclismo"],
    interests: ["Viaggi"],
    profileScore: 75,
  },
  {
    id: "demo-user-7",
    displayName: "Sara Conti",
    email: "sara.conti@agic.it",
    officeLocation: "Torino",
    role: "AI Engineer",
    department: "Data, BI & Analytics",
    skills: ["Azure", "Python", "Azure OpenAI", "Azure AI Search", "SQL"],
    certifications: ["AI-102", "DP-203"],
    aiTools: ["Copilot", "Claude", "LangChain", "Cursor"],
    aiDescription: "Realizzo copiloti interni; prototipo le UI con Cursor e i flussi con LangChain.",
    hobbies: ["Running", "Yoga"],
    interests: ["Viaggi", "Arte"],
    profileScore: 75,
  },
  {
    id: "demo-user-8",
    displayName: "Davide Greco",
    email: "davide.greco@agic.it",
    officeLocation: "Milano",
    role: "Frontend Developer",
    department: "Digital Experience",
    skills: ["TypeScript", "React", "Next.js", "Tailwind CSS", "Node.js", "JavaScript"],
    certifications: [],
    aiTools: ["Cursor", "GitHub Copilot", "ChatGPT"],
    aiDescription: "Sviluppo SPA in React/Next.js e accelero il lavoro con Cursor.",
    hobbies: ["Fotografia", "Calcio"],
    interests: ["Design", "Cinema"],
    profileScore: 75,
  },
  {
    id: "demo-user-9",
    displayName: "Martina Romano",
    email: "martina.romano@agic.it",
    officeLocation: "Torino",
    role: "UX/UI Designer",
    department: "Digital Experience",
    skills: ["Figma", "React", "TypeScript", "Tailwind CSS", "Design System"],
    certifications: [],
    aiTools: ["Cursor", "Midjourney", "ChatGPT"],
    aiDescription: "Disegno design system e prototipo concept visivi con Midjourney.",
    hobbies: ["Fotografia", "Padel"],
    interests: ["Design", "Arte"],
    profileScore: 75,
  },
  {
    id: "demo-user-10",
    displayName: "Alessandro Costa",
    email: "alessandro.costa@agic.it",
    officeLocation: "Roma",
    role: "Full-Stack Developer",
    department: "Digital Experience",
    skills: ["TypeScript", "React", "Next.js", "Tailwind CSS", "Node.js", "C#", ".NET"],
    certifications: ["AZ-204"],
    aiTools: ["GitHub Copilot", "Cursor", "Claude"],
    aiDescription: "Full-stack su React e .NET; uso GitHub Copilot e Cursor ogni giorno.",
    hobbies: ["Fotografia", "Videogiochi"],
    interests: ["Design"],
    profileScore: 75,
  },
  {
    id: "demo-user-11",
    displayName: "Chiara Marino",
    email: "chiara.marino@agic.it",
    officeLocation: "Milano",
    role: "Frontend Developer",
    department: "Modern Work",
    skills: ["TypeScript", "React", "Next.js", "Tailwind CSS", "Node.js"],
    certifications: [],
    aiTools: ["Cursor", "GitHub Copilot"],
    aiDescription: "Mi occupo di front-end accessibile e componenti riutilizzabili.",
    hobbies: ["Fotografia", "Yoga"],
    interests: ["Design", "Viaggi"],
    profileScore: 75,
  },
  {
    id: "demo-user-12",
    displayName: "Federico Esposito",
    email: "federico.esposito@agic.it",
    officeLocation: "Roma",
    role: "Power Platform Consultant",
    department: "Low-Code & Collaboration",
    skills: ["Power Platform", "Power Automate", "Power Apps", "Dataverse", "Dynamics 365"],
    certifications: ["PL-400", "PL-600"],
    aiTools: ["Copilot", "n8n"],
    aiDescription: "Automatizzo processi con Power Automate e n8n; sperimento Copilot Studio.",
    hobbies: ["Scacchi", "Board Games"],
    interests: ["Storia"],
    profileScore: 75,
  },
  {
    id: "demo-user-13",
    displayName: "Valentina Gallo",
    email: "valentina.gallo@agic.it",
    officeLocation: "Milano",
    role: "Dynamics 365 Consultant",
    department: "Business Applications",
    skills: ["Power Platform", "Power Automate", "Dataverse", "Dynamics 365", "Power Apps"],
    certifications: ["MB-210", "PL-600"],
    aiTools: ["Copilot", "n8n"],
    aiDescription: "Configuro Dynamics 365 Sales e orchestro integrazioni low-code.",
    hobbies: ["Scacchi", "Padel"],
    interests: ["Storia", "Viaggi"],
    profileScore: 75,
  },
  {
    id: "demo-user-14",
    displayName: "Matteo Fontana",
    email: "matteo.fontana@agic.it",
    officeLocation: "Torino",
    role: "Power Platform Consultant",
    department: "Low-Code & Collaboration",
    skills: ["Power Platform", "Power Automate", "Power Apps", "Dataverse", "SharePoint"],
    certifications: ["PL-400", "MS-700"],
    aiTools: ["Copilot", "n8n"],
    aiDescription: "Realizzo app aziendali in Power Apps e automazioni con n8n.",
    hobbies: ["Board Games"],
    interests: ["Storia", "Startup"],
    profileScore: 75,
  },
  {
    id: "demo-user-15",
    displayName: "Francesca Rizzo",
    email: "francesca.rizzo@agic.it",
    officeLocation: "Roma",
    role: "Business Analyst",
    department: "Business Applications",
    skills: ["Power Platform", "Power Automate", "SQL", "Power BI", "Requirements"],
    certifications: ["PL-900", "PL-300"],
    aiTools: ["Copilot", "n8n", "ChatGPT"],
    aiDescription: "Traduco esigenze di business in soluzioni Power Platform.",
    hobbies: ["Scacchi", "Cucina"],
    interests: ["Storia", "Libri"],
    profileScore: 75,
  },
  {
    id: "demo-user-16",
    displayName: "Andrea Moretti",
    email: "andrea.moretti@agic.it",
    officeLocation: "Milano",
    role: "Cloud Architect",
    department: "Cloud Infrastructure",
    skills: ["Azure", "Terraform", "Bicep", "Kubernetes", "Docker", "Azure DevOps"],
    certifications: ["AZ-305", "AZ-104"],
    aiTools: ["GitHub Copilot", "Copilot"],
    aiDescription: "Disegno landing zone Azure e automatizzo l'infra con Terraform.",
    hobbies: ["Ciclismo", "Padel"],
    interests: ["Sostenibilit�"],
    profileScore: 75,
  },
  {
    id: "demo-user-17",
    displayName: "Elena Barbieri",
    email: "elena.barbieri@agic.it",
    officeLocation: "Torino",
    role: "DevOps Engineer",
    department: "Cloud Infrastructure",
    skills: ["Azure", "Terraform", "Bicep", "Kubernetes", "Docker", "Azure DevOps", "Linux"],
    certifications: ["AZ-104", "CKA"],
    aiTools: ["GitHub Copilot", "Copilot"],
    aiDescription: "Costruisco pipeline CI/CD e gestisco cluster Kubernetes.",
    hobbies: ["Ciclismo"],
    interests: ["Sostenibilit�", "Astronomia"],
    profileScore: 75,
  },
  {
    id: "demo-user-18",
    displayName: "Simone Lombardi",
    email: "simone.lombardi@agic.it",
    officeLocation: "Roma",
    role: "Cloud Engineer",
    department: "Cloud Infrastructure",
    skills: ["Azure", "Terraform", "Bicep", "Docker", "Azure DevOps"],
    certifications: ["AZ-104", "AZ-305"],
    aiTools: ["GitHub Copilot", "Copilot"],
    aiDescription: "Provisioning e hardening di ambienti Azure con IaC.",
    hobbies: ["Ciclismo", "Running"],
    interests: ["Sostenibilit�"],
    profileScore: 75,
  },
  {
    id: "demo-user-19",
    displayName: "Paolo De Luca",
    email: "paolo.luca@agic.it",
    officeLocation: "Milano",
    role: "Solution Architect",
    department: "Cloud Infrastructure",
    skills: ["Azure", "Terraform", "Kubernetes", "Docker", "Azure DevOps", ".NET"],
    certifications: ["AZ-305", "TOGAF"],
    aiTools: ["GitHub Copilot", "Copilot", "Claude"],
    aiDescription: "Architetto soluzioni cloud-native e guido le scelte tecniche.",
    hobbies: ["Trekking", "Padel"],
    interests: ["Sostenibilit�", "Startup"],
    profileScore: 75,
  },
  {
    id: "demo-user-20",
    displayName: "Antonio Greco",
    email: "antonio.greco@agic.it",
    officeLocation: "Milano",
    role: "Data Engineer",
    department: "Data, BI & Analytics",
    skills: ["Python", "Azure", "Azure Data Factory", "SQL", "Pandas", "T-SQL"],
    certifications: [],
    aiTools: ["Copilot", "GitHub Copilot", "ChatGPT"],
    aiDescription: "Costruisco pipeline dati e lakehouse su Azure.",
    hobbies: ["Running"],
    interests: ["Astronomia"],
    profileScore: 75,
  },
  {
    id: "demo-user-21",
    displayName: "Elisa Ferraro",
    email: "elisa.ferraro@agic.it",
    officeLocation: "Roma",
    role: "BI Consultant",
    department: "Data, BI & Analytics",
    skills: ["Azure", "Power Query", "Power BI", "T-SQL"],
    certifications: [],
    aiTools: ["Copilot", "ChatGPT"],
    aiDescription: "Progetto modelli semantici e dashboard in Power BI.",
    hobbies: ["Trekking", "Running", "Cucina"],
    interests: ["Startup", "Cinema"],
    profileScore: 75,
  },
  {
    id: "demo-user-22",
    displayName: "Riccardo Villa",
    email: "riccardo.villa@agic.it",
    officeLocation: "Torino",
    role: "Backend Developer",
    department: "Digital Experience",
    skills: [".NET", "Azure Functions", "C#", "REST API"],
    certifications: ["AZ-204"],
    aiTools: ["Copilot", "Cursor"],
    aiDescription: "Sviluppo API .NET e microservizi su Azure.",
    hobbies: ["Board Games"],
    interests: ["Design"],
    profileScore: 75,
  },
  {
    id: "demo-user-23",
    displayName: "Beatrice Sala",
    email: "beatrice.sala@agic.it",
    officeLocation: "Milano",
    role: "Cybersecurity Specialist",
    department: "Cybersecurity",
    skills: ["Entra ID", "KQL", "Microsoft Graph", "Azure"],
    certifications: [],
    aiTools: ["Copilot"],
    aiDescription: "Monitoro le minacce con Sentinel e scrivo query KQL.",
    hobbies: ["Calcio", "Arrampicata", "Fotografia"],
    interests: ["Libri"],
    profileScore: 75,
  },
  {
    id: "demo-user-24",
    displayName: "Stefano Ricci",
    email: "stefano.ricci@agic.it",
    officeLocation: "Roma",
    role: "Project Manager",
    department: "Practice PM",
    skills: ["Azure DevOps", "Stakeholder Management", "Risk Management", "Kanban", "Scrum"],
    certifications: ["PMP"],
    aiTools: ["Perplexity"],
    aiDescription: "Coordino team Agile e gestisco il delivery dei progetti.",
    hobbies: ["Fotografia", "Cucina"],
    interests: ["Vino"],
    profileScore: 75,
  },
  {
    id: "demo-user-25",
    displayName: "Laura De Santis",
    email: "laura.santis@agic.it",
    officeLocation: "Torino",
    role: "Scrum Master",
    department: "Practice PM",
    skills: ["Facilitation", "Azure DevOps", "Jira", "Scrum", "Kanban"],
    certifications: [],
    aiTools: ["Copilot"],
    aiDescription: "Facilito le cerimonie Agile e rimuovo gli impedimenti.",
    hobbies: ["Tennis", "Trekking"],
    interests: ["Astronomia"],
    profileScore: 75,
  },
  {
    id: "demo-user-26",
    displayName: "Giorgio Bruno",
    email: "giorgio.bruno@agic.it",
    officeLocation: "Milano",
    role: "SharePoint Consultant",
    department: "Modern Work",
    skills: ["Microsoft Graph", "Power Platform", "SPFx", "Power Automate", "SharePoint"],
    certifications: ["PL-400", "MS-700"],
    aiTools: ["Copilot", "n8n"],
    aiDescription: "Realizzo intranet moderne su SharePoint e Viva.",
    hobbies: ["Pianoforte", "Trekking", "Basket"],
    interests: ["Crypto", "Libri"],
    profileScore: 75,
  },
  {
    id: "demo-user-27",
    displayName: "Silvia Caruso",
    email: "silvia.caruso@agic.it",
    officeLocation: "Roma",
    role: "Cloud Engineer",
    department: "Cloud Infrastructure",
    skills: ["Kubernetes", "Docker", "Azure", "Linux"],
    certifications: [],
    aiTools: ["GitHub Copilot"],
    aiDescription: "Automatizzo infrastruttura e deploy su Azure.",
    hobbies: ["Basket", "Fotografia", "Tennis"],
    interests: ["Podcast", "Musica elettronica"],
    profileScore: 75,
  },
  {
    id: "demo-user-28",
    displayName: "Nicola Ferrara",
    email: "nicola.ferrara@agic.it",
    officeLocation: "Torino",
    role: "Data Scientist",
    department: "AI Factory",
    skills: ["Pandas", "Python", "Azure AI Search", "scikit-learn", "PyTorch"],
    certifications: ["DP-100"],
    aiTools: ["ChatGPT", "Claude", "Copilot"],
    aiDescription: "Addestro modelli e prototipo soluzioni di GenAI.",
    hobbies: ["Trekking"],
    interests: ["Libri"],
    profileScore: 75,
  },
  {
    id: "demo-user-29",
    displayName: "Federica Rinaldi",
    email: "federica.rinaldi@agic.it",
    officeLocation: "Milano",
    role: "Business Analyst",
    department: "Advisory & Compliance",
    skills: ["SQL", "Scrum", "Power BI", "Requirements", "Process Mapping", "Power Platform"],
    certifications: ["PL-900", "PSM I"],
    aiTools: ["Copilot", "ChatGPT"],
    aiDescription: "Analizzo i processi e definisco i requisiti con gli stakeholder.",
    hobbies: ["Arrampicata", "Calcio"],
    interests: ["Storia"],
    profileScore: 75,
  },
  {
    id: "demo-user-30",
    displayName: "Tommaso Galli",
    email: "tommaso.galli@agic.it",
    officeLocation: "Roma",
    role: "UX/UI Designer",
    department: "Digital Experience",
    skills: ["Figma", "Design System", "Prototyping", "UX Research", "Tailwind CSS"],
    certifications: [],
    aiTools: ["Midjourney", "ChatGPT", "Cursor"],
    aiDescription: "Disegno esperienze utente e prototipi ad alta fedelt�.",
    hobbies: ["Cucina", "Trekking", "Basket"],
    interests: ["Astronomia"],
    profileScore: 75,
  },
  {
    id: "demo-user-31",
    displayName: "Ilaria Martini",
    email: "ilaria.martini@agic.it",
    officeLocation: "Torino",
    role: "Dynamics 365 Consultant",
    department: "Business Applications",
    skills: ["Dataverse", "Power Automate", "X++", "Power Platform", "Dynamics 365"],
    certifications: ["PL-600", "MB-330"],
    aiTools: ["Copilot"],
    aiDescription: "Implemento Dynamics 365 Finance & Operations.",
    hobbies: ["Nuoto"],
    interests: ["Storia"],
    profileScore: 75,
  },
  {
    id: "demo-user-32",
    displayName: "Emanuele Leone",
    email: "emanuele.leone@agic.it",
    officeLocation: "Milano",
    role: "Data Engineer",
    department: "Data, BI & Analytics",
    skills: ["Databricks", "Azure", "T-SQL", "Azure Data Factory", "Python", "Spark"],
    certifications: [],
    aiTools: ["Copilot", "GitHub Copilot"],
    aiDescription: "Costruisco pipeline dati e lakehouse su Azure.",
    hobbies: ["Videogiochi", "Ciclismo"],
    interests: ["Fantascienza"],
    profileScore: 75,
  },
  {
    id: "demo-user-33",
    displayName: "Roberta Longo",
    email: "roberta.longo@agic.it",
    officeLocation: "Roma",
    role: "BI Consultant",
    department: "Data, BI & Analytics",
    skills: ["DAX", "Power Query", "SQL", "Power BI"],
    certifications: [],
    aiTools: ["ChatGPT", "Copilot"],
    aiDescription: "Progetto modelli semantici e dashboard in Power BI.",
    hobbies: ["Board Games", "Padel"],
    interests: ["Viaggi"],
    profileScore: 75,
  },
  {
    id: "demo-user-34",
    displayName: "Pietro Serra",
    email: "pietro.serra@agic.it",
    officeLocation: "Torino",
    role: "Backend Developer",
    department: "Digital Experience",
    skills: ["Entity Framework", "Azure Functions", "C#", ".NET", "REST API"],
    certifications: [],
    aiTools: ["Copilot", "GitHub Copilot", "Cursor"],
    aiDescription: "Sviluppo API .NET e microservizi su Azure.",
    hobbies: ["Trekking"],
    interests: ["Storia", "Sostenibilit�"],
    profileScore: 75,
  },
  {
    id: "demo-user-35",
    displayName: "Camilla Vitale",
    email: "camilla.vitale@agic.it",
    officeLocation: "Milano",
    role: "Cybersecurity Specialist",
    department: "Cybersecurity",
    skills: ["Azure", "Entra ID", "Microsoft Sentinel", "Microsoft Graph"],
    certifications: ["SC-200", "AZ-500"],
    aiTools: ["Copilot"],
    aiDescription: "Monitoro le minacce con Sentinel e scrivo query KQL.",
    hobbies: ["Videogiochi", "Pianoforte"],
    interests: ["Design"],
    profileScore: 75,
  },
  {
    id: "demo-user-36",
    displayName: "Lorenzo Pellegrino",
    email: "lorenzo.pellegrino@agic.it",
    officeLocation: "Roma",
    role: "Project Manager",
    department: "Practice PM",
    skills: ["Kanban", "Stakeholder Management", "Scrum", "Risk Management"],
    certifications: ["PMP"],
    aiTools: ["ChatGPT", "Perplexity"],
    aiDescription: "Coordino team Agile e gestisco il delivery dei progetti.",
    hobbies: ["Ciclismo"],
    interests: ["Astronomia", "Jazz"],
    profileScore: 75,
  },
  {
    id: "demo-user-37",
    displayName: "Arianna Gentile",
    email: "arianna.gentile@agic.it",
    officeLocation: "Torino",
    role: "Scrum Master",
    department: "Practice PM",
    skills: ["Jira", "Scrum", "Azure DevOps", "Kanban", "Facilitation"],
    certifications: [],
    aiTools: ["Copilot", "ChatGPT"],
    aiDescription: "Facilito le cerimonie Agile e rimuovo gli impedimenti.",
    hobbies: ["Fotografia", "Cucina", "Pianoforte"],
    interests: ["Storia"],
    profileScore: 75,
  },
  {
    id: "demo-user-38",
    displayName: "Gabriele Mancini",
    email: "gabriele.mancini@agic.it",
    officeLocation: "Milano",
    role: "SharePoint Consultant",
    department: "Modern Work",
    skills: ["SharePoint", "Power Platform", "Microsoft Graph", "SPFx", "Power Automate"],
    certifications: ["PL-400"],
    aiTools: ["Copilot", "n8n"],
    aiDescription: "Realizzo intranet moderne su SharePoint e Viva.",
    hobbies: ["Trekking"],
    interests: ["Cinema", "Startup"],
    profileScore: 75,
  },
  {
    id: "demo-user-39",
    displayName: "Veronica Testa",
    email: "veronica.testa@agic.it",
    officeLocation: "Roma",
    role: "Cloud Engineer",
    department: "Cloud Infrastructure",
    skills: ["Bicep", "Docker", "Linux", "Azure", "Azure DevOps", "Terraform"],
    certifications: ["AZ-104", "AZ-305"],
    aiTools: ["Copilot"],
    aiDescription: "Automatizzo infrastruttura e deploy su Azure.",
    hobbies: ["Chitarra"],
    interests: ["Storia"],
    profileScore: 75,
  },
  {
    id: "demo-user-40",
    displayName: "Daniele Marchetti",
    email: "daniele.marchetti@agic.it",
    officeLocation: "Torino",
    role: "Data Scientist",
    department: "AI Factory",
    skills: ["scikit-learn", "Azure OpenAI", "PyTorch", "SQL", "Pandas"],
    certifications: ["DP-100", "AI-102"],
    aiTools: ["Copilot"],
    aiDescription: "Addestro modelli e prototipo soluzioni di GenAI.",
    hobbies: ["Yoga", "Pianoforte"],
    interests: ["Musica elettronica"],
    profileScore: 75,
  },
  {
    id: "demo-user-41",
    displayName: "Serena Coppola",
    email: "serena.coppola@agic.it",
    officeLocation: "Milano",
    role: "Business Analyst",
    department: "Advisory & Compliance",
    skills: ["Scrum", "Power BI", "SQL", "Requirements", "Power Platform"],
    certifications: ["PSM I", "PL-900"],
    aiTools: ["Copilot"],
    aiDescription: "Analizzo i processi e definisco i requisiti con gli stakeholder.",
    hobbies: ["Basket", "Trekking", "Padel"],
    interests: ["Startup"],
    profileScore: 75,
  },
  {
    id: "demo-user-42",
    displayName: "Mirko Santoro",
    email: "mirko.santoro@agic.it",
    officeLocation: "Roma",
    role: "Backend Developer",
    department: "Digital Experience",
    skills: ["Entity Framework", "Azure Functions", ".NET", "SQL"],
    certifications: ["AZ-204"],
    aiTools: ["GitHub Copilot"],
    aiDescription: "Sviluppo API .NET e microservizi su Azure.",
    hobbies: ["Scacchi", "Padel", "Chitarra"],
    interests: ["Sostenibilit�"],
    profileScore: 75,
  },
  {
    id: "demo-user-43",
    displayName: "Alice Farina",
    email: "alice.farina@agic.it",
    officeLocation: "Torino",
    role: "UX/UI Designer",
    department: "Digital Experience",
    skills: ["Figma", "Prototyping", "UX Research", "Design System"],
    certifications: [],
    aiTools: ["Midjourney", "ChatGPT"],
    aiDescription: "Disegno esperienze utente e prototipi ad alta fedelt�.",
    hobbies: ["Yoga", "Chitarra", "Basket"],
    interests: ["Storia"],
    profileScore: 75,
  },
  {
    id: "demo-user-44",
    displayName: "Cristian Palmieri",
    email: "cristian.palmieri@agic.it",
    officeLocation: "Milano",
    role: "Data Engineer",
    department: "Data, BI & Analytics",
    skills: ["SQL", "Databricks", "Azure", "Python"],
    certifications: ["DP-100", "DP-203"],
    aiTools: ["GitHub Copilot", "Copilot", "ChatGPT"],
    aiDescription: "Costruisco pipeline dati e lakehouse su Azure.",
    hobbies: ["Yoga"],
    interests: ["Viaggi", "Sostenibilit�"],
    profileScore: 75,
  },
  {
    id: "demo-user-45",
    displayName: "Noemi Sorrentino",
    email: "noemi.sorrentino@agic.it",
    officeLocation: "Roma",
    role: "BI Consultant",
    department: "Data, BI & Analytics",
    skills: ["SQL", "Power Query", "DAX", "Azure", "T-SQL"],
    certifications: [],
    aiTools: ["Copilot"],
    aiDescription: "Progetto modelli semantici e dashboard in Power BI.",
    hobbies: ["Ciclismo", "Tennis", "Nuoto"],
    interests: ["Arte", "Design"],
    profileScore: 75,
  },
  {
    id: "demo-user-46",
    displayName: "Fabio Donati",
    email: "fabio.donati@agic.it",
    officeLocation: "Torino",
    role: "Cloud Engineer",
    department: "Cloud Infrastructure",
    skills: ["Bicep", "Azure DevOps", "Kubernetes", "Docker", "Linux"],
    certifications: ["AZ-305", "AZ-104"],
    aiTools: ["Copilot"],
    aiDescription: "Automatizzo infrastruttura e deploy su Azure.",
    hobbies: ["Trekking"],
    interests: ["Libri"],
    profileScore: 75,
  },
  {
    id: "demo-user-47",
    displayName: "Eleonora Bernardi",
    email: "eleonora.bernardi@agic.it",
    officeLocation: "Milano",
    role: "Dynamics 365 Consultant",
    department: "Business Applications",
    skills: ["Power Automate", "Dataverse", "X++", "Power Platform", "Dynamics 365"],
    certifications: ["MB-330", "PL-600"],
    aiTools: ["Copilot"],
    aiDescription: "Implemento Dynamics 365 Finance & Operations.",
    hobbies: ["Basket"],
    interests: ["Astronomia"],
    profileScore: 75,
  },
  {
    id: "demo-user-48",
    displayName: "Manuel Riva",
    email: "manuel.riva@agic.it",
    officeLocation: "Roma",
    role: "Cybersecurity Specialist",
    department: "Cybersecurity",
    skills: ["Azure", "Microsoft Sentinel", "KQL", "Microsoft Graph", "Defender"],
    certifications: ["SC-200", "AZ-500"],
    aiTools: ["ChatGPT", "Copilot"],
    aiDescription: "Monitoro le minacce con Sentinel e scrivo query KQL.",
    hobbies: ["Arrampicata", "Scacchi"],
    interests: ["Sostenibilit�"],
    profileScore: 75,
  },
  {
    id: "demo-user-49",
    displayName: "Giada Fabbri",
    email: "giada.fabbri@agic.it",
    officeLocation: "Torino",
    role: "Project Manager",
    department: "Practice PM",
    skills: ["Stakeholder Management", "Kanban", "Azure DevOps", "Risk Management", "Scrum"],
    certifications: ["PSM I", "PMP"],
    aiTools: ["Copilot", "ChatGPT"],
    aiDescription: "Coordino team Agile e gestisco il delivery dei progetti.",
    hobbies: ["Nuoto", "Board Games", "Giardinaggio"],
    interests: ["Astronomia", "Musica elettronica"],
    profileScore: 75,
  },
  {
    id: "demo-user-50",
    displayName: "Samuele Monti",
    email: "samuele.monti@agic.it",
    officeLocation: "Milano",
    role: "Data Scientist",
    department: "AI Factory",
    skills: ["SQL", "Azure AI Search", "Azure OpenAI", "Python", "Pandas"],
    certifications: ["AI-102", "DP-100"],
    aiTools: ["LangChain", "Claude"],
    aiDescription: "Addestro modelli e prototipo soluzioni di GenAI.",
    hobbies: ["Scacchi"],
    interests: ["Viaggi"],
    profileScore: 75,
  },
  {
    id: "demo-user-51",
    displayName: "Martina Parisi",
    email: "martina.parisi@agic.it",
    officeLocation: "Roma",
    role: "Business Analyst",
    department: "Advisory & Compliance",
    skills: ["Process Mapping", "Scrum", "Requirements", "Power BI"],
    certifications: ["PL-900"],
    aiTools: ["ChatGPT", "Copilot"],
    aiDescription: "Analizzo i processi e definisco i requisiti con gli stakeholder.",
    hobbies: ["Scacchi"],
    interests: ["Libri"],
    profileScore: 75,
  },
  {
    id: "demo-user-52",
    displayName: "Filippo Grassi",
    email: "filippo.grassi@agic.it",
    officeLocation: "Torino",
    role: "Backend Developer",
    department: "Digital Experience",
    skills: [".NET", "Docker", "REST API", "SQL", "C#"],
    certifications: [],
    aiTools: ["Copilot"],
    aiDescription: "Sviluppo API .NET e microservizi su Azure.",
    hobbies: ["Board Games"],
    interests: ["Podcast", "Volontariato"],
    profileScore: 75,
  },
  {
    id: "demo-user-53",
    displayName: "Chiara Negri",
    email: "chiara.negri@agic.it",
    officeLocation: "Milano",
    role: "BI Consultant",
    department: "Data, BI & Analytics",
    skills: ["Azure", "DAX", "Power Query", "Power BI", "SQL", "T-SQL"],
    certifications: ["PL-300"],
    aiTools: ["ChatGPT", "Copilot"],
    aiDescription: "Progetto modelli semantici e dashboard in Power BI.",
    hobbies: ["Board Games", "Fotografia"],
    interests: ["Storia", "Cinema"],
    profileScore: 75,
  },
]

const MOCK_EXTRA_MATCHES: WorkMatchCard[] = [
  {
    id: "demo-user-4",
    displayName: "Marco Rossi",
    role: "AI Engineer",
    department: "AI Factory",
    matchScore: 0.95,
    sharedSkills: ["Azure"],
    sharedAiTools: ["Claude"],
    sharedInterests: [],
  },
  {
    id: "demo-user-5",
    displayName: "Giulia Ferrari",
    role: "Data Scientist",
    department: "AI Factory",
    matchScore: 0.91,
    sharedSkills: ["Azure"],
    sharedAiTools: ["Claude"],
    sharedInterests: [],
  },
  {
    id: "demo-user-6",
    displayName: "Luca Bianchi",
    role: "Machine Learning Engineer",
    department: "AI Factory",
    matchScore: 0.88,
    sharedSkills: ["Azure"],
    sharedAiTools: ["Claude"],
    sharedInterests: [],
  },
  {
    id: "demo-user-7",
    displayName: "Sara Conti",
    role: "AI Engineer",
    department: "Data, BI & Analytics",
    matchScore: 0.84,
    sharedSkills: ["Azure"],
    sharedAiTools: ["Claude"],
    sharedInterests: [],
  },
  {
    id: "demo-user-8",
    displayName: "Davide Greco",
    role: "Frontend Developer",
    department: "Digital Experience",
    matchScore: 0.79,
    sharedSkills: [],
    sharedAiTools: ["GitHub Copilot"],
    sharedInterests: [],
  },
  {
    id: "demo-user-9",
    displayName: "Martina Romano",
    role: "UX/UI Designer",
    department: "Digital Experience",
    matchScore: 0.74,
    sharedSkills: [],
    sharedAiTools: [],
    sharedInterests: [],
  },
  {
    id: "demo-user-10",
    displayName: "Alessandro Costa",
    role: "Full-Stack Developer",
    department: "Digital Experience",
    matchScore: 0.7,
    sharedSkills: [],
    sharedAiTools: ["Claude", "GitHub Copilot"],
    sharedInterests: [],
  },
  {
    id: "demo-user-11",
    displayName: "Chiara Marino",
    role: "Frontend Developer",
    department: "Modern Work",
    matchScore: 0.65,
    sharedSkills: [],
    sharedAiTools: ["GitHub Copilot"],
    sharedInterests: [],
  },
  {
    id: "demo-user-12",
    displayName: "Federico Esposito",
    role: "Power Platform Consultant",
    department: "Low-Code & Collaboration",
    matchScore: 0.6,
    sharedSkills: [],
    sharedAiTools: [],
    sharedInterests: [],
  },
  {
    id: "demo-user-13",
    displayName: "Valentina Gallo",
    role: "Dynamics 365 Consultant",
    department: "Business Applications",
    matchScore: 0.55,
    sharedSkills: [],
    sharedAiTools: [],
    sharedInterests: [],
  },
]


// In-memory mutable state for group membership (survives component re-renders)
const groupMembershipState: Record<string, boolean> = {
  'group-1': true,
  'group-2': false,
  'group-3': false,
}

// ---------------------------------------------------------------------------
// MOCK REQUEST HANDLER
// ---------------------------------------------------------------------------

function mockRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const method = (options?.method ?? 'GET').toUpperCase()

  // Split path and query string
  const [basePath, queryString] = path.split('?')
  const params = new URLSearchParams(queryString ?? '')
  const q = params.get('q') ?? ''

  // POST /auth/me
  if (method === 'POST' && basePath === '/auth/me') {
    return Promise.resolve({} as T)
  }

  // GET /profiles/me
  if (method === 'GET' && basePath === '/profiles/me') {
    return Promise.resolve(MOCK_GIULIA as T)
  }

  // PUT /profiles/me
  if (method === 'PUT' && basePath === '/profiles/me') {
    return Promise.resolve(MOCK_GIULIA as T)
  }

  // GET /profiles (with optional ?q= filter)
  if (method === 'GET' && basePath === '/profiles') {
    let results: UserProfile[] = [MOCK_MARCO, MOCK_SARA, ...MOCK_EXTRA_USERS]
    if (q) {
      const lower = q.toLowerCase()
      results = results.filter(
        (p) =>
          p.displayName.toLowerCase().includes(lower) ||
          (p.role ?? '').toLowerCase().includes(lower) ||
          p.skills.some((s) => s.toLowerCase().includes(lower)),
      )
    }
    return Promise.resolve(results as T)
  }

  // GET /matches/suggestions
  if (method === 'GET' && basePath === '/matches/suggestions') {
    return Promise.resolve(MOCK_EXTRA_MATCHES as T)
  }

  // POST /matches/swipe
  if (method === 'POST' && basePath === '/matches/swipe') {
    let body: Record<string, unknown> = {}
    try {
      body = JSON.parse((options?.body as string) ?? '{}')
    } catch {
      // ignore parse errors
    }
    const isRightOnMarco =
      body.direction === 'right' && body.targetUserId === 'demo-user-2'
    const result = isRightOnMarco
      ? { matched: true, matchId: 'match-1' }
      : { matched: false }
    return Promise.resolve(result as T)
  }

  // GET /matches
  if (method === 'GET' && basePath === '/matches') {
    return Promise.resolve([MOCK_MATCH_RESULT] as T)
  }

  // GET /groups
  if (method === 'GET' && basePath === '/groups') {
    const groups = MOCK_GROUPS.map((g) => ({
      ...g,
      isMember: groupMembershipState[g.id] ?? g.isMember,
    }))
    return Promise.resolve(groups as T)
  }

  // POST /groups/:id/join
  const joinMatch = basePath.match(/^\/groups\/([^/]+)\/join$/)
  if (method === 'POST' && joinMatch) {
    groupMembershipState[joinMatch[1]] = true
    return Promise.resolve({ success: true } as T)
  }

  // DELETE /groups/:id/leave
  const leaveMatch = basePath.match(/^\/groups\/([^/]+)\/leave$/)
  if (method === 'DELETE' && leaveMatch) {
    groupMembershipState[leaveMatch[1]] = false
    return Promise.resolve({ success: true } as T)
  }

  // GET /map/clusters
  if (method === 'GET' && basePath === '/map/clusters') {
    return Promise.resolve(MOCK_MAP_CLUSTERS as T)
  }

  // Fallback — should not happen in demo flow
  console.warn(`[mock] Unhandled ${method} ${path} — returning empty object`)
  return Promise.resolve({} as T)
}

// ---------------------------------------------------------------------------
// TOKEN + REAL REQUEST
// ---------------------------------------------------------------------------

async function getToken(): Promise<string> {
  if (DEV_BYPASS) return 'dev-bypass-token'
  const account = msalInstance.getActiveAccount()
  if (!account) throw new Error('Not authenticated')
  const response = await msalInstance.acquireTokenSilent({ ...loginRequest, account })
  return response.accessToken
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  if (DEV_BYPASS) {
    return mockRequest<T>(path, options)
  }

  const token = await getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  })

  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)

  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export interface UserProfile {
  id: string
  displayName: string
  email: string
  officeLocation: string
  avatarUrl?: string
  role?: string
  department?: string
  skills: string[]
  certifications: string[]
  aiTools: string[]
  aiDescription?: string
  hobbies: string[]
  interests: string[]
  profileScore: number
}

export interface WorkMatchCard {
  id: string
  displayName: string
  role?: string
  department?: string
  avatarUrl?: string
  matchScore: number
  sharedSkills: string[]
  sharedAiTools: string[]
  sharedInterests: string[]
}

export interface Group {
  id: string
  name: string
  description: string
  tags: string[]
  memberCount: number
  isSystemSuggested: boolean
  isMember: boolean
}

export interface MatchResult {
  id: string
  otherUser: UserProfile
  matchScore: number
  status: 'pending' | 'coffee_scheduled' | 'connected'
  createdAt: string
}
