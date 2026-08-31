import {
  PC,
  PCGroup,
  PCStatus,
  Game,
  Offer,
  LeaderboardEntry,
  SystemSettings,
  Session,
  ActivityLog
} from "../types";

// loungeName is overwritten by the real Store name once it loads (see
// App.tsx) — this is just the pre-load placeholder. The rest of these
// fields have no backend equivalent and stay local-only.
export const initialSettings: SystemSettings = {
  loungeName: "GameCentral Esports Lounge",
  currency: "INR",
  currencySymbol: "₹",
  taxRate: 8.5,
  openingTime: "10:00",
  closingTime: "02:00",
  allowGuests: true,
  autoLockScreen: true
};

export const initialPCs: PC[] = [
  {
    id: "pc-01",
    name: "PC-01 (VIP)",
    group: PCGroup.VIP,
    status: PCStatus.IN_USE,
    ip: "192.168.1.101",
    specs: {
      cpu: "Intel Core i9-14900K",
      gpu: "NVIDIA RTX 4090 24GB",
      ram: "64GB DDR5 6000MHz",
      monitor: "32\" ROG Swift 4K 240Hz OLED"
    },
    currentUser: "Alex Mercer",
    activeSessionId: "sess-101",
    timeRemaining: 5400, // 1h 30m
    totalPlayTimeToday: 320
  },
  {
    id: "pc-02",
    name: "PC-02 (VIP)",
    group: PCGroup.VIP,
    status: PCStatus.IN_USE,
    ip: "192.168.1.102",
    specs: {
      cpu: "Intel Core i9-14900K",
      gpu: "NVIDIA RTX 4090 24GB",
      ram: "64GB DDR5 6000MHz",
      monitor: "32\" ROG Swift 4K 240Hz OLED"
    },
    currentUser: "Sarah Connor",
    activeSessionId: "sess-102",
    timeRemaining: 2100, // 35m
    totalPlayTimeToday: 180
  },
  {
    id: "pc-03",
    name: "PC-03 (VIP)",
    group: PCGroup.VIP,
    status: PCStatus.AVAILABLE,
    ip: "192.168.1.103",
    specs: {
      cpu: "AMD Ryzen 9 7950X3D",
      gpu: "NVIDIA RTX 4080 Super 16GB",
      ram: "32GB DDR5 5600MHz",
      monitor: "27\" ASUS ROG QHD 240Hz OLED"
    },
    totalPlayTimeToday: 420
  },
  {
    id: "pc-04",
    name: "PC-04 (VIP)",
    group: PCGroup.VIP,
    status: PCStatus.MAINTENANCE,
    ip: "192.168.1.104",
    specs: {
      cpu: "AMD Ryzen 9 7950X3D",
      gpu: "NVIDIA RTX 4080 Super 16GB",
      ram: "32GB DDR5 5600MHz",
      monitor: "27\" ASUS ROG QHD 240Hz OLED"
    },
    totalPlayTimeToday: 0
  },
  {
    id: "pc-05",
    name: "PC-05",
    group: PCGroup.STANDARD,
    status: PCStatus.IN_USE,
    ip: "192.168.1.51",
    specs: {
      cpu: "Intel Core i7-13700K",
      gpu: "NVIDIA RTX 4070 12GB",
      ram: "32GB DDR5 5200MHz",
      monitor: "27\" MSI G274QPF QHD 170Hz IPS"
    },
    currentUser: "John Doe",
    activeSessionId: "sess-103",
    timeRemaining: 12000, // 3h 20m
    totalPlayTimeToday: 240
  },
  {
    id: "pc-06",
    name: "PC-06",
    group: PCGroup.STANDARD,
    status: PCStatus.AVAILABLE,
    ip: "192.168.1.52",
    specs: {
      cpu: "Intel Core i7-13700K",
      gpu: "NVIDIA RTX 4070 12GB",
      ram: "32GB DDR5 5200MHz",
      monitor: "27\" MSI G274QPF QHD 170Hz IPS"
    },
    totalPlayTimeToday: 110
  },
  {
    id: "pc-07",
    name: "PC-07",
    group: PCGroup.STANDARD,
    status: PCStatus.AVAILABLE,
    ip: "192.168.1.53",
    specs: {
      cpu: "AMD Ryzen 7 7800X3D",
      gpu: "AMD Radeon RX 7800 XT 16GB",
      ram: "32GB DDR5 5200MHz",
      monitor: "27\" LG UltraGear QHD 144Hz"
    },
    totalPlayTimeToday: 95
  },
  {
    id: "pc-08",
    name: "PC-08",
    group: PCGroup.STANDARD,
    status: PCStatus.OFFLINE,
    ip: "192.168.1.54",
    specs: {
      cpu: "AMD Ryzen 7 7800X3D",
      gpu: "AMD Radeon RX 7800 XT 16GB",
      ram: "32GB DDR5 5200MHz",
      monitor: "27\" LG UltraGear QHD 144Hz"
    },
    totalPlayTimeToday: 150
  },
  {
    id: "pc-09",
    name: "PC-09",
    group: PCGroup.STANDARD,
    status: PCStatus.IN_USE,
    ip: "192.168.1.55",
    specs: {
      cpu: "Intel Core i5-13400F",
      gpu: "NVIDIA RTX 4060 Ti 8GB",
      ram: "16GB DDR5 4800MHz",
      monitor: "24\" BenQ ZOWIE FHD 144Hz TN"
    },
    currentUser: "Elena Rostova",
    activeSessionId: "sess-104",
    timeRemaining: 360, // 6m
    totalPlayTimeToday: 480
  },
  {
    id: "pc-10",
    name: "PC-10",
    group: PCGroup.STANDARD,
    status: PCStatus.AVAILABLE,
    ip: "192.168.1.56",
    specs: {
      cpu: "Intel Core i5-13400F",
      gpu: "NVIDIA RTX 4060 Ti 8GB",
      ram: "16GB DDR5 4800MHz",
      monitor: "24\" BenQ ZOWIE FHD 144Hz TN"
    },
    totalPlayTimeToday: 310
  },
  {
    id: "pc-11",
    name: "Console-01 (PS5)",
    group: PCGroup.CONSOLE,
    status: PCStatus.IN_USE,
    ip: "192.168.1.201",
    specs: {
      cpu: "Custom AMD Zen 2",
      gpu: "Custom RDNA 2 GPU",
      ram: "16GB GDDR6 Unified",
      monitor: "55\" Sony Bravia 4K 120Hz OLED TV"
    },
    currentUser: "Marcus Aurelius",
    activeSessionId: "sess-105",
    timeRemaining: 1800, // 30m
    totalPlayTimeToday: 120
  },
  {
    id: "pc-12",
    name: "Console-02 (Xbox Series X)",
    group: PCGroup.CONSOLE,
    status: PCStatus.AVAILABLE,
    ip: "192.168.1.202",
    specs: {
      cpu: "Custom AMD Zen 2",
      gpu: "Custom RDNA 2 12 TFLOPS",
      ram: "16GB GDDR6 Unified",
      monitor: "55\" Sony Bravia 4K 120Hz OLED TV"
    },
    totalPlayTimeToday: 210
  },
  {
    id: "pc-13",
    name: "Console-03 (Nintendo Switch)",
    group: PCGroup.CONSOLE,
    status: PCStatus.AVAILABLE,
    ip: "192.168.1.203",
    specs: {
      cpu: "NVIDIA Custom Tegra",
      gpu: "NVIDIA Maxwell",
      ram: "4GB LPDDR4",
      monitor: "43\" Samsung Crystal 4K TV"
    },
    totalPlayTimeToday: 45
  },
  {
    id: "pc-14",
    name: "Stream-01 (Booth)",
    group: PCGroup.STREAMING,
    status: PCStatus.IN_USE,
    ip: "192.168.1.151",
    specs: {
      cpu: "AMD Ryzen 9 7900X",
      gpu: "NVIDIA RTX 4070 Ti 12GB",
      ram: "32GB DDR5 5600MHz",
      monitor: "Dual 27\" ASUS ROG 170Hz + Shure SM7B Mic + Logitech Brio 4K"
    },
    currentUser: "Lily Twitcher",
    activeSessionId: "sess-106",
    timeRemaining: 10800, // 3h
    totalPlayTimeToday: 300
  },
  {
    id: "pc-15",
    name: "Stream-02 (Booth)",
    group: PCGroup.STREAMING,
    status: PCStatus.AVAILABLE,
    ip: "192.168.1.152",
    specs: {
      cpu: "AMD Ryzen 9 7900X",
      gpu: "NVIDIA RTX 4070 Ti 12GB",
      ram: "32GB DDR5 5600MHz",
      monitor: "Dual 27\" ASUS ROG 170Hz + Shure SM7B Mic + Logitech Brio 4K"
    },
    totalPlayTimeToday: 120
  },
  {
    id: "pc-16",
    name: "PC-11",
    group: PCGroup.STANDARD,
    status: PCStatus.MAINTENANCE,
    ip: "192.168.1.57",
    specs: {
      cpu: "Intel Core i5-13400F",
      gpu: "NVIDIA RTX 4060 Ti 8GB",
      ram: "16GB DDR5 4800MHz",
      monitor: "24\" BenQ ZOWIE FHD 144Hz TN"
    },
    totalPlayTimeToday: 90
  }
];

export const initialSessions: Session[] = [
  {
    id: "sess-101",
    pcId: "pc-01",
    pcName: "PC-01 (VIP)",
    customerName: "Alex Mercer",
    customerId: "cust-01",
    startTime: "2026-07-18T09:30:00Z",
    durationMinutes: 180,
    remainingSeconds: 5400,
    ratePerHour: 7.00,
    totalCost: 21.00,
    status: "Active",
    paymentStatus: "Paid"
  },
  {
    id: "sess-102",
    pcId: "pc-02",
    pcName: "PC-02 (VIP)",
    customerName: "Sarah Connor",
    customerId: "cust-02",
    startTime: "2026-07-18T10:15:00Z",
    durationMinutes: 60,
    remainingSeconds: 2100,
    ratePerHour: 7.00,
    totalCost: 7.00,
    status: "Active",
    paymentStatus: "Paid"
  },
  {
    id: "sess-103",
    pcId: "pc-05",
    pcName: "PC-05",
    customerName: "John Doe",
    customerId: "cust-03",
    startTime: "2026-07-18T07:45:00Z",
    durationMinutes: 480,
    remainingSeconds: 12000,
    ratePerHour: 4.50,
    totalCost: 36.00,
    status: "Active",
    paymentStatus: "Paid"
  },
  {
    id: "sess-104",
    pcId: "pc-09",
    pcName: "PC-09",
    customerName: "Elena Rostova",
    customerId: "cust-04",
    startTime: "2026-07-18T10:30:00Z",
    durationMinutes: 120,
    remainingSeconds: 360,
    ratePerHour: 4.50,
    totalCost: 9.00,
    status: "Active",
    paymentStatus: "Paid"
  },
  {
    id: "sess-105",
    pcId: "pc-11",
    pcName: "Console-01 (PS5)",
    customerName: "Marcus Aurelius",
    customerId: "cust-05",
    startTime: "2026-07-18T10:00:00Z",
    durationMinutes: 90,
    remainingSeconds: 1800,
    ratePerHour: 3.50,
    totalCost: 5.25,
    status: "Active",
    paymentStatus: "Paid"
  },
  {
    id: "sess-106",
    pcId: "pc-14",
    pcName: "Stream-01 (Booth)",
    customerName: "Lily Twitcher",
    customerId: "cust-06",
    startTime: "2026-07-18T08:00:00Z",
    durationMinutes: 300,
    remainingSeconds: 10800,
    ratePerHour: 8.50,
    totalCost: 42.50,
    status: "Active",
    paymentStatus: "Paid"
  },
  // Historical Completed Sessions
  {
    id: "sess-090",
    pcId: "pc-03",
    pcName: "PC-03 (VIP)",
    customerName: "Alex Mercer",
    customerId: "cust-01",
    startTime: "2026-07-17T18:00:00Z",
    endTime: "2026-07-17T21:00:00Z",
    durationMinutes: 180,
    ratePerHour: 7.00,
    totalCost: 21.00,
    status: "Completed",
    paymentStatus: "Paid"
  },
  {
    id: "sess-091",
    pcId: "pc-06",
    pcName: "PC-06",
    customerName: "Guest_3921",
    startTime: "2026-07-17T19:30:00Z",
    endTime: "2026-07-17T21:30:00Z",
    durationMinutes: 120,
    ratePerHour: 4.50,
    totalCost: 9.00,
    status: "Completed",
    paymentStatus: "Paid"
  },
  {
    id: "sess-092",
    pcId: "pc-12",
    pcName: "Console-02 (Xbox Series X)",
    customerName: "Marcus Aurelius",
    customerId: "cust-05",
    startTime: "2026-07-17T14:00:00Z",
    endTime: "2026-07-17T16:00:00Z",
    durationMinutes: 120,
    ratePerHour: 3.50,
    totalCost: 7.00,
    status: "Completed",
    paymentStatus: "Paid"
  },
  {
    id: "sess-093",
    pcId: "pc-07",
    pcName: "PC-07",
    customerName: "John Doe",
    customerId: "cust-03",
    startTime: "2026-07-17T12:00:00Z",
    endTime: "2026-07-17T14:30:00Z",
    durationMinutes: 150,
    ratePerHour: 4.50,
    totalCost: 11.25,
    status: "Completed",
    paymentStatus: "Paid"
  },
  {
    id: "sess-094",
    pcId: "pc-15",
    pcName: "Stream-02 (Booth)",
    customerName: "Lily Twitcher",
    customerId: "cust-06",
    startTime: "2026-07-17T11:00:00Z",
    endTime: "2026-07-17T14:00:00Z",
    durationMinutes: 180,
    ratePerHour: 8.50,
    totalCost: 25.50,
    status: "Completed",
    paymentStatus: "Paid"
  }
];

export const initialGames: Game[] = [
  {
    id: "game-01",
    title: "Valorant",
    genre: "FPS, Tactical Shooter",
    developer: "Riot Games",
    launchCount: 1245,
    playTimeHours: 1840,
    sizeGB: 42.5,
    imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&auto=format&fit=crop&q=80", // gaming themed placeholder
    status: "Ready"
  },
  {
    id: "game-02",
    title: "League of Legends",
    genre: "MOBA",
    developer: "Riot Games",
    launchCount: 1420,
    playTimeHours: 2450,
    sizeGB: 22.0,
    imageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&auto=format&fit=crop&q=80",
    status: "Ready"
  },
  {
    id: "game-03",
    title: "Counter-Strike 2",
    genre: "FPS, Competitive",
    developer: "Valve",
    launchCount: 1112,
    playTimeHours: 2180,
    sizeGB: 85.0,
    imageUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300&auto=format&fit=crop&q=80",
    status: "Ready"
  },
  {
    id: "game-04",
    title: "Cyberpunk 2077",
    genre: "RPG, Open World",
    developer: "CD Projekt Red",
    launchCount: 428,
    playTimeHours: 980,
    sizeGB: 70.0,
    imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&auto=format&fit=crop&q=80",
    status: "Updating",
    updateProgress: 68
  },
  {
    id: "game-05",
    title: "Dota 2",
    genre: "MOBA",
    developer: "Valve",
    launchCount: 890,
    playTimeHours: 1540,
    sizeGB: 60.0,
    imageUrl: "https://images.unsplash.com/photo-1553481187-be93c21490a9?w=300&auto=format&fit=crop&q=80",
    status: "Ready"
  },
  {
    id: "game-06",
    title: "Minecraft",
    genre: "Sandbox, Adventure",
    developer: "Mojang Studios",
    launchCount: 615,
    playTimeHours: 890,
    sizeGB: 4.0,
    imageUrl: "https://images.unsplash.com/photo-1587573089734-09cb6b9da171?w=300&auto=format&fit=crop&q=80",
    status: "Ready"
  },
  {
    id: "game-07",
    title: "Apex Legends",
    genre: "Battle Royale",
    developer: "Respawn Entertainment",
    launchCount: 780,
    playTimeHours: 1120,
    sizeGB: 75.0,
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80",
    status: "Offline"
  },
  {
    id: "game-08",
    title: "Grand Theft Auto V",
    genre: "Action-Adventure",
    developer: "Rockstar Games",
    launchCount: 520,
    playTimeHours: 920,
    sizeGB: 110.0,
    imageUrl: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=300&auto=format&fit=crop&q=80",
    status: "Ready"
  }
];

export const initialOffers: Offer[] = [
  {
    id: "off-01",
    title: "Midnight Grind Pass",
    description: "Get 6 hours of continuous VIP gameplay from 10:00 PM to 4:00 AM.",
    badge: "SAVES 45%",
    discountType: "Bundle",
    value: "$20.00 Flat Rate",
    code: "MIDNIGHT20",
    imageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&auto=format&fit=crop&q=80",
    status: "Active",
    startDate: "2026-07-01",
    endDate: "2026-08-31"
  },
  {
    id: "off-02",
    title: "New Member Match",
    description: "First time topping up? Double your load value up to $50.00.",
    badge: "100% MATCH",
    discountType: "Percentage",
    value: "Double Deposit Value",
    code: "DOUBLEUP",
    imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=80",
    status: "Active",
    startDate: "2026-01-01",
    endDate: "2026-12-31"
  },
  {
    id: "off-03",
    title: "Console Lounge Weekend Happy Hour",
    description: "Consoles (PS5, Xbox, Switch) are half price from 12:00 PM to 4:00 PM every Saturday and Sunday.",
    badge: "50% OFF CONSOLES",
    discountType: "Percentage",
    value: "50% Off Hourly Rate",
    code: "CONSOLEHAPPY",
    imageUrl: "https://images.unsplash.com/photo-1553481187-be93c21490a9?w=500&auto=format&fit=crop&q=80",
    status: "Active",
    startDate: "2026-06-01",
    endDate: "2026-09-30"
  },
  {
    id: "off-04",
    title: "Pro Streamer Special Bundle",
    description: "Book our Streaming Booth with high-grade audio gear for 4 hours.",
    badge: "30% DISCOUNT",
    discountType: "Bundle",
    value: "$24.00 Flat Rate",
    code: "STREAMPRO",
    imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=80",
    status: "Upcoming",
    startDate: "2026-08-01",
    endDate: "2026-08-31"
  }
];

export const initialLeaderboards: LeaderboardEntry[] = [
  {
    id: "lead-01",
    rank: 1,
    playerName: "Alex Mercer",
    gameTitle: "Valorant",
    statName: "K/D Ratio (Avg)",
    statValue: "1.85 (Radiant #32)",
    reward: "10 Free VIP Hours + Platinum Rank",
    date: "2026-07-18"
  },
  {
    id: "lead-02",
    rank: 2,
    playerName: "Elena Rostova",
    gameTitle: "Counter-Strike 2",
    statName: "Competitive Wins Today",
    statValue: "12 Wins (2840 ELO)",
    reward: "$20 Lounge Credit",
    date: "2026-07-18"
  },
  {
    id: "lead-03",
    rank: 3,
    playerName: "Marcus Aurelius",
    gameTitle: "League of Legends",
    statName: "Creep Score per Min",
    statValue: "9.8 CS/m",
    reward: "$10 Lounge Credit",
    date: "2026-07-18"
  },
  {
    id: "lead-04",
    rank: 4,
    playerName: "Lily Twitcher",
    gameTitle: "Apex Legends",
    statName: "Total Damage in Match",
    statValue: "5,842 Damage",
    reward: "Free Premium Energy Drink",
    date: "2026-07-17"
  },
  {
    id: "lead-05",
    rank: 5,
    playerName: "Sarah Connor",
    gameTitle: "Cyberpunk 2077",
    statName: "Don't Fear the Reaper",
    statValue: "Completed in 11:42",
    reward: "Custom Lounge Keychain",
    date: "2026-07-16"
  }
];

export const initialLogs: ActivityLog[] = [
  {
    id: "log-1",
    timestamp: "2026-07-18T10:30:00Z",
    type: "Session",
    message: "Session sess-104 started for customer Elena Rostova on PC-09",
    operator: "Staff_Michael",
    severity: "success"
  },
  {
    id: "log-2",
    timestamp: "2026-07-18T10:15:00Z",
    type: "Session",
    message: "Session sess-102 started for customer Sarah Connor on PC-02",
    operator: "Staff_Michael",
    severity: "success"
  },
  {
    id: "log-3",
    timestamp: "2026-07-18T10:00:00Z",
    type: "Session",
    message: "Session sess-105 started for customer Marcus Aurelius on PC-11",
    operator: "Staff_Michael",
    severity: "success"
  },
  {
    id: "log-4",
    timestamp: "2026-07-18T09:45:00Z",
    type: "PC",
    message: "PC-04 set to Maintenance status for diagnostic scans",
    operator: "Admin_John",
    severity: "warning"
  },
  {
    id: "log-5",
    timestamp: "2026-07-18T09:30:00Z",
    type: "Session",
    message: "Session sess-101 started for customer Alex Mercer on PC-01",
    operator: "Staff_Michael",
    severity: "success"
  },
  {
    id: "log-6",
    timestamp: "2026-07-18T09:15:00Z",
    type: "Billing",
    message: "Customer Alex Mercer topped up $50.00 lounge credit",
    operator: "Staff_Michael",
    severity: "info"
  },
  {
    id: "log-7",
    timestamp: "2026-07-18T09:00:00Z",
    type: "System",
    message: "Gaming Center System booted successfully, 16 PCs initialized",
    operator: "System_Daemon",
    severity: "info"
  }
];
