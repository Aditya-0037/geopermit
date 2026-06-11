# GeoPermit AI - Web Interface

GIS-Powered Land Use & Permit Exception Orchestrator for UiPath AgentHack 2026

## Project Overview

GeoPermit AI is an agentic land-use permit exception orchestration system built on UiPath Maestro Case. It intercepts permit applications from builders, developers, and citizens; uses AI agents to check GIS zoning compliance; and routes only genuine exceptions to the right municipal officer — keeping humans in the loop precisely where judgment matters.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Forms**: React Hook Form + Zod validation
- **Maps**: Leaflet + React Leaflet
- **Orchestration**: UiPath Maestro Case
- **AI Agents**: UiPath Agent Builder + Coded Agents (Python/LangGraph)
- **GIS APIs**: OpenStreetMap (Nominatim + Overpass API)

## Architecture

### 4-Agent Pipeline

1. **Intake Classifier Agent** (UiPath Agent Builder)
   - Extracts applicant info, permit type, address from submissions
   - Flags missing documents

2. **GIS Compliance Agent** (Python Coded Agent)
   - Geocodes address via Nominatim
   - Checks zoning via Overpass API
   - Detects zone conflicts

3. **Case Resolution Agent** (UiPath Agent Builder)
   - Decides: AutoApprove / EscalateHuman / RequestDocuments
   - Generates plain-English reasoning

4. **Human Officer Review** (UiPath Action Task)
   - Municipal officer sees AI recommendation
   - Makes final approval/rejection decision

## Project Structure

```
geopermit-web/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Officer dashboard routes
│   ├── (public)/           # Public permit submission routes
│   ├── api/                # API routes
│   └── layout.tsx          # Root layout
├── components/             # Shared React components
│   ├── ui/                 # shadcn/ui components
│   ├── forms/              # Form components
│   ├── maps/               # Map components
│   └── layout/             # Layout components
├── lib/                    # Utility functions
│   ├── types/              # TypeScript types
│   ├── schemas/            # Zod validation schemas
│   ├── api/                # API client functions
│   └── utils.ts            # Helper utilities
└── public/                 # Static assets

```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- UiPath Automation Cloud tenant with Labs access
- Anthropic API key for Claude Sonnet 4

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
# UiPath
UIPATH_TENANT_URL=https://cloud.uipath.com/{org}/{tenant}
UIPATH_CLIENT_ID=your_client_id
UIPATH_CLIENT_SECRET=your_client_secret

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
npm start
```

## Demo Scenarios

### Scenario 1: Clean Approval
- **Applicant**: Rahul Sharma
- **Type**: Residential extension
- **Address**: 14 Green Valley Rd (residential zone)
- **Result**: Auto-approved in <10 seconds

### Scenario 2: Zone Conflict (WOW MOMENT)
- **Applicant**: TechCorp Ltd
- **Type**: Commercial building
- **Address**: 42 Green Valley Rd (RESIDENTIAL zone!)
- **Result**: Conflict detected → Officer review → Human decision

### Scenario 3: Missing Documents
- **Applicant**: BuildCo
- **Type**: Commercial renovation
- **Address**: 10 CBD Plaza (commercial zone)
- **Result**: Missing docs flagged → Request sent to applicant

## API Routes

### POST /api/permits/submit
Submit new permit application

### GET /api/permits/[id]
Get permit case details

### GET /api/cases/dashboard
Get officer dashboard data

### POST /api/uipath/webhook
Webhook for UiPath case updates

## UiPath Components Used

- ✅ Maestro Case - Orchestration and state management
- ✅ Agent Builder - Intake Classifier + Resolution Agent
- ✅ Coded Agent (Python) - GIS Compliance Agent
- ✅ API Workflows - HTTP trigger for case creation
- ✅ RPA Bot (Studio) - Notification automation
- ✅ Claude Code - Agent scaffolding (bonus points)

## License

MIT License - See LICENSE file for details

## Team

- Orchestration & Integration Lead
- GIS + AI Agent Developer
- Frontend & UX Developer
- Demo & Documentation

## Hackathon Links

- **Devpost**: [Project Submission](#)
- **Demo Video**: [YouTube Link](#)
- **GitHub**: [Repository](#)
- **Presentation Deck**: [Google Drive Link](#)
