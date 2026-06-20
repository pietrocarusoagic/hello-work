# 👋 Hello Work

> *Connect. Discover. Belong.* — The corporate networking platform for the remote work era.

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 What is Hello Work?

**Hello Work** is a networking app designed to help colleagues truly know each other — professionally and personally — in an era where remote and hybrid work has made it harder to build real human connections.

Whether you want to find a colleague who shares your passion for photography, discover who the go-to expert on Azure is, or just have a virtual coffee with someone new: **Hello Work makes it happen**.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🧑 **Rich Profiles** | Professional skills + personal interests + availability |
| 🔍 **Smart Discovery** | Find colleagues by skills, hobbies, location, team |
| ☕ **Coffee Chat** | Request quick 15-30 min virtual or in-person chats |
| 👥 **Interest Groups** | Join communities (running, AI, photography, …) |
| 💬 **Icebreaker Feed** | Weekly prompts to share and discover |
| 📅 **Event Board** | Post and discover team meetups |

---

## 🏗️ Repository Structure

```
hello-work/
├── docs/               # Functional analysis, architecture, ADRs
├── src/
│   ├── frontend/       # Next.js application
│   └── backend/        # FastAPI REST API
├── infra/              # Bicep IaC templates
├── tests/              # Integration & e2e tests
├── presentation/       # Pitch deck & demo materials
└── .github/workflows/  # CI/CD pipelines
```

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Backend | FastAPI (Python 3.12) |
| Database | Azure PostgreSQL Flexible Server |
| Auth | Azure Active Directory (SSO) |
| Hosting | Azure Container Apps |
| Storage | Azure Blob Storage |
| IaC | Azure Bicep |
| CI/CD | GitHub Actions → Azure |

---

## 🏃 Quick Start (POC)

```bash
# Clone
git clone https://github.com/pietrocarusoagic/hello-work.git
cd hello-work

# Frontend
cd src/frontend
npm install && npm run dev

# Backend
cd src/backend
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## 🌍 Deploy to Azure

```bash
# Login
az login

# Deploy infrastructure
cd infra
az deployment group create \
  --resource-group rg-hellowork \
  --template-file main.bicep \
  --parameters @params.json
```

---

## 👥 Team

Built with ❤️ by **Team AGIC** at the AGIC Innovation Hackathon 2026.

---

## 📄 License

MIT License — see [LICENSE](LICENSE).
