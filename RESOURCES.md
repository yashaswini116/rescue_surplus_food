# FoodRescue DS-AI — Resources & Links

## 🚀 Live Application
The platform is currently running on **Port 3003**:
- **Landing Page**: [http://localhost:3003](http://localhost:3003)
- **Donor Dashboard (Phase 1)**: [http://localhost:3003/dashboard/donor](http://localhost:3003/dashboard/donor)
- **Receiver Portal (Phase 2)**: [http://localhost:3003/dashboard/receiver](http://localhost:3003/dashboard/receiver)
- **Volunteer Engine (Phase 3)**: [http://localhost:3003/dashboard/volunteer](http://localhost:3003/dashboard/volunteer)
- **AI Analytics Hub**: [http://localhost:3003/dashboard/analytics](http://localhost:3003/dashboard/analytics)

## 🏗️ Technical Architecture
- **AI Engine**: `services/aiEngine.js` — Contains LLM Parsing, Freshness Regression, and VRP Optimization.
- **Data Store**: `services/store.js` — Mock real-time state management.
- **Design System**: `styles/globals.css` — Dark glassmorphism system.
- **Mapping**: `components/LeafletMap.js` — High-performance geospatial visualization.

## 🤖 AI Models Integrated
- **Ingredients**: HuggingFace `flan-t5` logic for automated NLP parsing.
- **Freshness**: TensorFlow-based Regression for safety scoring.
- **Logistics**: VRP (Vehicle Routing Problem) constraint solver for multi-stop missions.
- **Forecasting**: Prophet Time-Series for predicting surplus/hunger zones.

*Run strictly using `npm run dev` in the `t3` directory.*
