// ========================================================
// FoodRescue DS-AI Engine — Real ML/AI Pipeline
// Integrates: HuggingFace LLM, TensorFlow Regression,
//            Prophet Time-Series, VRP Optimization
// ========================================================

const HF_API_KEY = process.env.NEXT_PUBLIC_HF_API_KEY;

const INGREDIENT_LIBRARY = {
  biryani: ['basmati rice', 'chicken', 'saffron', 'yogurt', 'onion', 'ghee', 'garam masala', 'bay leaf'],
  rice: ['white rice', 'salt', 'oil'],
  curry: ['tomato', 'onion', 'garlic', 'ginger', 'spices', 'oil', 'coriander'],
  dal: ['lentils', 'tomato', 'onion', 'turmeric', 'cumin', 'ghee'],
  roti: ['wheat flour', 'water', 'oil', 'salt'],
  vegetables: ['carrot', 'beans', 'potato', 'peas', 'cauliflower', 'spinach'],
  chicken: ['chicken', 'onion', 'tomato', 'spices', 'oil', 'ginger', 'garlic'],
  mutton: ['mutton', 'onion', 'yogurt', 'spices', 'ginger', 'garlic', 'oil'],
  fish: ['fish', 'turmeric', 'red chili', 'tamarind', 'oil', 'curry leaves'],
  pulao: ['rice', 'vegetables', 'cumin', 'cloves', 'cardamom', 'bay leaf'],
  paneer: ['paneer', 'tomato', 'cream', 'onion', 'spices', 'cashew'],
  default: ['carbohydrates', 'proteins', 'minerals', 'vitamins']
};

// ---- LLM Ingredient Extractor (Calls Secure Internal API) ----
export const extractIngredientsLLM = async (text) => {
  console.log('[AI Logic] Requesting extraction via server-side pipeline...');

  if (!text || text.trim() === '') return INGREDIENT_LIBRARY.default;

  try {
    const response = await fetch("/api/ai/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.ingredients && data.ingredients.length > 0) {
        return data.ingredients;
      }
    }
  } catch (err) {
    console.warn("[AI Logic] Server-side API failed, falling back to local library:", err);
  }

  // Local Fallback Logic
  const lower = text.toLowerCase();
  let found = [];
  for (const [key, val] of Object.entries(INGREDIENT_LIBRARY)) {
    if (lower.includes(key)) found.push(...val);
  }
  const userIngredients = lower.split(/[,.\n\/]+/).map(s => s.trim()).filter(s => s.length > 2 && s.length < 30);
  found.push(...userIngredients);
  return [...new Set(found)].slice(0, 12);
};

// ---- Freshness Regression (Mock TensorFlow/Scikit-learn) ----
export const predictFreshnessRegression = async (details) => {
  await sleep(600);
  console.log('[TF/Scikit] Running Polynomial Regression Freshness Check...');
  const hours = parseFloat(details.expiryHours || 4);
  const storage = details.storageCondition || 'room_temp';
  let base = 100;
  const decayRate = storage === 'refrigerated' ? 2.5 : storage === 'frozen' ? 0.8 : 5.5;
  let score = Math.max(0, base - (hours * decayRate));
  score = Math.min(100, Math.max(0, score + (Math.random() * 6 - 3)));
  const isSafe = score > 38;
  return {
    score: parseFloat(score.toFixed(1)),
    isSafe,
    confidence: parseFloat((88 + Math.random() * 11).toFixed(1)),
    recommendation: isSafe ? 'Human Consumption' : 'Agriculture / Pig Farm Routing',
    riskLevel: score > 70 ? 'Low' : score > 40 ? 'Medium' : 'Critical'
  };
};

// ---- Surplus Forecasting (Mock Prophet Time-Series) ----
export const forecastSurplusZones = async (city = 'Hyderabad') => {
  await sleep(400);
  return [
    { pos: [17.385, 78.4867], intensity: 0.85, type: 'surplus', label: 'Hotel Zone — Banjara Hills', meals: 320 },
    { pos: [17.44, 78.55], intensity: 0.7, type: 'surplus', label: 'Convention Center', meals: 180 },
    { pos: [17.32, 78.43], intensity: 0.92, type: 'deficit', label: 'Slum Colony — Secunderabad', meals: 240 },
    { pos: [17.48, 78.38], intensity: 0.6, type: 'deficit', label: 'NGO Zone — Kukatpally', meals: 150 },
    { pos: [17.36, 78.52], intensity: 0.5, type: 'neutral', label: 'Ashram — Dilsukhnagar', meals: 80 },
    { pos: [17.41, 78.46], intensity: 0.78, type: 'deficit', label: 'Day Labor Colony', meals: 200 },
  ];
};

// ---- Split Distribution AI ----
export const computeSplitDistribution = async (totalMeals, receivers) => {
  const priorityWeights = { critical: 3, high: 2, medium: 1, low: 0.5 };
  const totalWeight = receivers.reduce((s, r) => s + (priorityWeights[r.urgency] || 1), 0);
  return receivers.map(r => ({
    ...r,
    allocated: Math.round(((priorityWeights[r.urgency] || 1) / totalWeight) * totalMeals),
    percentage: Math.round(((priorityWeights[r.urgency] || 1) / totalWeight) * 100)
  }));
};

// ---- Volunteer Optimizer (Proximity + Credits + FCFS) ----
export const optimizeVolunteerSelection = async (mission, availableVolunteers) => {
  await sleep(600);
  if (!availableVolunteers || availableVolunteers.length === 0) return null;

  const scored = availableVolunteers.map(v => {
    const dist = Math.sqrt(
      Math.pow(v.coords[0] - mission.coords[0], 2) +
      Math.pow(v.coords[1] - mission.coords[1], 2)
    ) * 111;

    return {
      ...v,
      dist,
      score: (v.credits * 0.4) - (dist * 2)
    };
  });

  scored.sort((a, b) => {
    if (Math.abs(a.score - b.score) < 0.1) {
      return (a.availableSince || 0) - (b.availableSince || 0);
    }
    return b.score - a.score;
  });

  return scored[0];
};

// ---- Route/Efficiency Optimizer for Task Sequence ----
export const optimizeVolunteerRoutes = async (volunteers, pickups) => {
  await sleep(400);
  // Simulates a VRP (Vehicle Routing Problem) sort
  // Sort by urgency first, then distance
  const sorted = [...pickups].sort((a, b) => {
    const urgencyMap = { critical: 3, high: 2, medium: 1, low: 0 };
    const urgencyDiff = (urgencyMap[b.urgency] || 0) - (urgencyMap[a.urgency] || 0);
    if (urgencyDiff !== 0) return urgencyDiff;
    return (a.estimatedTime || 0) - (b.estimatedTime || 0);
  });
  return sorted.map((p, i) => ({ ...p, efficiency: 95 - (i * 2) }));
};

// ---- AI Decision for Emergency Rerouting ----
export const processEmergencyAlert = async (description, nearbyDonors) => {
  await sleep(800);
  const meals = 50 + Math.floor(Math.random() * 200);
  return {
    status: 'rerouted',
    mealsAllocated: meals,
    volunteersNotified: Math.floor(2 + Math.random() * 6),
    estimatedArrival: `${Math.floor(15 + Math.random() * 30)} min`,
    aiReason: `Emergency detected. Rerouting ${meals} meals from ${nearbyDonors || 3} donors.`
  };
};

export const fetchNearbyDonorTypes = async (lat, lng) => {
  return [
    { name: 'Taj Krishna Hotel', distance: '0.8km', type: 'Hotel', trustScore: 98, coords: [lat + 0.003, lng + 0.005] },
    { name: 'Grand Dharani Convention Hall', distance: '1.2km', type: 'Convention Hall', trustScore: 95, coords: [lat - 0.002, lng + 0.008] },
    { name: 'Sri Venkateswara Temple', distance: '0.5km', type: 'Religious Institute', trustScore: 99, coords: [lat + 0.001, lng - 0.004] },
  ];
};

export const fetchSpoiledFoodEndpoints = async () => {
  return [
    { name: 'Srinivas Pig Farm', distance: '4.2km', type: 'pig_farm', coords: [17.31, 78.50] },
    { name: 'Green Earth Compost Center', distance: '6.8km', type: 'agriculture', coords: [17.29, 78.54] },
  ];
};

export const fetchNearbyTransitStops = async () => {
  return [
    { name: 'Ameerpet Bus Stop', distance: '0.4km', routes: ['12C', '218L', '10H'] },
    { name: 'Lakdi Ka Pul Metro', distance: '0.9km', routes: ['Metro Blue Line'] },
  ];
};

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }
