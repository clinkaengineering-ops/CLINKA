export type Engineer = {
  id: string;
  name: string;
  title: string;
  location: string;
  rating: number;
  reviews: number;
  hourly: number;
  verified: boolean;
  topRated?: boolean;
  skills: string[];
  completed: number;
  bio: string;
  available: "now" | "soon" | "busy";
};

export const engineers: Engineer[] = [
  { id: "e1", name: "Layla Hassan", title: "Senior Structural Engineer", location: "Cairo, EG", rating: 4.9, reviews: 127, hourly: 75, verified: true, topRated: true, skills: ["ETABS", "SAP2000", "Concrete Design", "Seismic"], completed: 64, bio: "PE-licensed structural engineer with 12+ years on high-rise & infrastructure.", available: "now" },
  { id: "e2", name: "Marcus Chen", title: "BIM Coordinator / Revit Specialist", location: "Singapore", rating: 4.8, reviews: 89, hourly: 65, verified: true, skills: ["Revit", "Navisworks", "Dynamo", "ISO 19650"], completed: 41, bio: "BIM Manager driving ISO 19650 workflows for international consultancies.", available: "now" },
  { id: "e3", name: "Sofia Rinaldi", title: "Architect & Urban Designer", location: "Milan, IT", rating: 5.0, reviews: 54, hourly: 90, verified: true, topRated: true, skills: ["Rhino", "Grasshopper", "Sustainability", "LEED"], completed: 32, bio: "RIBA-chartered architect specializing in adaptive reuse and parametric design.", available: "soon" },
  { id: "e4", name: "Ahmed Al-Farsi", title: "MEP Engineer (HVAC + Electrical)", location: "Dubai, AE", rating: 4.7, reviews: 102, hourly: 60, verified: true, skills: ["Revit MEP", "AutoCAD", "Energy Modeling", "ASHRAE"], completed: 78, bio: "ASHRAE member with hospitality, healthcare and data center expertise.", available: "now" },
  { id: "e5", name: "Priya Sharma", title: "Civil & Transportation Engineer", location: "Bengaluru, IN", rating: 4.9, reviews: 76, hourly: 55, verified: true, skills: ["Civil 3D", "MX Roads", "Drainage", "Pavement"], completed: 51, bio: "Highway and transit engineer with experience across South Asia and the Gulf.", available: "now" },
  { id: "e6", name: "Daniel Okafor", title: "Project Manager / Cost Estimator", location: "Lagos, NG", rating: 4.6, reviews: 38, hourly: 70, verified: true, skills: ["Primavera P6", "MS Project", "QS", "Tendering"], completed: 27, bio: "PMP-certified construction PM. Track record on EPC and design-build projects.", available: "busy" },
  { id: "e7", name: "Elena Volkov", title: "Geotechnical Engineer", location: "Berlin, DE", rating: 4.9, reviews: 61, hourly: 80, verified: true, topRated: true, skills: ["PLAXIS", "Soil Mechanics", "Foundations", "Tunneling"], completed: 44, bio: "Specialist in deep foundations, retaining structures and ground improvement.", available: "now" },
  { id: "e8", name: "Carlos Mendes", title: "Contractor / Site Supervisor", location: "São Paulo, BR", rating: 4.7, reviews: 144, hourly: 45, verified: true, skills: ["Concrete", "Steel Erection", "Safety", "Scheduling"], completed: 96, bio: "General contractor leading commercial fit-outs and mid-rise developments.", available: "soon" },
];

export type Project = {
  id: string;
  title: string;
  category: string;
  budget: string;
  timeline: string;
  bids: number;
  posted: string;
  client: string;
  clientRating: number;
  description: string;
  skills: string[];
  featured?: boolean;
};

export const projects: Project[] = [
  { id: "p1", title: "12-Story Mixed-Use Tower — Structural Design", category: "Structural", budget: "$18,000 – $25,000", timeline: "10 weeks", bids: 14, posted: "2h ago", client: "Meridian Developments", clientRating: 4.9, description: "Complete structural design package including foundations, frame, and seismic analysis for a downtown mixed-use tower.", skills: ["ETABS", "Concrete", "Seismic", "Foundations"], featured: true },
  { id: "p2", title: "Hospital Wing — Full MEP BIM Coordination", category: "MEP / BIM", budget: "$32,000 fixed", timeline: "16 weeks", bids: 22, posted: "5h ago", client: "St. Vincent Healthcare", clientRating: 4.8, description: "Multi-discipline BIM coordination LOD 350, clash detection and 4D scheduling.", skills: ["Revit MEP", "Navisworks", "ISO 19650", "Healthcare"] },
  { id: "p3", title: "Boutique Hotel — Architectural Concept & DD", category: "Architecture", budget: "$8,000 – $14,000", timeline: "6 weeks", bids: 9, posted: "1d ago", client: "Aurora Hospitality Group", clientRating: 5.0, description: "Concept through design development for a 48-key boutique hotel with rooftop pool and F&B.", skills: ["Rhino", "Sustainability", "Hospitality", "DD Drawings"] },
  { id: "p4", title: "Residential Subdivision — Civil Site & Drainage", category: "Civil", budget: "$11,000 – $16,000", timeline: "8 weeks", bids: 17, posted: "1d ago", client: "Greenfield Estates", clientRating: 4.6, description: "Site grading, stormwater management, and utility design for 96-lot subdivision.", skills: ["Civil 3D", "Stormwater", "Grading", "Utilities"] },
  { id: "p5", title: "Steel Industrial Warehouse — Pre-Engineered Building", category: "Structural", budget: "$6,500 fixed", timeline: "4 weeks", bids: 11, posted: "2d ago", client: "NorthLogix Logistics", clientRating: 4.7, description: "Design and detailing for a 12,000 m² PEB warehouse including crane loads.", skills: ["STAAD", "Steel", "PEB", "Detailing"], featured: true },
  { id: "p6", title: "Geotechnical Investigation — Highway Bridge", category: "Geotechnical", budget: "$22,000 – $30,000", timeline: "12 weeks", bids: 6, posted: "3d ago", client: "DOT Region 4", clientRating: 4.9, description: "Subsurface investigation, lab testing, and foundation recommendations for a 320 m highway bridge.", skills: ["Geotech", "PLAXIS", "Bridges", "Reporting"] },
];

export const messages = [
  { id: "m1", name: "Layla Hassan", preview: "Uploaded the latest column schedule — please review.", time: "2m", unread: 2, online: true },
  { id: "m2", name: "Meridian Developments", preview: "Milestone 2 has been approved. Funds released.", time: "1h", unread: 0, online: false },
  { id: "m3", name: "Marcus Chen", preview: "Federated model is ready for clash review.", time: "3h", unread: 1, online: true },
  { id: "m4", name: "Sofia Rinaldi", preview: "Sharing the updated DD set v3.", time: "Yesterday", unread: 0, online: false },
  { id: "m5", name: "Ahmed Al-Farsi", preview: "Energy model results look promising 🚀", time: "2d", unread: 0, online: true },
];

export const notifications = [
  { id: "n1", title: "New bid on “12-Story Mixed-Use Tower”", time: "5 min ago", type: "bid" },
  { id: "n2", title: "Milestone 2 funds released to Layla Hassan", time: "1 hour ago", type: "payment" },
  { id: "n3", title: "Engineering syndicate license verified", time: "Today", type: "verify" },
  { id: "n4", title: "Marcus Chen sent you a file", time: "Yesterday", type: "msg" },
];
