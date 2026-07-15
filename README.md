# Infinity Realms 🌌

> *Every session is different. Every decision changes your story.*

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A **never-ending browser RPG** with procedurally generated worlds, AI-driven NPCs and quests, dynamic economies, and real-time multiplayer — all playable with zero installation.

---

## ✨ Features

| Feature | Status |
|---------|--------|
| 🗺️ Procedural worlds (seeded noise, biomes, cities, dungeons) | ✅ DONE |
| 🚶 Player movement (WASD + touch joystick) | ✅ DONE |
| ⚔️ Top-down action combat | 🔄 PARTIAL (client simulation, server-authoritative rewards) |
| 🤖 AI-generated quests & NPC dialogue | 🔄 PARTIAL (dormant provider code, template fallback default) |
| 💾 Auto-save (localStorage → server sync) | ✅ DONE |
| 🌦️ Dynamic weather system | ✅ DONE |
| 🎒 Inventory & loot system | ✅ DONE (server-authoritative) |
| 👥 Multiplayer (room codes) & Trading | ✅ DONE (server-authoritative transaction trade completion) |
| 🏙️ Living world (Guilds, Dynamic Economy) | 🔄 PARTIAL (server Guild CRUD done, roster/economy incomplete) |
| 🎭 AI Dungeon Master & Seasonal Events | 🔄 PARTIAL (proximity events + night FX done, memory/Dungeon Master planned) |
| 🌐 Localization & Settings UI | ✅ DONE |
| 🛠️ Creator Tools | 📅 PLANNED |

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### 1. Clone & install
```bash
git clone https://github.com/amarjaleelbanbhan/Infinty-Realms.git
cd Infinty-Realms
cp .env.example .env
npm install
```

### 2. Run (development)
```bash
# Run both client + server
npm run dev

# Or individually
npm run dev:client   # http://localhost:5173
npm run dev:server   # http://localhost:3001
```

### 3. Play
Open **http://localhost:5173** in your browser. No account needed — a guest session is created automatically.

---

## 🏗️ Architecture

```
Infinty-Realms/
├── client/          # React + Vite + Phaser.js (the game)
├── server/          # NestJS + Prisma + SQLite (API + WebSocket)
├── shared/          # TypeScript types shared between client & server
├── ai/              # LLM integration (mock / Ollama / OpenAI)
├── docker/          # Docker Compose for production
├── docs/            # Architecture Decision Records
└── .github/         # CI/CD workflows
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Game Engine | Phaser.js 3 |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v3 |
| State | Zustand |
| Backend | NestJS + TypeScript |
| Database | SQLite (dev) → PostgreSQL (prod) |
| ORM | Prisma |
| Real-time | Socket.IO |
| AI | Mock → Ollama → OpenAI-compatible |
| Hosting | Vercel (client) + Railway (server) |

---

## 🤖 AI Configuration

The game uses a tiered AI system. Set `AI_PROVIDER` in `.env`:

| Provider | Setup | Quality |
|----------|-------|---------|
| `mock` | Zero config | Template-based quests |
| `ollama` | [Install Ollama](https://ollama.ai) + `ollama pull llama3` | Good, local, private |
| `openai` | Set `OPENAI_API_KEY` | Best quality |

---

## 🎮 Controls

| Action | Keyboard | Mobile |
|--------|----------|--------|
| Move | WASD / Arrow Keys | Joystick |
| Attack | Space / Left Click | Attack button |
| Interact | E | Interact button |
| Inventory | I | Inventory button |
| Quest Log | Q | Quest button |
| Pause | Escape | Menu button |

---

## 🗺️ Procedural World System

Every world is generated from a **seed** using:
- **Simplex noise** for terrain heightmap
- **Biome assignment** based on height + moisture
- **Poisson disk sampling** for city placement
- **Midpoint displacement** for river carving
- **Cellular automata** for dungeon generation

Biomes: Ocean · Beach · Plains · Forest · Desert · Snow · Volcano · Swamp

---

## 🛣️ Roadmap

- **Phase 0 — Truth Pass** — Full repository audit and correction of false claims ✅ DONE
- **Phase 1 — Foundation** — Monorepo path fixes, NestJS boot, Jest/Vitest infrastructure, server-authoritative movement/trade/inventory/combat rewards, anti-cheat, real party invites ✅ DONE
- **Phase 2 — Core Gameplay** — Biome-reactive magic grimoire (DONE), diagonal sliding movement feel (DONE), dodge rolling mechanics (DONE) 🔄 PARTIAL
- **Phase 3 — World** — Deepening procedural gen, cities/villages, day/night cycle, weather 📅 PLANNED
- **Phase 4 — AI** — NPC memory, real AI dialogue/quest generator defaults 📅 PLANNED
- **Phase 5 — Multiplayer** — Guild roster refinement, party sync, chat moderation 📅 PLANNED
- **Phase 6 — Living World** — NPC schedules, faction relationships, dynamic wars 📅 PLANNED
- **Phase 7 — Creator Platform** — Modding API, quest/NPC/dungeon editors 📅 PLANNED
- **Phase 8 — Infinite Game** — Player politics, kingdoms, legendary events 📅 PLANNED

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](docs/CONTRIBUTING.md).

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feat/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT © [Infinity Realms Contributors](LICENSE)

---

<p align="center">Built with ❤️ — Open Source Forever</p>
