"use client";

import { Bell, Wallet, QrCode, Target, TrendingUp, ArrowUpRight, ArrowDownRight, ShieldCheck, Plane, Train, Bus, X, MapPin, Calendar, Users, ArrowRight, CheckCircle2, Clock, IndianRupee, Bot, Gift, Sparkles, Smartphone, ReceiptText, Landmark } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logEvent } from "@/lib/auditLogger";
import VoiceAvatarOverlay from "@/components/advisor/VoiceAvatarOverlay";

interface HomeTabProps {
  unreadCount: number;
  setShowNotifications: (val: boolean) => void;
  setActiveTab: (val: string) => void;
  portfolioData: { name: string; value: number }[];
  onQRScan?: () => void;
  userName?: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const CITIES = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Surat"];
const AIRPORTS: Record<string, string> = {
  "Mumbai": "BOM – Chhatrapati Shivaji",
  "Delhi": "DEL – Indira Gandhi",
  "Bangalore": "BLR – Kempegowda",
  "Hyderabad": "HYD – Rajiv Gandhi",
  "Chennai": "MAA – Chennai Intl",
  "Kolkata": "CCU – Netaji Subhas",
};
const AIRPORT_CITIES = Object.keys(AIRPORTS);

const MOCK_TRAINS = [
  { id: "12951", name: "Rajdhani Express", dep: "16:35", arr: "08:15+1", dur: "15h 40m", avail: { SL: 42, "3A": 12, "2A": 4 }, price: { SL: 785, "3A": 2045, "2A": 2985, "1A": 4820 } },
  { id: "12263", name: "Pune Duronto", dep: "23:15", arr: "16:05+1", dur: "16h 50m", avail: { SL: 18, "3A": 6, "2A": 2 }, price: { SL: 825, "3A": 2125, "2A": 3095, "1A": 5200 } },
  { id: "22221", name: "CSMT Rajdhani", dep: "14:05", arr: "10:45+1", dur: "20h 40m", avail: { SL: 88, "3A": 22, "2A": 8 }, price: { SL: 730, "3A": 1895, "2A": 2780, "1A": 4650 } },
];

const MOCK_BUSES = [
  { id: "b1", operator: "Orange Travels", dep: "21:00", arr: "06:30+1", dur: "9h 30m", type: "Volvo AC Sleeper", price: 850, seats: 12 },
  { id: "b2", operator: "VRL Travels", dep: "22:30", arr: "08:00+1", dur: "9h 30m", type: "Multi-Axle Seater", price: 550, seats: 22 },
  { id: "b3", operator: "SRS Travels", dep: "20:00", arr: "05:30+1", dur: "9h 30m", type: "Bharat Benz AC", price: 720, seats: 6 },
  { id: "b4", operator: "MSRTC Shivneri", dep: "06:00", arr: "15:30", dur: "9h 30m", type: "Semi-Sleeper AC", price: 420, seats: 34 },
];

const MOCK_FLIGHTS = [
  { id: "f1", airline: "IndiGo", flight: "6E 212", dep: "06:00", arr: "08:15", dur: "2h 15m", stops: "Non-stop", price: 4250, logo: "✈" },
  { id: "f2", airline: "Air India", flight: "AI 665", dep: "09:30", arr: "11:50", dur: "2h 20m", stops: "Non-stop", price: 5800, logo: "✈" },
  { id: "f3", airline: "SpiceJet", flight: "SG 117", dep: "14:15", arr: "16:40", dur: "2h 25m", stops: "Non-stop", price: 3990, logo: "✈" },
  { id: "f4", airline: "Vistara", flight: "UK 938", dep: "17:45", arr: "20:10", dur: "2h 25m", stops: "Non-stop", price: 6200, logo: "✈" },
];

function generatePNR() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// ─── Booking Modal ────────────────────────────────────────────────────────────

type BookingType = "train" | "bus" | "flight" | null;

interface BookingConfirmation {
  type: BookingType;
  pnr: string;
  from: string;
  to: string;
  date: string;
  name: string;
  price: number;
}

function BookingModal({ type, onClose }: { type: Exclude<BookingType, null>; onClose: () => void }) {
  const [step, setStep] = useState<"search" | "results" | "confirmed">("search");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [travelClass, setTravelClass] = useState("3A");
  const [passengers, setPassengers] = useState(1);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [errors, setErrors] = useState<string>("");

  const today = new Date().toISOString().split("T")[0];
  const cityList = type === "flight" ? AIRPORT_CITIES : CITIES;

  const handleSearch = () => {
    if (!from || !to || !date) { setErrors("Please fill in all fields."); return; }
    if (from === to) { setErrors("Departure and destination cannot be the same."); return; }
    setErrors("");
    setStep("results");
  };

  const handleBook = (resultId: string, name: string, price: number) => {
    setSelectedResult(resultId);
    const pnr = generatePNR();
    setConfirmation({ type, pnr, from, to, date, name, price });
    setTimeout(() => setStep("confirmed"), 800);
    logEvent("client_user", "client", "BOOKING_CONFIRMED", `${type.toUpperCase()} booking confirmed – PNR: ${pnr}`);
  };

  const config = {
    train: { label: "Train", icon: Train, color: "from-blue-600 to-blue-400", classes: ["SL", "3A", "2A", "1A"] },
    bus: { label: "Bus", icon: Bus, color: "from-green-600 to-green-400", classes: [] },
    flight: { label: "Flight", icon: Plane, color: "from-primary to-cyan-400", classes: ["Economy", "Business", "First"] },
  }[type];

  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-lg sm:mx-4 bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className={`bg-gradient-to-r ${config.color} p-5 text-white shrink-0`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold">Book {config.label}</h2>
                <p className="text-white/80 text-xs font-medium">Fast • Secure • Instant Confirmation</p>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          {step === "results" && (
            <button onClick={() => setStep("search")} className="mt-3 text-xs font-semibold text-white/80 hover:text-white flex items-center gap-1">
              ← Change search
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1">
          {/* ─── STEP: SEARCH ─── */}
          {step === "search" && (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground/60 mb-1.5 uppercase tracking-wider">From</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                    <select value={from} onChange={(e) => setFrom(e.target.value)} className="w-full bg-secondary/40 border border-border rounded-xl pl-9 pr-3 py-3 text-sm font-semibold focus:outline-none focus:border-primary appearance-none">
                      <option value="">Select</option>
                      {cityList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground/60 mb-1.5 uppercase tracking-wider">To</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                    <select value={to} onChange={(e) => setTo(e.target.value)} className="w-full bg-secondary/40 border border-border rounded-xl pl-9 pr-3 py-3 text-sm font-semibold focus:outline-none focus:border-primary appearance-none">
                      <option value="">Select</option>
                      {cityList.filter(c => c !== from).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/60 mb-1.5 uppercase tracking-wider">Date of Travel</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                  <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-secondary/40 border border-border rounded-xl pl-9 pr-3 py-3 text-sm font-semibold focus:outline-none focus:border-primary" />
                </div>
              </div>

              {type === "flight" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground/60 mb-1.5 uppercase tracking-wider">Cabin Class</label>
                    <select value={travelClass} onChange={(e) => setTravelClass(e.target.value)} className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-3 text-sm font-semibold focus:outline-none focus:border-primary">
                      {config.classes.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground/60 mb-1.5 uppercase tracking-wider">Passengers</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setPassengers(Math.max(1, passengers - 1))} className="w-9 h-9 rounded-xl border border-border bg-secondary/50 font-bold text-lg flex items-center justify-center">−</button>
                      <span className="flex-1 text-center font-bold text-sm py-2 bg-secondary/40 border border-border rounded-xl">{passengers}</span>
                      <button onClick={() => setPassengers(Math.min(6, passengers + 1))} className="w-9 h-9 rounded-xl border border-border bg-secondary/50 font-bold text-lg flex items-center justify-center">+</button>
                    </div>
                  </div>
                </div>
              )}

              {type === "train" && (
                <div>
                  <label className="block text-xs font-bold text-foreground/60 mb-1.5 uppercase tracking-wider">Class</label>
                  <div className="grid grid-cols-4 gap-2">
                    {config.classes.map(c => (
                      <button key={c} onClick={() => setTravelClass(c)} className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${travelClass === c ? "bg-primary text-white border-primary" : "bg-secondary/50 border-border hover:border-primary/50"}`}>{c}</button>
                    ))}
                  </div>
                </div>
              )}

              {errors && <p className="text-danger text-sm font-semibold bg-danger/5 border border-danger/20 px-3 py-2 rounded-xl">{errors}</p>}

              <button onClick={handleSearch} className={`w-full py-3.5 rounded-2xl bg-gradient-to-r ${config.color} text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity`}>
                Search {config.label}s <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ─── STEP: RESULTS ─── */}
          {step === "results" && (
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70 bg-secondary/40 rounded-xl px-3 py-2.5">
                <span className="font-bold text-foreground">{from}</span>
                <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="font-bold text-foreground">{to}</span>
                <span className="ml-auto text-xs">{new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
              </div>

              {type === "train" && MOCK_TRAINS.map(t => (
                <div key={t.id} className="border border-border rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-extrabold text-sm">{t.name}</p>
                      <p className="text-xs text-foreground/50 font-medium">#{t.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-primary text-sm">₹{t.price[travelClass as keyof typeof t.price]}</p>
                      <p className="text-xs text-foreground/50">{travelClass}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold text-sm">{t.dep}</span>
                    <div className="flex-1 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      <div className="flex-1 h-px bg-border" />
                      <Clock className="w-3 h-3 text-foreground/40 shrink-0" />
                      <span className="text-[10px] text-foreground/50 font-medium shrink-0">{t.dur}</span>
                      <div className="flex-1 h-px bg-border" />
                      <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
                    </div>
                    <span className="font-bold text-sm">{t.arr}</span>
                  </div>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {Object.entries(t.avail).map(([cls, cnt]) => (
                      <span key={cls} className="text-[10px] bg-success/10 text-success border border-success/20 px-2 py-0.5 rounded-md font-bold">{cls}: {cnt} avail</span>
                    ))}
                  </div>
                  <button onClick={() => handleBook(t.id, t.name, t.price[travelClass as keyof typeof t.price])} className="w-full py-2.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold text-sm transition-all border border-primary/20 hover:border-primary">
                    Book Now – ₹{t.price[travelClass as keyof typeof t.price]}
                  </button>
                </div>
              ))}

              {type === "bus" && MOCK_BUSES.map(b => (
                <div key={b.id} className="border border-border rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-extrabold text-sm">{b.operator}</p>
                      <p className="text-xs text-foreground/50 font-medium">{b.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-green-600 text-sm">₹{b.price}</p>
                      <p className="text-[10px] text-success font-bold">{b.seats} seats left</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold text-sm">{b.dep}</span>
                    <div className="flex-1 flex items-center gap-1">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[10px] text-foreground/50 font-medium shrink-0">{b.dur}</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <span className="font-bold text-sm">{b.arr}</span>
                  </div>
                  <button onClick={() => handleBook(b.id, b.operator, b.price)} className="w-full py-2.5 rounded-xl bg-green-50 hover:bg-green-500 text-green-600 hover:text-white font-bold text-sm transition-all border border-green-200 hover:border-green-500">
                    Select Seat – ₹{b.price}
                  </button>
                </div>
              ))}

              {type === "flight" && MOCK_FLIGHTS.map(f => (
                <div key={f.id} className="border border-border rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-extrabold text-sm">{f.airline}</p>
                      <p className="text-xs text-foreground/50 font-medium">{f.flight} · {f.stops}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-primary text-sm">₹{(f.price * passengers).toLocaleString("en-IN")}</p>
                      {passengers > 1 && <p className="text-[10px] text-foreground/50">₹{f.price.toLocaleString("en-IN")} × {passengers}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-center">
                      <p className="font-extrabold text-sm">{f.dep}</p>
                      <p className="text-[10px] text-foreground/50">{from}</p>
                    </div>
                    <div className="flex-1 flex items-center gap-1">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[10px] text-foreground/50 font-medium shrink-0">{f.dur}</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="text-center">
                      <p className="font-extrabold text-sm">{f.arr}</p>
                      <p className="text-[10px] text-foreground/50">{to}</p>
                    </div>
                  </div>
                  <button onClick={() => handleBook(f.id, `${f.airline} ${f.flight}`, f.price * passengers)} className="w-full mt-3 py-2.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold text-sm transition-all border border-primary/20 hover:border-primary">
                    Book Flight – ₹{(f.price * passengers).toLocaleString("en-IN")}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ─── STEP: CONFIRMED ─── */}
          {step === "confirmed" && confirmation && (
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-4 mt-2">
                <CheckCircle2 className="w-10 h-10 text-success" />
              </div>
              <h3 className="text-2xl font-extrabold mb-1">Booking Confirmed!</h3>
              <p className="text-foreground/60 text-sm mb-6">Your {config.label.toLowerCase()} ticket has been booked and payment is processed.</p>

              <div className="w-full bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-2xl p-5 mb-6 text-left space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">PNR / Reference</span>
                  <span className="font-extrabold text-primary tracking-widest">{confirmation.pnr}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Route</span>
                  <span className="font-bold text-sm">{confirmation.from} → {confirmation.to}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Date</span>
                  <span className="font-bold text-sm">{new Date(confirmation.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Service</span>
                  <span className="font-bold text-sm">{confirmation.name}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Amount Paid</span>
                  <span className="font-extrabold text-success text-lg">₹{confirmation.price.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="w-full bg-warning/10 border border-warning/30 rounded-xl px-4 py-3 text-xs text-warning font-semibold mb-6">
                📧 Confirmation sent to your registered email. Check IDBI bank statement for debit.
              </div>

              <button onClick={onClose} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold shadow-lg hover:opacity-90 transition-opacity">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── HomeTab Component ────────────────────────────────────────────────────────

export default function HomeTab({ unreadCount, setShowNotifications, setActiveTab, portfolioData, onQRScan, userName }: HomeTabProps) {
  const router = useRouter();
  const [bookingType, setBookingType] = useState<BookingType>(null);
  const [showAvatar, setShowAvatar] = useState(false);
  const [operator, setOperator] = useState("Jio");
  const [mobileNumber, setMobileNumber] = useState("9876543210");
  const [rechargeAmount, setRechargeAmount] = useState("399");
  const [rechargeMessage, setRechargeMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const handleTileClick = (title: string) => {
    setToastMessage(`${title} services will be available in the next update.`);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleNotificationClick = () => {
    setShowNotifications(true);
    setRechargeMessage("IDBI Innovate alert: Your EMI payment is due tomorrow.");
    logEvent("client_user", "client", "NOTIFICATION_ALARM", "User viewed in-app alert for scheduled EMI payment");
  };

  const bookingServices = [
    { name: "Flights", icon: Plane, type: "flight" as BookingType, color: "text-primary", bg: "bg-primary/10 hover:bg-primary/20", shadow: "shadow-primary/10" },
    { name: "Trains",  icon: Train, type: "train"  as BookingType, color: "text-blue-600", bg: "bg-blue-50 hover:bg-blue-100",   shadow: "shadow-blue-100"   },
    { name: "Buses",   icon: Bus,   type: "bus"    as BookingType, color: "text-green-600", bg: "bg-green-50 hover:bg-green-100", shadow: "shadow-green-100" },
  ];

  const lifestyleServices = [
    { title: "Travel & Bookings", icon: Plane, accent: "text-primary" },
    { title: "Lifestyle Offers", icon: Gift, accent: "text-accent" },
    { title: "Family Wallet", icon: Users, accent: "text-success" },
  ];

  const rechargeTiles = [
    { title: "Electricity", icon: ReceiptText, accent: "text-amber-600" },
    { title: "DTH", icon: Smartphone, accent: "text-violet-600" },
    { title: "Gas", icon: Sparkles, accent: "text-emerald-600" },
  ];

  const financialTiles = [
    { title: "Loans", icon: Landmark, accent: "text-primary" },
    { title: "Insurance", icon: ShieldCheck, accent: "text-accent" },
    { title: "Investments", icon: TrendingUp, accent: "text-success" },
  ];

  const promoOffers = [
    { title: "Flat ₹100 off", desc: "On your next utility bill", badge: "New" },
    { title: "2x reward points", desc: "On mobile recharges above ₹399", badge: "Hot" },
  ];

  const handleQuickRecharge = () => {
    if (!mobileNumber || !rechargeAmount) {
      setRechargeMessage("Please enter your mobile number and recharge amount.");
      return;
    }
    setRechargeMessage(`Recharge of ₹${rechargeAmount} for ${mobileNumber} on ${operator} is queued successfully.`);
    logEvent("client_user", "client", "MOBILE_RECHARGE_INITIATED", `Recharge for ${mobileNumber} on ${operator}`);
  };

  const handleQuickAction = (tab: string, href: string) => {
    setActiveTab(tab);
    router.push(href);
  };

  return (
    <>
      {showAvatar && <VoiceAvatarOverlay onClose={() => setShowAvatar(false)} />}
      {/* Booking Modal */}
      {bookingType && (
        <BookingModal type={bookingType} onClose={() => setBookingType(null)} />
      )}

      {/* Toast Message */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg whitespace-nowrap"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 sm:p-6 space-y-5 pb-32 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Good Morning, {userName || "Friend"} 👋</h1>
            <p className="text-sm text-foreground/60 font-medium">Your wealth is growing steadily.</p>
          </div>
          <button
            onClick={handleNotificationClick}
            className="relative w-12 h-12 bg-white border border-border rounded-full flex items-center justify-center shadow-lg hover:bg-secondary/50 transition-colors group"
          >
            <Bell className="w-5 h-5 text-primary group-hover:animate-ping" />
            {unreadCount > 0 && <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-accent rounded-full border-2 border-background animate-pulse" />}
          </button>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-primary to-accent rounded-3xl p-6 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-white/80 text-sm font-semibold mb-1 uppercase tracking-wider">Total Balance</p>
              <h2 className="text-4xl font-extrabold tracking-tight">₹4,28,500</h2>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1 border border-white/20">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-bold">+12.5%</span>
            </div>
          </div>
          <div className="flex gap-6 mt-8 relative z-10">
            <div>
              <p className="text-white/70 text-xs mb-1 font-semibold uppercase">Monthly Income</p>
              <p className="font-bold flex items-center gap-1"><ArrowUpRight className="w-4 h-4 text-emerald-300" /> ₹85,000</p>
            </div>
            <div>
              <p className="text-white/70 text-xs mb-1 font-semibold uppercase">Monthly Expenses</p>
              <p className="font-bold flex items-center gap-1"><ArrowDownRight className="w-4 h-4 text-rose-300" /> ₹32,400</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { name: "Invest", icon: TrendingUp, href: "/dashboard/investments", tab: "invest", color: "text-primary" },
            { name: "Save",   icon: Wallet,     href: "/dashboard/spending",    tab: "spending", color: "text-primary" },
            { name: "Goal",   icon: Target,     href: "/dashboard/goals",       tab: "goals", color: "text-primary" },
          ].map((a) => (
            <button key={a.name} onClick={() => handleQuickAction(a.tab, a.href)} className="flex flex-col items-center gap-2 group">
              <div className="w-14 h-14 bg-white border border-border rounded-2xl flex items-center justify-center group-hover:bg-primary/5 group-hover:scale-110 transition-all shadow-sm active:scale-95 duration-200">
                <a.icon className={`w-6 h-6 ${a.color} group-hover:scale-110 transition-transform`} />
              </div>
              <span className="text-xs font-bold text-foreground/80">{a.name}</span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {bookingServices.map((b) => {
              const BIcon = b.icon;
              return (
                <button
                  key={b.name}
                  onClick={() => setBookingType(b.type)}
                  className={`${b.bg} border border-border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all shadow-sm active:scale-95 hover:scale-105 hover:shadow-md duration-200`}
                >
                  <div className={`w-11 h-11 rounded-full ${b.bg} flex items-center justify-center shadow-sm ${b.shadow}`}>
                    <BIcon className={`w-5 h-5 ${b.color}`} />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/80">{b.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-border rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">Lifestyle & Bookings</h3>
              <p className="text-xs text-foreground/60">Travel, entertainment, and family essentials</p>
            </div>
            <div className="text-[11px] px-2.5 py-1 rounded-full bg-accent/10 text-accent font-semibold">Discover</div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {lifestyleServices.map((service) => {
              const Icon = service.icon;
              return (
                <button key={service.title} onClick={() => handleTileClick(service.title)} className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/20 px-3 py-3 hover:bg-secondary/40 transition-colors text-left w-full">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0">
                    <Icon className={`w-4 h-4 ${service.accent}`} />
                  </div>
                  <span className="text-sm font-semibold">{service.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recharge & Bills + Financial Services */}
        <div className="bg-white border border-border rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">Recharge & Bills</h3>
              <p className="text-xs text-foreground/60">Fast payments for India-first mobile services</p>
            </div>
            <div className="text-[11px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold">Pay in Your Style</div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-border bg-secondary/20 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Smartphone className="w-4 h-4 text-primary" />
                Mobile recharge
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <select value={operator} onChange={(e) => setOperator(e.target.value)} className="rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium">
                  <option value="Jio">Jio</option>
                  <option value="Airtel">Airtel</option>
                  <option value="Vi">Vi</option>
                  <option value="BSNL">BSNL</option>
                </select>
                <input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className="rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium" placeholder="Mobile number" />
              </div>
              <input type="number" value={rechargeAmount} onChange={(e) => setRechargeAmount(e.target.value)} className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium" placeholder="Amount" />
              <button onClick={handleQuickRecharge} className="w-full rounded-xl bg-gradient-to-r from-primary to-accent px-3 py-2.5 text-sm font-semibold text-white">Pay ₹{rechargeAmount || "0"}</button>
              {rechargeMessage && <p className="text-xs text-success font-medium">{rechargeMessage}</p>}
            </div>

            <div className="space-y-2">
              {rechargeTiles.map((tile) => {
                const Icon = tile.icon;
                return (
                  <button key={tile.title} onClick={() => handleTileClick(tile.title)} className="w-full flex items-center justify-between rounded-2xl border border-border bg-white px-3 py-3 shadow-sm hover:bg-secondary/20 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center">
                        <Icon className={`w-4 h-4 ${tile.accent}`} />
                      </div>
                      <span className="text-sm font-semibold">{tile.title}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-foreground/40" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="bg-white border border-border rounded-3xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Financial Services</h3>
              <span className="text-[11px] px-2 py-1 rounded-full bg-accent/10 text-accent font-semibold">Smart</span>
            </div>
            <div className="grid gap-2">
              {financialTiles.map((tile) => {
                const Icon = tile.icon;
                return (
                  <button key={tile.title} onClick={() => handleTileClick(tile.title)} className="w-full flex items-center justify-between rounded-2xl border border-border px-3 py-3 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center">
                        <Icon className={`w-4 h-4 ${tile.accent}`} />
                      </div>
                      <span className="text-sm font-semibold">{tile.title}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-foreground/40" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-border rounded-3xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Promoted Services</h3>
              <span className="text-[11px] px-2 py-1 rounded-full bg-warning/10 text-warning font-semibold">Coupons</span>
            </div>
            <div className="space-y-2">
              {promoOffers.map((offer) => (
                <button key={offer.title} onClick={() => handleTileClick(offer.title)} className="w-full rounded-2xl border border-border p-3 flex items-start justify-between gap-3 hover:bg-secondary/20 transition-colors text-left">
                  <div>
                    <p className="text-sm font-semibold">{offer.title}</p>
                    <p className="text-xs text-foreground/60">{offer.desc}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary shrink-0">{offer.badge}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 p-4 shadow-sm">
          <button onClick={() => setShowAvatar(true)} className="flex w-full items-center justify-between rounded-2xl border border-primary/20 bg-white/80 px-4 py-3 text-left hover:bg-white transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">AI Assistant</p>
                <p className="text-xs text-foreground/60">Ask for budgeting, savings, or card help</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-primary shrink-0" />
          </button>
        </div>

        {/* Portfolio Chart */}
        <div className="bg-white border border-border rounded-3xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Portfolio Growth</h3>
            <span className="text-xs text-primary font-bold bg-primary/10 px-2 py-1 rounded-md">This Week</span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioData}>
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0d9488" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid rgba(15,23,42,0.1)", borderRadius: "8px", fontWeight: "bold" }} itemStyle={{ color: "#0f172a" }} />
                <Area type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#cg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Wealth Score & Security */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-border rounded-3xl p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-lg">
            <div className="absolute inset-0 bg-success/5" />
            <svg className="w-20 h-20 transform -rotate-90">
              <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-secondary" />
              <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="226" strokeDashoffset="45" className="text-success drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-foreground">85</span>
            </div>
            <span className="text-xs font-bold text-foreground/60 mt-2">Wealth Score</span>
          </div>
          <div className="bg-white border border-border rounded-3xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-16 h-16 bg-primary/10 blur-xl" />
            <ShieldCheck className="w-8 h-8 text-primary mb-2" />
            <div>
              <h3 className="font-bold text-sm">Protected</h3>
              <p className="text-[10px] text-foreground/50 font-semibold uppercase mt-1">256-bit encryption active</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
