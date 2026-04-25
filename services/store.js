// Mock Firebase / In-Memory State Store
// Enhanced with Firestore persistence logic
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';

let _toastBus = null;
export const setToastBus = (fn) => { _toastBus = fn; };
export const triggerToast = (toast) => { if (_toastBus) _toastBus(toast); };

// Shared in-memory store (simulates Firestore real-time)
const store = {
  donations: [
    { id: 'd1', foodType: 'Wedding Biryani', quantity: 120, cookingTime: '11:00', expiryHours: '3', storageCondition: 'room_temp', preferredTransport: 'volunteer', donorName: 'Taj Krishna Hotel', donorType: 'Hotel', status: 'pending', urgencyLevel: 'high', isSpoiled: false, ingredients: ['basmati rice','chicken','saffron','onion','ghee'], score: 83.5, dsConfidence: '97.4%', transport: 'Volunteer', createdAt: new Date(Date.now() - 1800000).toISOString(), splitDistribution: [{name:'City Orphanage', allocated: 60}, {name:'Slum Colony A', allocated: 40}, {name:'Old Age Home', allocated: 20}], coords: [17.385, 78.4867], rating: 4.8, trustScore: 98, donorId: 'donor1' },
    { id: 'd2', foodType: 'Mixed Vegetable Dal', quantity: 80, cookingTime: '08:00', expiryHours: '5', storageCondition: 'room_temp', preferredTransport: 'public', donorName: 'Anna Canteen JNTU', donorType: 'Hostel', status: 'completed', urgencyLevel: 'medium', isSpoiled: false, ingredients: ['toor dal','vegetables','turmeric','spices'], score: 72.5, dsConfidence: '94.1%', transport: 'Public', createdAt: new Date(Date.now() - 7200000).toISOString(), splitDistribution: [], coords: [17.44, 78.55], rating: 4.5, trustScore: 93, donorId: 'donor1' },
  ],
  volunteers: [
    { id: 'v1', name: 'Ravi Kumar', zone: 'Banjara Hills', trustScore: 96, credits: 1450, completedDeliveries: 42, rating: 4.9, isOnline: true, status: 'available', vehicle: 'Bike', coords: [17.41, 78.45] },
    { id: 'v2', name: 'Priya Sharma', zone: 'Kukatpally', trustScore: 88, credits: 890, completedDeliveries: 28, rating: 4.7, isOnline: true, status: 'on_task', vehicle: 'Scooter', coords: [17.48, 78.38] },
  ],
  receivers: [
    { id: 'r1', name: 'Sai Ashram', type: 'Ashram', urgency: 'critical', meals: 100, location: [17.35, 78.43], trustScore: 97 },
    { id: 'r2', name: 'Helping Hands NGO', type: 'NGO', urgency: 'high', meals: 80, location: [17.47, 78.41], trustScore: 95 },
    { id: 'r3', name: 'Slum Colony — Mothinagar', type: 'Slum Colony', urgency: 'high', meals: 75, location: [17.42, 78.48], trustScore: 89 },
  ],
  notifications: [],
  alerts: [],
};

export const getStore = () => store;

export const addDonation = async (donation) => {
  // 1. Add to local store immediately for UI responsiveness
  store.donations.unshift(donation);

  // 2. Persist to Firestore
  try {
    const docRef = await addDoc(collection(db, "donations"), {
      ...donation,
      serverTime: serverTimestamp()
    });
    console.log("Firestore: Donation saved with ID:", docRef.id);
  } catch (e) {
    console.error("Firestore Error: Failed to save donation:", e);
    // Silent fallback to local store only
  }

  // 3. Auto-notify volunteers if large donation
  if (donation.quantity >= 100) {
    addNotification({
      type: 'volunteer_alert',
      title: '🔔 Massive Food Alert!',
      message: `${donation.foodType} (${donation.quantity} meals) from ${donation.donorName}. Volunteers needed urgently!`,
      targetRole: 'volunteer',
      urgency: 'critical'
    });
  }
  return donation;
};

export const addVolunteer = async (volunteer) => {
  const v = { id: `v${Date.now()}`, ...volunteer, credits: 0, completedDeliveries: 0, rating: 5.0, status: 'available', trustScore: 100 };
  store.volunteers.push(v);
  
  try {
    await addDoc(collection(db, "volunteers"), {
      ...v,
      serverTime: serverTimestamp()
    });
  } catch (e) { /* Fallback */ }
  
  return v;
};

export const addNotification = async (notif) => {
  const n = { id: Math.random().toString(36).slice(2), ...notif, time: new Date().toISOString() };
  store.notifications.unshift(n);
  triggerToast(n);

  try {
    await addDoc(collection(db, "notifications"), {
      ...n,
      serverTime: serverTimestamp()
    });
  } catch (e) { /* Fallback */ }

  return n;
};

export const addAlert = async (alert) => {
  const a = { id: Math.random().toString(36).slice(2), ...alert, time: new Date().toISOString() };
  store.alerts.unshift(a);
  
  try {
    await addDoc(collection(db, "alerts"), {
      ...a,
      serverTime: serverTimestamp()
    });
  } catch (e) { /* Fallback */ }
  
  return a;
};

export const getAnalyticsData = () => ({
  totalDonations: 1482,
  foodRescued: 48392,
  wasteReduced: 72.4,
  volunteersActive: 312,
  ngosServed: 148,
  averageDeliveryTime: 28,
  hungerAlerts: 34,
  spoiledRerouted: 89,
  mealsPerDay: [120, 145, 98, 200, 175, 210, 195, 170, 230, 185, 250, 220, 195, 180],
  receiverTypes: [
    { name: 'Ashrams', value: 28 },
    { name: 'NGOs', value: 35 },
    { name: 'Slum Colonies', value: 22 },
    { name: 'Low-wage Communities', value: 15 },
  ],
  transportModes: [
    { name: 'Volunteer', value: 55 },
    { name: 'Public', value: 25 },
    { name: 'Private (Paid)', value: 20 },
  ],
  monthlyImpact: [
    { month: 'Nov', meals: 3200, waste: 58 },
    { month: 'Dec', meals: 4100, waste: 62 },
    { month: 'Jan', meals: 3800, waste: 65 },
    { month: 'Feb', meals: 4500, waste: 68 },
    { month: 'Mar', meals: 5200, waste: 70 },
  ]
});

export const isReceiverBlocked = (receiverId) => {
  const receiver = store.receivers.find(r => r.id === receiverId);
  if (!receiver || !receiver.lastReception) return false;
  
  const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 Hours
  const timeSince = Date.now() - new Date(receiver.lastReception).getTime();
  return (timeSince < COOLDOWN_MS);
};

export const updateReceiverReception = (receiverId) => {
  const idx = store.receivers.findIndex(r => r.id === receiverId);
  if (idx !== -1) {
    store.receivers[idx].lastReception = new Date().toISOString();
  }
};
