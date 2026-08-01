import { useState, useEffect } from 'react';
import {
  Menu, PanelLeft, Search, Calendar as CalendarIcon, Plus, Check, AlertTriangle, X,
  ChevronLeft, ChevronRight, Sparkles, FileText, Lock, Mail, Eye, EyeOff,
  ClipboardList, DollarSign, ChevronDown, TrendingUp, TrendingDown, ExternalLink
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const C = {
  bg: '#FAFAFA',
  card: '#FFFFFF',
  border: '#EBEBEB',
  text: '#222222',
  muted: '#717171',
  accent: '#FF5A5F',
  accentSoft: '#FFF1F1',
  teal: '#00A699',
  tealSoft: '#E6F7F6',
  amber: '#B8860B',
  amberSoft: '#FFF8E6',
};

const PALETTE = ['#FF5A5F', '#00A699', '#B8860B', '#6C5CE7', '#0EA5E9', '#E5533D'];
const THEME_COLORS = ['#111111', '#FF5A5F', '#00A699', '#B8860B', '#6C5CE7', '#0EA5E9', '#E5533D', '#22C55E', '#F97316', '#EC4899', '#64748B'];
const KAYLA_BRAND = '#16A34A';
const KAYLA_LOGIN = '#111111';
const INITIAL_PROPERTIES = [{
  id: 'asare',
  name: 'Asare House',
  color: '#111111',
  rooms: ['Master Bedroom', 'Guest Bedroom'],
  facilities: ['WiFi', 'Air Conditioning', 'Kitchen', 'Parking'],
  currencies: ['GHS', 'EUR'],
  allocation: {
    GHS: { owners: 60, operations: 15, management: 25 },
    EUR: { owners: 60, operations: 15, management: 25 },
  },
  prevBalance: {
    GHS: { owners: 9374.21, management: 4200 },
    EUR: { owners: 0, management: 0 },
  },
}];

const INITIAL_TEAM = [
  { name: 'Collins', role: 'Caretaker' },
  { name: 'Cynthia', role: 'Cleaner' },
  { name: 'Sandra', role: 'Cleaner' },
  { name: 'Cecilia', role: 'Property Manager' },
];
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'issues', label: 'Issues & Schedules' },
  { key: 'team', label: 'Team' },
  { key: 'financials', label: 'Financials' },
];

const INITIAL_BOOKINGS = [
  { id: 1, propertyId: 'asare', guest: 'Michael K.', checkIn: '2026-07-09', checkOut: '2026-07-11', amount: 138.38, currency: 'EUR', source: 'airbnb', status: 'confirmed' },
  { id: 2, propertyId: 'asare', guest: 'Ama T.', checkIn: '2026-07-14', checkOut: '2026-07-16', amount: 900, currency: 'GHS', source: 'local', status: 'expected' },
  { id: 3, propertyId: 'asare', guest: 'Sofia R.', checkIn: '2026-07-20', checkOut: '2026-07-22', amount: 310.50, currency: 'EUR', source: 'airbnb', status: 'confirmed' },
  { id: 4, propertyId: 'asare', guest: 'Daniel O.', checkIn: '2026-07-27', checkOut: '2026-07-30', amount: 275, currency: 'EUR', source: 'airbnb', status: 'expected' },
];

const INITIAL_EXPENSES = [
  { id: 1, propertyId: 'asare', date: '2026-07-02', description: 'ECG', amount: 300, currency: 'GHS', category: 'operations', person: null },
  { id: 2, propertyId: 'asare', date: '2026-07-04', description: 'Internet', amount: 493.54, currency: 'GHS', category: 'operations', person: null },
  { id: 3, propertyId: 'asare', date: '2026-07-06', description: 'Water', amount: 210, currency: 'GHS', category: 'operations', person: null },
  { id: 4, propertyId: 'asare', date: '2026-07-01', description: 'Ironing board', amount: 700, currency: 'GHS', category: 'owners', person: null },
  { id: 5, propertyId: 'asare', date: '2026-07-01', description: 'Caretaker duties', amount: 1200, currency: 'GHS', category: 'oak_co', person: 'Collins' },
  { id: 6, propertyId: 'asare', date: '2026-07-05', description: 'Cleaning — turnover', amount: 350, currency: 'GHS', category: 'oak_co', person: 'Cynthia' },
  { id: 7, propertyId: 'asare', date: '2026-07-03', description: 'Cleaning — turnover', amount: 300, currency: 'GHS', category: 'oak_co', person: 'Sandra' },
  { id: 8, propertyId: 'asare', date: '2026-07-01', description: 'Property management', amount: 800, currency: 'GHS', category: 'oak_co', person: 'Cecilia' },
];

const INITIAL_SHIFTS = [
  { id: 1, propertyId: 'asare', type: 'Cleaning', date: '2026-07-11', assignedTo: 'Sandra', note: 'Turnover for Michael K.' },
  { id: 2, propertyId: 'asare', type: 'Cleaning', date: '2026-07-21', assignedTo: 'Cynthia', note: 'Turnover for Sofia R.' },
  { id: 3, propertyId: 'asare', type: 'Cleaning', date: '2026-07-16', assignedTo: 'Sandra', note: 'Turnover for Ama T.' },
];

const INITIAL_ISSUES = [
  { id: 1, propertyId: 'asare', date: '2026-07-10', type: 'Guest Complaint', description: 'Michael K. said the shower had low water pressure.', guest: 'Michael K.', status: 'Open', statusHistory: [{ status: 'Open', at: '2026-07-10 09:14' }] },
];

const CATEGORY_LABEL = { owners: 'Owners', operations: 'Operations', oak_co: 'Oak & Co.' };
const CATEGORY_TONE = { owners: 'accent', operations: 'teal', oak_co: 'amber' };
const SHIFT_TYPES = ['Cleaning', 'Repair', 'Supervision', 'Training'];
const ISSUE_TYPES = ['Guest Complaint', 'Maintenance', 'Note'];

const OWNERS_ALLOCATION = 900;
const OPERATIONS_ALLOCATION = 225;
const OAKCO_ALLOCATION = 375;
const OWNER_PREVIOUS_BALANCE = 9374.21;
const OAKCO_PREVIOUS_BALANCE = 4200;

const MONTHS = ['June 2026', 'July 2026', 'August 2026'];
const MONTH_PREFIXES = ['2026-06', '2026-07', '2026-08'];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function fmtGHS(n) { return `GH₵${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtEUR(n) { return `€${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtAmt(b) { return b.currency === 'EUR' ? fmtEUR(b.amount) : fmtGHS(b.amount); }
function dayOfMonth(dateStr) { return new Date(dateStr + 'T00:00:00').getDate(); }
function bookingCoversDay(b, day) { const s = dayOfMonth(b.checkIn), e = dayOfMonth(b.checkOut); return day >= s && day < e; }
function categoryTotal(expenses, cat) { return expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount * 1.01, 0); }
function pad2(d) { return String(d).padStart(2, '0'); }
function propColor(properties, propertyId) { return properties.find(p => p.id === propertyId)?.color || 'var(--accent, #111111)'; }
function withAlpha(hex, alpha) {
  if (!hex || hex[0] !== '#') return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`;
const FONT_FAMILY = "'Plus Jakarta Sans', -apple-system, sans-serif";

function Card({ children, style, className = '' }) {
  return <div className={`rounded-2xl p-5 ${className}`} style={{ background: C.card, border: `1px solid ${C.border}`, ...style }}>{children}</div>;
}
function Pill({ children, tone = 'muted' }) {
  const tones = { muted: { bg: '#F2F2F2', color: C.muted }, accent: { bg: 'var(--accent-soft, rgba(0,0,0,0.07))', color: 'var(--accent, #111111)' }, teal: { bg: C.tealSoft, color: C.teal }, amber: { bg: C.amberSoft, color: C.amber } };
  const t = tones[tone];
  return <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: t.bg, color: t.color }}>{children}</span>;
}
function SmallBtn({ children, onClick, tone = 'dark' }) {
  const styles = tone === 'dark' ? { background: C.text, color: '#fff' } : { background: C.bg, color: C.text, border: `1px solid ${C.border}` };
  return <button onClick={onClick} className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5" style={styles}>{children}</button>;
}
function LoadingScreen() {
  const [showTagline, setShowTagline] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShowTagline(true), 2000); return () => clearTimeout(t); }, []);
  return (
    <div className="w-full flex flex-col items-center justify-center" style={{ minHeight: '100vh' }}>
      <p className="text-2xl font-bold tracking-tight" style={{ color: C.text, animation: 'fadeIn 1s ease' }}>MNGO</p>
      <p className="text-xs font-medium mt-1" style={{ color: C.muted, opacity: showTagline ? 1 : 0, transition: 'opacity 2s ease' }}>Booking tracking, reporting and owner insights</p>
    </div>
  );
}

function PropertyForm({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const handleSubmit = () => { if (!name.trim()) return; onAdd(name.trim()); onClose(); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#fff' }}>
        <div className="flex items-center justify-between mb-5"><p className="text-lg font-bold" style={{ color: C.text }}>Add property</p><button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button></div>
        <label className="text-xs font-semibold" style={{ color: C.muted }}>Property name</label>
        <input value={name} onChange={e => setName(e.target.value)} autoFocus className="w-full mt-1 mb-4 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} placeholder="e.g. Osu Loft" />
        <button onClick={handleSubmit} disabled={!name.trim()} className="w-full text-sm font-semibold py-3 rounded-xl" style={{ background: name.trim() ? 'var(--accent, #111111)' : C.border, color: name.trim() ? '#fff' : C.muted }}>Add property</button>
      </div>
    </div>
  );
}

function PropertyProfileModal({ property, onUpdate, onClose }) {
  const [roomInput, setRoomInput] = useState('');
  const [facilityInput, setFacilityInput] = useState('');
  const [pendingColor, setPendingColor] = useState(property.color);
  const [justSaved, setJustSaved] = useState(false);

  const currencies = property.currencies || ['GHS'];
  const allocation = property.allocation || { GHS: { owners: 60, operations: 15, management: 25 } };

  const toggleCurrency = (cur) => {
    const next = currencies.includes(cur) ? currencies.filter(c => c !== cur) : [...currencies, cur];
    if (next.length === 0) return; // must have at least one
    const nextAlloc = { ...allocation };
    if (!nextAlloc[cur]) nextAlloc[cur] = { owners: 60, operations: 15, management: 25 };
    onUpdate({ ...property, currencies: next, allocation: nextAlloc });
  };

  const updateAlloc = (cur, field, val) => {
    const parsed = Math.max(0, Math.min(100, Number(val) || 0));
    const current = { ...(allocation[cur] || { owners: 60, operations: 15, management: 25 }), [field]: parsed };
    onUpdate({ ...property, allocation: { ...allocation, [cur]: current } });
  };

  const allocTotal = (cur) => {
    const a = allocation[cur] || {};
    return (a.owners || 0) + (a.operations || 0) + (a.management || 0);
  };

  const addRoom = () => { if (!roomInput.trim()) return; onUpdate({ ...property, rooms: [...property.rooms, roomInput.trim()] }); setRoomInput(''); };
  const removeRoom = (room) => onUpdate({ ...property, rooms: property.rooms.filter(r => r !== room) });
  const addFacility = () => { if (!facilityInput.trim()) return; onUpdate({ ...property, facilities: [...property.facilities, facilityInput.trim()] }); setFacilityInput(''); };
  const removeFacility = (f) => onUpdate({ ...property, facilities: property.facilities.filter(x => x !== f) });
  const saveColor = () => {
    onUpdate({ ...property, color: pendingColor });
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col" style={{ background: '#fff', maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ background: property.color }} /><p className="text-lg font-bold" style={{ color: C.text }}>{property.name}</p></div>
          <button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex flex-col gap-6">

          {/* Color theme */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Color theme</p>
            <div className="flex flex-wrap gap-3 mb-3">
              {THEME_COLORS.map(color => (
                <button key={color} onClick={() => setPendingColor(color)} className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: color, border: pendingColor === color ? `2px solid ${C.text}` : '2px solid transparent', boxShadow: pendingColor === color ? `0 0 0 2px #fff inset` : 'none' }}>
                  {pendingColor === color && <Check size={14} color="#fff" />}
                </button>
              ))}
            </div>
            {pendingColor !== property.color
              ? <button onClick={saveColor} className="text-sm font-semibold px-4 py-2.5 rounded-xl" style={{ background: pendingColor, color: '#fff' }}>Save color</button>
              : justSaved ? <p className="text-xs font-semibold" style={{ color: C.teal }}>Saved — applied everywhere.</p>
              : null}
          </div>

          {/* Currencies */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.muted }}>Currencies</p>
            <p className="text-xs mb-3" style={{ color: C.muted }}>Select the currencies this property operates in. Financials will show a GHS/EUR switcher for enabled currencies.</p>
            <div className="flex gap-2">
              {['GHS', 'EUR'].map(cur => (
                <button key={cur} onClick={() => toggleCurrency(cur)} className="text-sm font-semibold px-4 py-2 rounded-xl"
                  style={{ background: currencies.includes(cur) ? C.text : C.bg, color: currencies.includes(cur) ? '#fff' : C.muted, border: `1px solid ${C.border}` }}>
                  {cur}
                </button>
              ))}
            </div>
          </div>

          {/* Per-currency allocations */}
          {currencies.map(cur => {
            const a = allocation[cur] || { owners: 60, operations: 15, management: 25 };
            const total = allocTotal(cur);
            const isValid = total === 100;
            return (
              <div key={cur}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.muted }}>Income allocation — {cur}</p>
                  <span className="text-xs font-semibold" style={{ color: isValid ? C.teal : 'var(--accent, #111111)' }}>{total}% {isValid ? '✓' : '— must equal 100%'}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {[['owners', 'Owners Fund'], ['operations', 'Operations Fund'], ['management', 'Oak & Co. Fund']].map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.bg }}>
                      <span className="text-sm" style={{ color: C.text }}>{label}</span>
                      <div className="flex items-center gap-1">
                        <input type="number" min="0" max="100" value={a[key] || 0}
                          onChange={e => updateAlloc(cur, key, e.target.value)}
                          className="w-16 text-right px-2 py-1 rounded-lg text-sm font-semibold"
                          style={{ border: `1px solid ${C.border}`, color: C.text }} />
                        <span className="text-sm" style={{ color: C.muted }}>%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Rooms */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Rooms</p>
            <div className="flex flex-col gap-2 mb-3">
              {property.rooms.length === 0 && <p className="text-sm" style={{ color: C.muted }}>No rooms added yet.</p>}
              {property.rooms.map(room => (
                <div key={room} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.bg }}>
                  <span className="text-sm" style={{ color: C.text }}>{room}</span>
                  <button onClick={() => removeRoom(room)} className="text-xs font-semibold" style={{ color: 'var(--accent, #111111)' }}>Remove</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={roomInput} onChange={e => setRoomInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addRoom()} className="flex-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} placeholder="e.g. Master Bedroom" />
              <button onClick={addRoom} className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: C.text, color: '#fff' }}>Add</button>
            </div>
          </div>

          {/* Facilities */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Facilities</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {property.facilities.length === 0 && <p className="text-sm" style={{ color: C.muted }}>No facilities added yet.</p>}
              {property.facilities.map(f => (
                <button key={f} onClick={() => removeFacility(f)} className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5" style={{ background: C.tealSoft, color: C.teal }}>
                  {f} <X size={11} />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={facilityInput} onChange={e => setFacilityInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFacility()} className="flex-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} placeholder="e.g. Pool" />
              <button onClick={addFacility} className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: C.text, color: '#fff' }}>Add</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PropertySwitcher({ properties, selectedId, setSelectedId, onAddProperty, onDeleteProperty, onUpdateProperty, canEdit }) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [profileFor, setProfileFor] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const current = properties.find(p => p.id === selectedId);
  const label = selectedId === 'all' ? 'All properties' : (current ? current.name : 'All properties');

  return (
    <div className="relative ml-2">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-1.5">
        {current && <div className="w-2 h-2 rounded-full" style={{ background: current.color }} />}
        <span className="text-base font-bold" style={{ color: C.text }}>{label}</span>
        <ChevronDown size={14} style={{ color: C.muted }} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-64 rounded-xl p-2 z-30" style={{ background: '#fff', border: `1px solid ${C.border}`, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}>
          <button onClick={() => { setSelectedId('all'); setOpen(false); }} className="w-full text-left text-sm px-3 py-2 rounded-lg" style={{ color: selectedId === 'all' ? 'var(--accent, #111111)' : C.text, fontWeight: selectedId === 'all' ? 700 : 500, background: selectedId === 'all' ? 'var(--accent-soft, rgba(0,0,0,0.07))' : 'transparent' }}>
            All properties
          </button>
          <div style={{ borderTop: `1px solid ${C.border}`, margin: '6px 0' }} />
          {properties.map(p => (
            <div key={p.id} className="rounded-lg px-3 py-2" style={{ background: selectedId === p.id ? 'var(--accent-soft, rgba(0,0,0,0.07))' : 'transparent' }}>
              <div className="flex items-center justify-between">
                <button onClick={() => { setSelectedId(p.id); setOpen(false); }} className="flex items-center gap-2 text-left text-sm flex-1" style={{ color: selectedId === p.id ? 'var(--accent, #111111)' : C.text, fontWeight: selectedId === p.id ? 700 : 500 }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: p.color }} /> {p.name}
                </button>
              </div>
              {canEdit && (
                <div className="flex items-center gap-3 mt-1">
                  <button onClick={() => { setProfileFor(p); setOpen(false); }} className="text-xs font-medium" style={{ color: C.muted }}>Edit profile</button>
                  {confirmDeleteId === p.id ? (
                    <>
                      <button onClick={() => { onDeleteProperty(p.id); setConfirmDeleteId(null); }} className="text-xs font-semibold" style={{ color: 'var(--accent, #111111)' }}>Confirm delete</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="text-xs font-medium" style={{ color: C.muted }}>Cancel</button>
                    </>
                  ) : (
                    properties.length > 1 && <button onClick={() => setConfirmDeleteId(p.id)} className="text-xs font-medium" style={{ color: C.muted }}>Delete</button>
                  )}
                </div>
              )}
            </div>
          ))}
          {canEdit && (
            <>
              <div style={{ borderTop: `1px solid ${C.border}`, margin: '6px 0' }} />
              <button onClick={() => { setShowForm(true); setOpen(false); }} className="w-full text-left text-sm px-3 py-2 rounded-lg" style={{ color: C.muted, fontWeight: 500 }}>
                + Add property
              </button>
            </>
          )}
        </div>
      )}
      {showForm && <PropertyForm onClose={() => setShowForm(false)} onAdd={onAddProperty} />}
      {profileFor && <PropertyProfileModal property={profileFor} onUpdate={(updated) => { onUpdateProperty(updated); setProfileFor(updated); }} onClose={() => setProfileFor(null)} />}
    </div>
  );
}

function TopBar({ nav, goTo, onSignOut, onOpenProfile, tabsOpen, setTabsOpen, canGoBack, canGoForward, onBack, onForward, onOpenSearch, onGenerateReport, properties, selectedPropertyId, setSelectedPropertyId, onAddProperty, onDeleteProperty, onUpdateProperty, navItems, canEdit, currentUser }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="flex items-center gap-1 px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
      <div className="relative" onMouseEnter={() => setMenuOpen(true)} onMouseLeave={() => setMenuOpen(false)}>
        <button className="p-2 rounded-lg" style={{ color: C.text }} title="Menu"><Menu size={18} /></button>
        {menuOpen && (
          <div className="absolute left-0 top-full w-48 rounded-xl p-2 z-30" style={{ background: '#fff', border: `1px solid ${C.border}`, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}>
            <button onClick={() => { onOpenProfile(); setMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg" style={{ background: 'transparent' }}>
              <p className="text-sm font-semibold" style={{ color: C.text }}>{currentUser?.name}</p>
              <p className="text-xs" style={{ color: C.muted }}>{canEdit ? 'Property Manager' : 'Owner'} · View profile</p>
            </button>
            <div style={{ borderTop: `1px solid ${C.border}`, margin: '6px 0' }} />
            {navItems.map(item => (
              <button key={item.key} onClick={() => { goTo(item.key); setMenuOpen(false); }} className="w-full text-left text-sm px-3 py-2 rounded-lg"
                style={{ color: nav === item.key ? 'var(--accent, #111111)' : C.text, fontWeight: nav === item.key ? 700 : 500, background: nav === item.key ? 'var(--accent-soft, rgba(0,0,0,0.07))' : 'transparent' }}>
                {item.label}
              </button>
            ))}
            <div style={{ borderTop: `1px solid ${C.border}`, margin: '6px 0' }} />
            <button onClick={() => { onGenerateReport(); setMenuOpen(false); }} className="w-full text-left text-sm px-3 py-2 rounded-lg" style={{ color: C.text, fontWeight: 500 }}>Generate report</button>
            <div style={{ borderTop: `1px solid ${C.border}`, margin: '6px 0' }} />
            <button onClick={onSignOut} className="w-full text-left text-sm px-3 py-2 rounded-lg" style={{ color: C.muted, fontWeight: 500 }}>Sign out</button>
          </div>
        )}
      </div>

      <button onClick={() => setTabsOpen(!tabsOpen)} className="p-2 rounded-lg" style={{ color: tabsOpen ? 'var(--accent, #111111)' : C.text, background: tabsOpen ? 'var(--accent-soft, rgba(0,0,0,0.07))' : 'transparent' }} title="Toggle tabs">
        <PanelLeft size={18} />
      </button>

      <button onClick={onOpenSearch} className="p-2 rounded-lg" style={{ color: C.text }} title="Search"><Search size={18} /></button>

      <button onClick={onBack} disabled={!canGoBack} className="p-2 rounded-lg" style={{ color: canGoBack ? C.text : '#D9D9D9' }} title="Back"><ChevronLeft size={18} /></button>
      <button onClick={onForward} disabled={!canGoForward} className="p-2 rounded-lg" style={{ color: canGoForward ? C.text : '#D9D9D9' }} title="Forward"><ChevronRight size={18} /></button>

      <PropertySwitcher properties={properties} selectedId={selectedPropertyId} setSelectedId={setSelectedPropertyId} onAddProperty={onAddProperty} onDeleteProperty={onDeleteProperty} onUpdateProperty={onUpdateProperty} canEdit={canEdit} />
    </div>
  );
}

function InviteOwnerForm({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const canSubmit = name.trim() && email.trim();
  const handleSubmit = () => { if (!canSubmit) return; onAdd(name.trim(), email.trim()); onClose(); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#fff' }}>
        <div className="flex items-center justify-between mb-5"><p className="text-lg font-bold" style={{ color: C.text }}>Invite an owner</p><button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button></div>
        <p className="text-xs mb-4" style={{ color: C.muted }}>They'll see everything in this workspace under their own name, but won't be able to add, edit, or delete anything.</p>
        <label className="text-xs font-semibold" style={{ color: C.muted }}>Full name</label>
        <input value={name} onChange={e => setName(e.target.value)} autoFocus className="w-full mt-1 mb-4 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} placeholder="e.g. Kwame Asare" />
        <label className="text-xs font-semibold" style={{ color: C.muted }}>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} className="w-full mt-1 mb-4 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} placeholder="kwame@example.com" />
        <button onClick={handleSubmit} disabled={!canSubmit} className="w-full text-sm font-semibold py-3 rounded-xl" style={{ background: canSubmit ? 'var(--accent, #111111)' : C.border, color: canSubmit ? '#fff' : C.muted }}>Send invite</button>
      </div>
    </div>
  );
}

function ProfileModal({ properties, currentUser, users, onInvite, onRevoke, onClose, onSignOut, onPreviewAs }) {
  const [showInvite, setShowInvite] = useState(false);
  const isManager = currentUser?.role === 'manager';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col" style={{ background: '#fff', maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <p className="text-lg font-bold" style={{ color: C.text }}>Profile</p>
          <button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex flex-col gap-4">
          <div>
            <p className="text-base font-bold" style={{ color: C.text }}>{currentUser?.name}</p>
            <p className="text-sm" style={{ color: C.muted }}>{isManager ? 'Property Manager · can edit' : 'Owner · view only'}</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.bg }}><span className="text-xs" style={{ color: C.muted }}>Email</span><span className="text-sm" style={{ color: C.text }}>{currentUser?.email}</span></div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>{isManager ? 'Properties managed' : 'Properties you can view'}</p>
            <div className="flex flex-col gap-2">
              {properties.map(p => (
                <div key={p.id} className="flex items-center gap-2 py-2 px-3 rounded-xl" style={{ background: C.bg }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  <span className="text-sm" style={{ color: C.text }}>{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          {isManager && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.muted }}>People with access</p>
                <button onClick={() => setShowInvite(true)} className="text-xs font-semibold" style={{ color: 'var(--accent, #111111)' }}>+ Invite owner</button>
              </div>
              <div className="flex flex-col gap-2">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.bg }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.text }}>{u.name}</p>
                      <p className="text-xs" style={{ color: C.muted }}>{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill tone={u.role === 'manager' ? 'teal' : 'muted'}>{u.role === 'manager' ? 'Manager' : 'Owner'}</Pill>
                      {u.role === 'owner' && (
                        <button onClick={() => { onPreviewAs(u); onClose(); }} className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: '#FEF9C3', color: '#92400E' }}>
                          Preview
                        </button>
                      )}
                      {u.role !== 'manager' && <button onClick={() => onRevoke(u.id)} className="text-xs font-medium" style={{ color: C.muted }}>Remove</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={onSignOut} className="w-full text-sm font-semibold py-3 rounded-xl mt-1" style={{ background: C.bg, color: C.muted }}>Sign out</button>
        </div>
      </div>
      {showInvite && <InviteOwnerForm onClose={() => setShowInvite(false)} onAdd={onInvite} />}
    </div>
  );
}

function TabsSidebar({ nav, goTo, onGenerateReport, onOpenProfile, onSignOut, navItems }) {
  return (
    <div className="flex-shrink-0 flex flex-col p-3" style={{ width: 200, height: '100%', borderRight: `1px solid ${C.border}` }}>
      <div className="flex flex-col gap-1">
        {navItems.map(item => (
          <button key={item.key} onClick={() => goTo(item.key)} className="w-full text-left text-sm px-3 py-2.5 rounded-xl"
            style={{ color: nav === item.key ? 'var(--accent, #111111)' : C.text, fontWeight: nav === item.key ? 700 : 500, background: nav === item.key ? 'var(--accent-soft, rgba(0,0,0,0.07))' : 'transparent' }}>
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-auto flex flex-col gap-1 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
        <button onClick={onGenerateReport} className="w-full text-left text-sm px-3 py-2.5 rounded-xl" style={{ color: C.text, fontWeight: 500 }}>Generate report</button>
        <button onClick={onOpenProfile} className="w-full text-left text-sm px-3 py-2.5 rounded-xl" style={{ color: C.text, fontWeight: 500 }}>View profile</button>
        <button onClick={onSignOut} className="w-full text-left text-sm px-3 py-2.5 rounded-xl" style={{ color: C.muted, fontWeight: 500 }}>Sign out</button>
      </div>
    </div>
  );
}

function SearchModal({ onClose, bookings, team, goTo }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const bookingResults = q ? bookings.filter(b => b.guest.toLowerCase().includes(q)) : [];
  const teamResults = q ? team.filter(t => t.name.toLowerCase().includes(q)) : [];
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24" style={{ background: 'rgba(0,0,0,0.35)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: '#fff' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <Search size={16} style={{ color: C.muted }} />
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search guests, team members…" className="flex-1 text-sm outline-none" style={{ color: C.text }} />
          <button onClick={onClose}><X size={18} style={{ color: C.muted }} /></button>
        </div>
        <div className="p-2 max-h-80 overflow-y-auto">
          {q === '' && <p className="text-sm px-3 py-4" style={{ color: C.muted }}>Start typing to search.</p>}
          {q !== '' && bookingResults.length === 0 && teamResults.length === 0 && <p className="text-sm px-3 py-4" style={{ color: C.muted }}>No matches.</p>}
          {bookingResults.map(b => <button key={b.id} onClick={() => { goTo('bookings'); onClose(); }} className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ color: C.text }}><span className="text-sm">{b.guest}</span><Pill tone="muted">Booking</Pill></button>)}
          {teamResults.map(t => <button key={t.name} onClick={() => { goTo('team'); onClose(); }} className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ color: C.text }}><span className="text-sm">{t.name}</span><Pill tone="muted">Team</Pill></button>)}
        </div>
      </div>
    </div>
  );
}

const TODAY = new Date('2026-07-07T00:00:00');
function shiftDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function toISODate(d) { return d.toISOString().slice(0, 10); }
function inRange(dateStr, start, end) { return dateStr >= start && dateStr <= end; }

const PERIOD_RANGES = {
  month: {
    current: { start: '2026-07-01', end: '2026-07-31', label: 'July' },
    previous: { start: '2026-06-01', end: '2026-06-30', label: 'June' },
  },
  week: {
    current: { start: toISODate(shiftDays(TODAY, -6)), end: toISODate(TODAY), label: 'This week' },
    previous: { start: toISODate(shiftDays(TODAY, -13)), end: toISODate(shiftDays(TODAY, -7)), label: 'Last week' },
  },
  year: {
    current: { start: '2026-01-01', end: '2026-12-31', label: '2026' },
    previous: { start: '2025-01-01', end: '2025-12-31', label: '2025' },
  },
};

const PERIODS = {
  Week: { currentLabel: 'This week', previousLabel: 'Last week', currentRange: ['2026-07-01', '2026-07-07'], previousRange: ['2026-06-24', '2026-06-30'], days: 7 },
  Month: { currentLabel: 'July', previousLabel: 'June', currentPrefix: '2026-07', previousPrefix: '2026-06', days: 31 },
  Year: { currentLabel: '2026', previousLabel: '2025', currentPrefix: '2026', previousPrefix: '2025', days: 365 },
};
function inPeriod(dateStr, periodKey, which) {
  const p = PERIODS[periodKey];
  if (p.currentRange) {
    const [start, end] = which === 'current' ? p.currentRange : p.previousRange;
    return dateStr >= start && dateStr <= end;
  }
  return dateStr.startsWith(which === 'current' ? p.currentPrefix : p.previousPrefix);
}

function DeltaStat({ label, current, previous, format }) {
  const fmt = format || (n => n);
  const diff = current - previous;
  const up = diff > 0;
  const flat = diff === 0;
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl" style={{ background: C.bg }}>
      <span className="text-sm" style={{ color: C.text }}>{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold" style={{ color: C.text }}>{fmt(current)}</span>
        <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: flat ? C.muted : up ? C.teal : 'var(--accent, #111111)' }}>
          {!flat && (up ? <TrendingUp size={12} /> : <TrendingDown size={12} />)}
          {flat ? 'No change' : `${up ? '+' : ''}${fmt(diff)} vs last`}
        </span>
      </div>
    </div>
  );
}

function Dashboard({ bookings, schedules, issues, expenses, properties, showPropertyTag, onConfirmPayout, currentUser, canEdit, onSetIssueStatus, onViewBooking, onOpenIssue }) {
  const [periodKey, setPeriodKey] = useState('Month');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const period = PERIODS[periodKey];
  const upcoming = bookings.filter(b => b.status === 'confirmed' || b.status === 'expected').slice(0, 5);
  const openIssues = issues.filter(i => i.status === 'Open' || i.status === 'In Progress');

  const currentExpenses = expenses.filter(e => inPeriod(e.date, periodKey, 'current')).reduce((s, e) => s + e.amount * 1.01, 0);
  const previousExpenses = expenses.filter(e => inPeriod(e.date, periodKey, 'previous')).reduce((s, e) => s + e.amount * 1.01, 0);
  const chartData = [
    { label: period.previousLabel, expenses: Math.round(previousExpenses) },
    { label: period.currentLabel, expenses: Math.round(currentExpenses) },
  ];

  const currentBookings = bookings.filter(b => inPeriod(b.checkIn, periodKey, 'current'));
  const previousBookings = bookings.filter(b => inPeriod(b.checkIn, periodKey, 'previous'));
  const currentShifts = schedules.filter(s => inPeriod(s.date, periodKey, 'current')).length;
  const previousShifts = schedules.filter(s => inPeriod(s.date, periodKey, 'previous')).length;

  const currentIncomeGHS = currentBookings.filter(b => b.currency === 'GHS').reduce((s, b) => s + b.amount, 0);
  const previousIncomeGHS = previousBookings.filter(b => b.currency === 'GHS').reduce((s, b) => s + b.amount, 0);
  const currentIncomeEUR = currentBookings.filter(b => b.currency === 'EUR').reduce((s, b) => s + b.amount, 0);
  const previousIncomeEUR = previousBookings.filter(b => b.currency === 'EUR').reduce((s, b) => s + b.amount, 0);

  const nightsBooked = (list) => list.reduce((s, b) => s + Math.max(0, dayOfMonth(b.checkOut) - dayOfMonth(b.checkIn)), 0);
  const currentOccupancy = Math.min(100, Math.round((nightsBooked(currentBookings) / period.days) * 100));
  const previousOccupancy = Math.min(100, Math.round((nightsBooked(previousBookings) / period.days) * 100));

  const upcomingShifts = [...schedules].sort((a, b) => a.date < b.date ? -1 : 1).filter(s => s.date >= '2026-07-07').slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: C.text }}>Good afternoon, {currentUser?.name}</h1>
        <p className="text-sm mt-1" style={{ color: C.muted }}>Tuesday, July 7 — here's where things stand.</p>
      </div>
      {openIssues.length > 0 && (
        <Card style={{ background: 'var(--accent-soft, rgba(0,0,0,0.07))', border: `1px solid rgba(255,90,95,0.2)` }}>
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--accent, #111111)' }}>Open issues ({openIssues.length})</p>
          <div className="flex flex-col gap-1.5">
            {openIssues.map(i => (
              <button key={i.id} onClick={() => onOpenIssue(i)} className="w-full text-left flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.6)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: C.text }}>{i.type}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>{i.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <Pill tone={STATUS_TONE[i.status] || 'accent'}>{i.status}</Pill>
                  <ChevronRight size={14} style={{ color: C.muted }} />
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
      <Card style={{ background: C.tealSoft, border: `1px solid rgba(0,166,153,0.2)` }}>
        <p className="text-sm font-semibold mb-2" style={{ color: C.teal }}>Upcoming schedules</p>
        <div className="flex flex-col gap-1.5">
          {upcomingShifts.length === 0 && <p className="text-sm" style={{ color: C.muted }}>No schedules yet.</p>}
          {upcomingShifts.map(s => (
            <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.6)' }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: C.text }}>{s.type}</p>
                <p className="text-xs mt-0.5" style={{ color: C.muted }}>{s.assignedTo}{s.note ? ` · ${s.note}` : ''}</p>
              </div>
              <span className="text-xs font-semibold flex-shrink-0 ml-3" style={{ color: C.teal }}>{s.date}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <p className="text-sm font-semibold mb-4" style={{ color: C.text }}>Upcoming stays</p>
        <div className="flex flex-col divide-y" style={{ borderColor: C.border }}>
          {upcoming.length === 0 && <p className="text-sm" style={{ color: C.muted }}>Nothing coming up.</p>}
          {upcoming.map(b => (
            <div key={b.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0" style={{ borderColor: C.border }}>
              <div className="flex items-center gap-2">
                {showPropertyTag && <div className="w-2 h-2 rounded-full" style={{ background: propColor(properties, b.propertyId) }} />}
                <div><p className="text-sm font-medium" style={{ color: C.text }}>{b.guest}</p><p className="text-xs" style={{ color: C.muted }}>{b.checkIn} → {b.checkOut}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium" style={{ color: C.text }}>{fmtAmt(b)}</span>
                {b.status === 'expected' ? (
                  canEdit ? (
                    <button onClick={() => onConfirmPayout(b.id)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: C.teal, color: '#fff' }}><Check size={13} /> Confirm payout</button>
                  ) : (
                    <Pill tone="amber">Expected</Pill>
                  )
                ) : (
                  <Pill tone="teal">Confirmed</Pill>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold" style={{ color: C.text }}>{period.currentLabel} vs {period.previousLabel}</p>
          <div className="flex items-center gap-1 rounded-full p-1" style={{ background: '#F2F2F2' }}>
            {Object.keys(PERIODS).map(k => (
              <button key={k} onClick={() => setPeriodKey(k)} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: periodKey === k ? '#fff' : 'transparent', color: periodKey === k ? C.text : C.muted }}>{k}</button>
            ))}
          </div>
        </div>
        <p className="text-xs mb-3" style={{ color: C.muted }}>Expenses (GH₵)</p>
        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.border} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} width={40} />
              <Tooltip formatter={(v) => fmtGHS(v)} contentStyle={{ borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 12 }} />
              <Bar dataKey="expenses" fill={'var(--accent, #111111)'} radius={[6, 6, 0, 0]} barSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2 mt-3">
          <DeltaStat label="Occupancy" current={currentOccupancy} previous={previousOccupancy} format={n => `${n}%`} />
          <DeltaStat label="Bookings" current={currentBookings.length} previous={previousBookings.length} />
          <DeltaStat label="Schedules" current={currentShifts} previous={previousShifts} />
          <DeltaStat label="Income (GHS)" current={currentIncomeGHS} previous={previousIncomeGHS} format={fmtGHS} />
          <DeltaStat label="Income (EUR)" current={currentIncomeEUR} previous={previousIncomeEUR} format={fmtEUR} />
        </div>
      </Card>
      {selectedIssue && (
        <IssueDetailModal
          issue={issues.find(i => i.id === selectedIssue.id) || selectedIssue}
          booking={bookings.find(b => b.guest === selectedIssue.guest)}
          onClose={() => setSelectedIssue(null)}
          onSetStatus={(id, status) => { onSetIssueStatus(id, status); setSelectedIssue(i => ({ ...i })); }}
          onViewBooking={() => { setSelectedIssue(null); onViewBooking(bookings.find(b => b.guest === selectedIssue.guest)); }}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}

function BookingDetailRow({ b, properties, showPropertyTag, onClick }) {
  return (
    <button onClick={onClick} className="w-full text-left flex items-center justify-between py-3 px-4 rounded-xl" style={{ background: C.bg }}>
      <div className="flex items-center gap-2">
        {showPropertyTag && <div className="w-2 h-2 rounded-full" style={{ background: propColor(properties, b.propertyId) }} />}
        <div><p className="text-sm font-medium" style={{ color: C.text }}>{b.guest}</p><p className="text-xs" style={{ color: C.muted }}>{b.checkIn} → {b.checkOut} · {b.source === 'airbnb' ? 'Airbnb' : 'Local / Cash'}</p></div>
      </div>
      <div className="flex items-center gap-3"><span className="text-sm font-medium" style={{ color: C.text }}>{fmtAmt(b)}</span><Pill tone={b.status === 'confirmed' ? 'teal' : 'amber'}>{b.status === 'confirmed' ? 'Confirmed' : 'Expected'}</Pill></div>
    </button>
  );
}

const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved'];
const STATUS_TONE = { Open: 'accent', 'In Progress': 'amber', Resolved: 'teal' };

function IssueDetailModal({ issue, booking, onClose, onSetStatus, onViewBooking, canEdit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col" style={{ background: '#fff', maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2">
            <Pill tone={STATUS_TONE[issue.status] || 'muted'}>{issue.status}</Pill>
            <p className="text-base font-bold" style={{ color: C.text }}>{issue.type}</p>
          </div>
          <button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex flex-col gap-5">
          {/* Description */}
          <p className="text-sm" style={{ color: C.text }}>{issue.description}</p>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl" style={{ background: C.bg }}>
              <p className="text-xs" style={{ color: C.muted }}>Logged</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: C.text }}>{issue.date}</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: C.bg }}>
              <p className="text-xs" style={{ color: C.muted }}>Guest</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: C.text }}>{issue.guest || '—'}</p>
            </div>
          </div>

          {/* Link to booking */}
          {booking && (
            <button onClick={onViewBooking} className="w-full flex items-center justify-between py-3 px-4 rounded-xl" style={{ background: C.bg }}>
              <div>
                <p className="text-xs" style={{ color: C.muted }}>Linked stay</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: C.text }}>{booking.guest} · {booking.checkIn} → {booking.checkOut}</p>
              </div>
              <ChevronRight size={16} style={{ color: C.muted }} />
            </button>
          )}

          {/* Status changer */}
          {canEdit && issue.status !== null && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Change status</p>
              <div className="flex gap-2 flex-wrap">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => { if (s !== issue.status) onSetStatus(issue.id, s); }}
                    className="text-xs font-semibold px-3 py-2 rounded-full"
                    style={{
                      background: issue.status === s ? (s === 'Open' ? 'var(--accent, #111111)' : s === 'In Progress' ? '#F59E0B' : C.teal) : C.bg,
                      color: issue.status === s ? '#fff' : C.text,
                      border: issue.status === s ? 'none' : `1px solid ${C.border}`
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status history timeline */}
          {issue.statusHistory?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Status history</p>
              <div className="flex flex-col gap-0">
                {[...issue.statusHistory].reverse().map((h, idx) => (
                  <div key={idx} className="flex items-start gap-3 pb-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: h.status === 'Open' ? 'var(--accent, #111111)' : h.status === 'In Progress' ? '#F59E0B' : C.teal }} />
                      {idx < issue.statusHistory.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: C.border, minHeight: 16 }} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: C.text }}>{h.status}</p>
                      <p className="text-xs mt-0.5" style={{ color: C.muted }}>{h.at}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BookingDetailModal({ booking, schedules, issues, properties, showPropertyTag, onClose, onEdit, onDelete, onConfirm, canEdit }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const nights = Math.round((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24));
  // Only show schedules whose date falls within the check-in to check-out range
  const relatedShifts = schedules.filter(s => s.date >= booking.checkIn && s.date <= booking.checkOut);
  const relatedIssues = issues.filter(i => i.guest === booking.guest);
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.35)' }}>
        <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col" style={{ background: '#fff', maxHeight: '85vh' }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2">
              {showPropertyTag && <div className="w-2.5 h-2.5 rounded-full" style={{ background: propColor(properties, booking.propertyId) }} />}
              <p className="text-lg font-bold" style={{ color: C.text }}>{booking.guest}</p>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && (
                <>
                  <button onClick={() => setShowEditForm(true)} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: C.bg, color: C.text }}>Edit</button>
                  {confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => { onDelete(booking.id); onClose(); }} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: 'var(--accent, #111111)', color: '#fff' }}>Confirm delete</button>
                      <button onClick={() => setConfirmDelete(false)} className="text-xs font-semibold" style={{ color: C.muted }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(true)} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: C.bg, color: C.muted }}>Delete</button>
                  )}
                </>
              )}
              <button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button>
            </div>
          </div>
          <div className="px-6 py-4 overflow-y-auto flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl" style={{ background: C.bg }}><p className="text-xs" style={{ color: C.muted }}>Check-in</p><p className="text-sm font-semibold mt-0.5" style={{ color: C.text }}>{booking.checkIn}</p></div>
              <div className="p-3 rounded-xl" style={{ background: C.bg }}><p className="text-xs" style={{ color: C.muted }}>Check-out</p><p className="text-sm font-semibold mt-0.5" style={{ color: C.text }}>{booking.checkOut}</p></div>
              <div className="p-3 rounded-xl" style={{ background: C.bg }}><p className="text-xs" style={{ color: C.muted }}>Nights</p><p className="text-sm font-semibold mt-0.5" style={{ color: C.text }}>{nights}</p></div>
              <div className="p-3 rounded-xl" style={{ background: C.bg }}><p className="text-xs" style={{ color: C.muted }}>Amount</p><p className="text-sm font-semibold mt-0.5" style={{ color: C.text }}>{fmtAmt(booking)}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <Pill tone="muted">{booking.source === 'airbnb' ? 'Airbnb' : 'Local / Cash'}</Pill>
              <Pill tone={booking.status === 'confirmed' ? 'teal' : 'amber'}>{booking.status === 'confirmed' ? 'Confirmed' : 'Expected'}</Pill>
            </div>
            {canEdit && booking.status === 'expected' && (
              <button onClick={() => { onConfirm(booking.id); }} className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-xl" style={{ background: C.teal, color: '#fff' }}>
                <Check size={16} /> Confirm payment received
              </button>
            )}
            {relatedShifts.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Schedules during this stay</p>
                <div className="flex flex-col gap-2">
                  {relatedShifts.map(s => <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.tealSoft }}><p className="text-sm font-semibold" style={{ color: C.teal }}>{s.type} · {s.assignedTo}</p><span className="text-xs" style={{ color: C.muted }}>{s.date}</span></div>)}
                </div>
              </div>
            )}
            {relatedIssues.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Issues linked to this guest</p>
                <div className="flex flex-col gap-2">
                  {relatedIssues.map(i => <div key={i.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: i.status === 'Open' ? 'var(--accent-soft, rgba(0,0,0,0.07))' : C.bg }}><p className="text-sm" style={{ color: C.text }}>{i.description}</p>{i.status && <Pill tone={i.status === 'Open' ? 'accent' : 'teal'}>{i.status}</Pill>}</div>)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {showEditForm && (
        <BookingForm
          booking={booking}
          onClose={() => setShowEditForm(false)}
          onEdit={(updated) => { onEdit(updated); setShowEditForm(false); onClose(); }}
          onAdd={() => {}}
          properties={properties}
          defaultPropertyId={booking.propertyId}
        />
      )}
    </>
  );
}

function DaySummaryPanel({ day, bookings, schedules, issues, onSchedule, onLogIssue, onToggleIssue, onSelectBooking, properties, showPropertyTag, width = 260, canEdit = true, activeMonth }) {
  const mnLabel = activeMonth ? `${MONTH_NAMES[activeMonth.month]} ${day}, ${activeMonth.year}` : `${MONTH_NAMES[6]} ${day}, 2026`;
  if (!day) return <Card style={{ width }}><p className="text-sm" style={{ color: C.muted }}>Click a date to see what's happening that day.</p></Card>;
  const dayBookings = bookings.filter(b => bookingCoversDay(b, day) || dayOfMonth(b.checkIn) === day || dayOfMonth(b.checkOut) === day);
  const dayShifts = schedules.filter(s => dayOfMonth(s.date) === day);
  const dayIssues = issues.filter(i => dayOfMonth(i.date) === day);
  return (
    <Card style={{ width }}>
      <p className="text-sm font-bold mb-3" style={{ color: C.text }}>{mnLabel}</p>
      {dayBookings.length === 0 && dayShifts.length === 0 && dayIssues.length === 0 && <p className="text-sm mb-4" style={{ color: C.muted }}>Nothing happening this day.</p>}
      {dayBookings.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {dayBookings.map(b => (
            <button key={b.id} onClick={() => onSelectBooking && onSelectBooking(b)} className="w-full text-left p-2.5 rounded-xl" style={{ background: C.bg }}>
              <div className="flex items-center gap-2">
                {showPropertyTag && <div className="w-1.5 h-1.5 rounded-full" style={{ background: propColor(properties, b.propertyId) }} />}
                <p className="text-xs font-semibold" style={{ color: C.text }}>{b.guest}</p>
              </div>
              <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>{fmtAmt(b)}</p>
              <div className="flex gap-1 mt-1.5 flex-wrap">{dayOfMonth(b.checkIn) === day && <Pill tone="accent">Check-in</Pill>}{dayOfMonth(b.checkOut) === day && <Pill tone="muted">Check-out</Pill>}</div>
            </button>
          ))}
        </div>
      )}
      {dayShifts.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {dayShifts.map(s => <div key={s.id} className="p-2.5 rounded-xl" style={{ background: C.tealSoft }}><p className="text-xs font-semibold" style={{ color: C.teal }}>{s.type} · {s.assignedTo}</p>{s.note && <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>{s.note}</p>}</div>)}
        </div>
      )}
      {dayIssues.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {dayIssues.map(i => {
            const Tag = canEdit ? 'button' : 'div';
            return (
              <Tag key={i.id} onClick={canEdit ? () => onToggleIssue(i.id) : undefined} className="w-full text-left p-2.5 rounded-xl" style={{ background: i.status === 'Open' ? 'var(--accent-soft, rgba(0,0,0,0.07))' : C.tealSoft }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold" style={{ color: i.status === 'Open' ? 'var(--accent, #111111)' : C.teal }}>{i.type}</p>
                  {i.status && <Pill tone={i.status === 'Open' ? 'accent' : 'teal'}>{i.status}</Pill>}
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>{i.description}</p>
              </Tag>
            );
          })}
        </div>
      )}
      {canEdit && (
        <div className="flex flex-col gap-2">
          <button onClick={() => onSchedule(day)} className="w-full text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5" style={{ background: C.teal, color: '#fff' }}><ClipboardList size={13} /> Schedule for this day</button>
          <button onClick={() => onLogIssue(day)} className="w-full text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5" style={{ background: 'var(--accent-soft, rgba(0,0,0,0.07))', color: 'var(--accent, #111111)' }}><AlertTriangle size={13} /> Log issue</button>
        </div>
      )}
    </Card>
  );
}

function DayView({ bookings, schedules, issues, selectedDay, setSelectedDay, onSchedule, onLogIssue, onToggleIssue, onSelectBooking, properties, showPropertyTag, canEdit = true, activeMonth }) {
  const { year, month, daysInMonth } = activeMonth || { year: 2026, month: 6, daysInMonth: 31 };
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const currentDay = selectedDay || 1;

  return (
    <div className="flex flex-col gap-4">
      {/* Horizontal day strip */}
      <div className="flex items-center gap-2">
        <button onClick={() => setSelectedDay(Math.max(1, currentDay - 1))} className="p-2 rounded-full flex-shrink-0" style={{ background: C.card, border: `1px solid ${C.border}` }}><ChevronLeft size={16} style={{ color: C.text }} /></button>
        <div className="flex gap-1.5 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
          {days.map(day => {
            const hasBooking = bookings.some(b => bookingCoversDay(b, day) || dayOfMonth(b.checkIn) === day);
            const hasIssue = issues.some(i => dayOfMonth(i.date) === day);
            const hasShift = schedules.some(s => dayOfMonth(s.date) === day);
            const isSelected = currentDay === day;
            const dotColor = hasBooking ? 'var(--accent, #111111)' : hasShift ? C.teal : hasIssue ? 'var(--accent, #111111)' : null;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className="flex-shrink-0 flex flex-col items-center gap-1 px-2 py-2 rounded-xl"
                style={{ background: isSelected ? C.text : C.bg, border: isSelected ? 'none' : `1px solid ${C.border}`, minWidth: 44 }}
              >
                <span className="text-[10px] font-medium" style={{ color: isSelected ? 'rgba(255,255,255,0.6)' : C.muted }}>
                  {WEEKDAY_NAMES[new Date(year, month, day).getDay()]}
                </span>
                <span className="text-sm font-bold" style={{ color: isSelected ? '#fff' : C.text }}>{day}</span>
                {dotColor && !isSelected && <div className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />}
                {!dotColor && !isSelected && <div className="w-1.5 h-1.5" />}
              </button>
            );
          })}
        </div>
        <button onClick={() => setSelectedDay(Math.min(daysInMonth, currentDay + 1))} className="p-2 rounded-full flex-shrink-0" style={{ background: C.card, border: `1px solid ${C.border}` }}><ChevronRight size={16} style={{ color: C.text }} /></button>
      </div>

      {/* Day detail panel */}
      <DaySummaryPanel
        day={currentDay}
        bookings={bookings}
        schedules={schedules}
        issues={issues}
        onSchedule={onSchedule}
        onLogIssue={onLogIssue}
        onToggleIssue={onToggleIssue}
        onSelectBooking={onSelectBooking}
        properties={properties}
        showPropertyTag={showPropertyTag}
        width="100%"
        canEdit={canEdit}
        activeMonth={activeMonth}
      />
    </div>
  );
}

function WeekView({ bookings, schedules, issues, weekStart, setWeekStart, selectedDay, setSelectedDay, onSchedule, onLogIssue, onToggleIssue, onSelectBooking, properties, showPropertyTag, canEdit = true, activeMonth }) {
  const { year, month, daysInMonth, monthShort } = activeMonth || { year: 2026, month: 6, daysInMonth: 31, monthShort: 'Jul' };
  const days = Array.from({ length: 7 }, (_, i) => weekStart + i).filter(d => d >= 1 && d <= daysInMonth);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setWeekStart(Math.max(1, weekStart - 7))} className="p-2 rounded-full" style={{ background: C.card, border: `1px solid ${C.border}` }}><ChevronLeft size={16} style={{ color: C.text }} /></button>
        <p className="text-sm font-semibold" style={{ color: C.text }}>{monthShort} {days[0]} – {days[days.length - 1]}, {year}</p>
        <button onClick={() => setWeekStart(Math.min(daysInMonth - 6, weekStart + 7))} className="p-2 rounded-full" style={{ background: C.card, border: `1px solid ${C.border}` }}><ChevronRight size={16} style={{ color: C.text }} /></button>
      </div>
      <Card>
        <div className="grid grid-cols-7 gap-2">
          {days.map(day => {
            const covering = bookings.filter(b => bookingCoversDay(b, day) || dayOfMonth(b.checkIn) === day);
            const shiftsToday = schedules.filter(s => dayOfMonth(s.date) === day);
            const issuesToday = issues.filter(i => dayOfMonth(i.date) === day);
            const isSelected = selectedDay === day;
            return (
              <button key={day} onClick={() => setSelectedDay(day)} className="text-left rounded-xl p-2 min-h-32 flex flex-col" style={{ background: C.bg, border: isSelected ? `2px solid ${C.text}` : `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold" style={{ color: C.text }}>{WEEKDAY_NAMES[new Date(year, month, day).getDay()]} {day}</p>
                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <span onClick={e => { e.stopPropagation(); onLogIssue(day); }} className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-soft, rgba(0,0,0,0.07))', color: 'var(--accent, #111111)' }}><AlertTriangle size={9} /></span>
                      <span onClick={e => { e.stopPropagation(); onSchedule(day); }} className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: C.tealSoft, color: C.teal }}><Plus size={10} /></span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {covering.map(b => <div key={b.id} className="text-[10px] font-semibold px-1.5 py-1 rounded-md truncate" style={{ background: showPropertyTag ? `${propColor(properties, b.propertyId)}22` : 'var(--accent-soft, rgba(0,0,0,0.07))', color: showPropertyTag ? propColor(properties, b.propertyId) : 'var(--accent, #111111)' }}>{b.guest.split(' ')[0]}</div>)}
                  {shiftsToday.map(s => <div key={s.id} className="text-[10px] font-semibold px-1.5 py-1 rounded-md truncate" style={{ background: C.tealSoft, color: C.teal }}>{s.type}</div>)}
                  {issuesToday.map(i => <div key={i.id} className="text-[10px] font-semibold px-1.5 py-1 rounded-md truncate" style={{ background: i.status === 'Open' ? 'var(--accent-soft, rgba(0,0,0,0.07))' : '#F2F2F2', color: i.status === 'Open' ? 'var(--accent, #111111)' : C.muted }}>{i.type}</div>)}
                </div>
              </button>
            );
          })}
        </div>
      </Card>
      {days.includes(selectedDay) && (
        <DaySummaryPanel day={selectedDay} bookings={bookings} schedules={schedules} issues={issues} onSchedule={onSchedule} onLogIssue={onLogIssue} onToggleIssue={onToggleIssue} onSelectBooking={onSelectBooking} properties={properties} showPropertyTag={showPropertyTag} width="100%" canEdit={canEdit} activeMonth={activeMonth} />
      )}
    </div>
  );
}

function MonthView({ bookings, schedules, issues, selectedDay, setSelectedDay, onSchedule, onLogIssue, onToggleIssue, onSelectBooking, properties, showPropertyTag, canEdit = true, activeMonth }) {
  const { year, month, daysInMonth } = activeMonth || { year: 2026, month: 6, daysInMonth: 31 };
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const firstWeekdayOffset = new Date(year, month, 1).getDay();
  return (
    <div className="flex gap-4 items-start">
      <Card className="flex-1">
        <div className="grid grid-cols-7 gap-1 mb-2">{WEEKDAY_NAMES.map(d => <div key={d} className="text-xs font-semibold text-center py-1" style={{ color: C.muted }}>{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstWeekdayOffset }).map((_, i) => <div key={`blank-${i}`} />)}
          {days.map(day => {
            const booking = bookings.find(b => bookingCoversDay(b, day) || dayOfMonth(b.checkIn) === day);
            const isSelected = selectedDay === day;
            const dotColor = booking ? (showPropertyTag ? propColor(properties, booking.propertyId) : 'var(--accent, #111111)') : null;
            return (
              <button key={day} onClick={() => setSelectedDay(day)} className="aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative p-1"
                style={{ background: booking ? `${dotColor}18` : C.bg, border: isSelected ? `2px solid ${C.text}` : '1px solid transparent' }}>
                <span style={{ color: booking ? dotColor : C.text, fontWeight: booking ? 700 : 500 }}>{day}</span>
                {booking && <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ background: dotColor }} />}
              </button>
            );
          })}
        </div>
      </Card>
      <DaySummaryPanel day={selectedDay} bookings={bookings} schedules={schedules} issues={issues} onSchedule={onSchedule} onLogIssue={onLogIssue} onToggleIssue={onToggleIssue} onSelectBooking={onSelectBooking} properties={properties} showPropertyTag={showPropertyTag} canEdit={canEdit} activeMonth={activeMonth} />
    </div>
  );
}

function PerStayView({ bookings, schedules, issues, onSchedule, onLogIssue, onEditBooking, onDeleteBooking, onAddSchedule, onEditSchedule, onConfirmPayout, onSelectBooking, properties, showPropertyTag, team, canEdit = true }) {
  const [expandedId, setExpandedId] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const sorted = [...bookings].sort((a, b) => (a.checkIn < b.checkIn ? -1 : 1));

  return (
    <div className="flex flex-col gap-3">
      {sorted.length === 0 && (
        <Card><p className="text-sm" style={{ color: C.muted }}>No stays this month.</p></Card>
      )}
      {sorted.map(b => {
        const nights = Math.round((new Date(b.checkOut) - new Date(b.checkIn)) / (1000 * 60 * 60 * 24));
        const isExpanded = expandedId === b.id;
        const relatedSchedules = schedules.filter(s => s.date >= b.checkIn && s.date <= b.checkOut);
        const relatedIssues = issues.filter(i => i.guest === b.guest);
        const hasOpenIssue = relatedIssues.some(i => i.status === "Open" || i.status === "In Progress");

        return (
          <Card key={b.id} style={{ border: hasOpenIssue ? "1px solid rgba(255,90,95,0.3)" : undefined }}>
            {/* Full card header toggles expand */}
            <button onClick={() => setExpandedId(isExpanded ? null : b.id)} className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {showPropertyTag && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: propColor(properties, b.propertyId) }} />}
                <div className="text-left">
                  <p className="text-sm font-semibold" style={{ color: C.text }}>{b.guest}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>{b.checkIn} → {b.checkOut} · {nights} night{nights !== 1 ? "s" : ""} · {b.source === "airbnb" ? "Airbnb" : "Local"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                {hasOpenIssue && <div className="w-2 h-2 rounded-full" style={{ background: "var(--accent, #111111)" }} />}
                <span className="text-sm font-semibold" style={{ color: C.text }}>{fmtAmt(b)}</span>
                <Pill tone={b.status === "confirmed" ? "teal" : "amber"}>{b.status === "confirmed" ? "Confirmed" : "Expected"}</Pill>
                <ChevronRight size={14} style={{ color: C.muted, transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
              </div>
            </button>

            {isExpanded && (
              <div className="mt-4 flex flex-col gap-4" style={{ paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                {/* Clickable name opens the detail modal */}
                <button onClick={() => onSelectBooking(b)} className="flex items-center gap-2 w-fit">
                  <p className="text-sm font-semibold" style={{ color: 'var(--accent, #111111)', textDecoration: 'underline', textUnderlineOffset: 3 }}>{b.guest}</p>
                  <ExternalLink size={13} style={{ color: 'var(--accent, #111111)' }} />
                </button>
                {canEdit && (
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => onSchedule(dayOfMonth(b.checkIn))} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full" style={{ background: C.teal, color: "#fff" }}>
                      <ClipboardList size={12} /> Add schedule
                    </button>
                    <button onClick={() => onLogIssue(dayOfMonth(b.checkIn), b.guest)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full" style={{ background: "var(--accent-soft, rgba(0,0,0,0.07))", color: "var(--accent, #111111)" }}>
                      <AlertTriangle size={12} /> Log issue
                    </button>
                    <button onClick={() => setEditingBooking(b)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full" style={{ background: C.bg, color: C.text }}>Edit stay</button>
                    {b.status === 'expected' && (
                      <button onClick={() => onConfirmPayout(b.id)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full" style={{ background: C.tealSoft, color: C.teal }}>
                        <Check size={12} /> Confirm payment
                      </button>
                    )}
                    {confirmDeleteId === b.id ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => { onDeleteBooking(b.id); setConfirmDeleteId(null); setExpandedId(null); }} className="text-xs font-semibold px-3 py-2 rounded-full" style={{ background: "var(--accent, #111111)", color: "#fff" }}>Confirm delete</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="text-xs font-semibold" style={{ color: C.muted }}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(b.id)} className="text-xs font-semibold px-3 py-2 rounded-full" style={{ background: C.bg, color: C.muted }}>Delete</button>
                    )}
                  </div>
                )}

                {relatedSchedules.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Schedules during this stay</p>
                    <div className="flex flex-col gap-1.5">
                      {relatedSchedules.map(s => (
                        <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.tealSoft }}>
                          <div>
                            <p className="text-xs font-semibold" style={{ color: C.teal }}>{s.type} · {s.assignedTo}</p>
                            {s.note && <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>{s.note}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: C.muted }}>{s.date}</span>
                            {canEdit && <button onClick={() => setEditingSchedule(s)} className="text-xs font-semibold" style={{ color: C.teal }}>Edit</button>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {relatedIssues.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Issues linked to this guest</p>
                    <div className="flex flex-col gap-1.5">
                      {relatedIssues.map(i => (
                        <div key={i.id} className="flex items-center justify-between py-1.5 px-3 rounded-xl" style={{ background: i.status === "Open" ? "var(--accent-soft, rgba(0,0,0,0.07))" : C.bg }}>
                          <p className="text-xs" style={{ color: C.text }}>{i.description}</p>
                          {i.status && <Pill tone={i.status === "Open" ? "accent" : i.status === "In Progress" ? "amber" : "teal"}>{i.status}</Pill>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
      {editingBooking && (
        <BookingForm booking={editingBooking} onClose={() => setEditingBooking(null)} onEdit={(updated) => { onEditBooking(updated); setEditingBooking(null); }} onAdd={() => {}} properties={properties} defaultPropertyId={editingBooking.propertyId} />
      )}
      {editingSchedule && (
        <ShiftForm date={editingSchedule.date} schedule={editingSchedule} onClose={() => setEditingSchedule(null)} onAdd={() => {}} onEdit={onEditSchedule} properties={properties} defaultPropertyId={editingSchedule.propertyId} team={team} />
      )}
    </div>
  );
}

function BookingsView({ bookings, schedules, issues, onAddBooking, onEditBooking, onDeleteBooking, onConfirmPayout, onAddShift, onEditSchedule, onAddIssue, onToggleIssue, properties, selectedPropertyId, showPropertyTag, team, canEdit, pendingBooking, onClearPendingBooking }) {
  const [view, setView] = useState('Month');
  const [selectedDay, setSelectedDay] = useState(null);
  const [weekStart, setWeekStart] = useState(1);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [shiftFormDate, setShiftFormDate] = useState(null);
  const [issueForm, setIssueForm] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bYear, setBYear] = useState(2026);
  const [bMonth, setBMonth] = useState(6); // 0-indexed, July = 6

  const daysInMonth = new Date(bYear, bMonth + 1, 0).getDate();
  const monthPrefix = `${bYear}-${String(bMonth + 1).padStart(2, '0')}`;
  const monthLabel = `${MONTH_NAMES[bMonth]} ${bYear}`;
  const monthShort = MONTH_NAMES[bMonth].slice(0, 3);

  const goToPrevMonth = () => {
    if (bMonth === 0) { setBYear(y => y - 1); setBMonth(11); }
    else setBMonth(m => m - 1);
    setSelectedDay(null);
    setWeekStart(1);
  };
  const goToNextMonth = () => {
    if (bMonth === 11) { setBYear(y => y + 1); setBMonth(0); }
    else setBMonth(m => m + 1);
    setSelectedDay(null);
    setWeekStart(1);
  };

  // Scope bookings/schedules/issues to the active month
  const monthBookings = bookings.filter(b => b.checkIn.startsWith(monthPrefix) || b.checkOut.startsWith(monthPrefix));
  const monthShifts = schedules.filter(s => s.date.startsWith(monthPrefix));
  const monthIssues = issues.filter(i => i.date.startsWith(monthPrefix));

  // Deep-link from Dashboard: switch to Per stay and open the booking
  useEffect(() => {
    if (pendingBooking) {
      setView('Per stay');
      setSelectedBooking(pendingBooking);
      onClearPendingBooking();
    }
  }, [pendingBooking]);

  const openSchedule = (day) => setShiftFormDate(`${monthPrefix}-${pad2(day)}`);
  const openIssue = (day, guest) => setIssueForm({ date: `${monthPrefix}-${pad2(day)}`, guest: guest || null });

  const activeMonth = { year: bYear, month: bMonth, daysInMonth, monthPrefix, monthLabel, monthShort };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.text }}>Bookings</h1>
          <div className="flex items-center gap-1 mt-1">
            <button onClick={goToPrevMonth} className="p-1 rounded-full" style={{ color: C.muted }}><ChevronLeft size={14} /></button>
            <p className="text-sm font-semibold" style={{ color: C.muted }}>{monthLabel}</p>
            <button onClick={goToNextMonth} className="p-1 rounded-full" style={{ color: C.muted }}><ChevronRight size={14} /></button>
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <button onClick={() => openIssue(1)} className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full" style={{ background: 'var(--accent-soft, rgba(0,0,0,0.07))', color: 'var(--accent, #111111)' }}><AlertTriangle size={16} /> Log issue</button>
            <button onClick={() => setShiftFormDate(`${monthPrefix}-01`)} className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full" style={{ background: C.tealSoft, color: C.teal }}><ClipboardList size={16} /> Add schedule</button>
            <button onClick={() => setShowBookingForm(true)} className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full" style={{ background: 'var(--accent, #111111)', color: '#fff' }}><Plus size={16} /> New booking</button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 rounded-full p-1 w-fit" style={{ background: '#F2F2F2' }}>
        {['Day', 'Week', 'Month', 'Per stay'].map(v => <button key={v} onClick={() => setView(v)} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: view === v ? '#fff' : 'transparent', color: view === v ? C.text : C.muted }}>{v}</button>)}
      </div>
      {view === 'Day' && <DayView bookings={monthBookings} schedules={monthShifts} issues={monthIssues} selectedDay={selectedDay || 1} setSelectedDay={setSelectedDay} onSchedule={openSchedule} onLogIssue={openIssue} onToggleIssue={onToggleIssue} onSelectBooking={setSelectedBooking} properties={properties} showPropertyTag={showPropertyTag} canEdit={canEdit} activeMonth={activeMonth} />}
      {view === 'Week' && <WeekView bookings={monthBookings} schedules={monthShifts} issues={monthIssues} weekStart={weekStart} setWeekStart={setWeekStart} selectedDay={selectedDay} setSelectedDay={setSelectedDay} onSchedule={openSchedule} onLogIssue={openIssue} onToggleIssue={onToggleIssue} onSelectBooking={setSelectedBooking} properties={properties} showPropertyTag={showPropertyTag} canEdit={canEdit} activeMonth={activeMonth} />}
      {view === 'Month' && <MonthView bookings={monthBookings} schedules={monthShifts} issues={monthIssues} selectedDay={selectedDay} setSelectedDay={setSelectedDay} onSchedule={openSchedule} onLogIssue={openIssue} onToggleIssue={onToggleIssue} onSelectBooking={setSelectedBooking} properties={properties} showPropertyTag={showPropertyTag} canEdit={canEdit} activeMonth={activeMonth} />}
      {view === 'Per stay' && <PerStayView bookings={monthBookings} schedules={monthShifts} issues={monthIssues} onSchedule={openSchedule} onLogIssue={openIssue} onEditBooking={onEditBooking} onDeleteBooking={onDeleteBooking} onAddSchedule={onAddShift} onEditSchedule={onEditSchedule} onConfirmPayout={onConfirmPayout} onSelectBooking={setSelectedBooking} properties={properties} showPropertyTag={showPropertyTag} team={team} canEdit={canEdit} />}
      {canEdit && showBookingForm && <BookingForm onClose={() => setShowBookingForm(false)} onAdd={onAddBooking} onEdit={onEditBooking} properties={properties} defaultPropertyId={selectedPropertyId} />}
      {canEdit && shiftFormDate && <ShiftForm date={shiftFormDate} onClose={() => setShiftFormDate(null)} onAdd={onAddShift} properties={properties} defaultPropertyId={selectedPropertyId} team={team} />}
      {canEdit && issueForm && <IssueForm date={issueForm.date} defaultGuest={issueForm.guest} bookings={bookings} onClose={() => setIssueForm(null)} onAdd={onAddIssue} properties={properties} defaultPropertyId={selectedPropertyId} />}
      {selectedBooking && (() => {
        const liveBooking = bookings.find(b => b.id === selectedBooking.id) || selectedBooking;
        return <BookingDetailModal booking={liveBooking} schedules={schedules} issues={issues} properties={properties} showPropertyTag={showPropertyTag} onClose={() => setSelectedBooking(null)} onEdit={onEditBooking} onDelete={(id) => { onDeleteBooking(id); setSelectedBooking(null); }} onConfirm={onConfirmPayout} canEdit={canEdit} />;
      })()}
    </div>
  );
}

function MonthDropdown({ value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(Number(e.target.value))} className="text-sm font-semibold px-2 py-1 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.text, background: C.bg }}>
      {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
    </select>
  );
}

function AddIncomeForm({ onClose, onAdd, defaultDate, properties, defaultPropertyId }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(defaultDate || '2026-07-07');
  const [propertyId, setPropertyId] = useState(defaultPropertyId || properties[0]?.id);
  const canSubmit = description.trim() && parseFloat(amount) > 0;
  const handleAdd = () => {
    if (!canSubmit) return;
    onAdd({ description: description.trim(), amount: parseFloat(amount), date, propertyId, currency: 'GHS' });
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#fff' }}>
        <div className="flex items-center justify-between mb-5">
          <p className="text-lg font-bold" style={{ color: C.text }}>Add income</p>
          <button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button>
        </div>
        <p className="text-xs mb-4" style={{ color: C.muted }}>For money received from owners for repairs, top-ups, or other contributions.</p>
        <div className="flex flex-col gap-3">
          <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Description</label><input value={description} onChange={e => setDescription(e.target.value)} autoFocus className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} placeholder="e.g. Owner contribution for plumbing repair" /></div>
          <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Amount (GHS)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} placeholder="0.00" /></div>
          <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} /></div>
          {properties.length > 1 && (
            <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Property</label><select value={propertyId} onChange={e => setPropertyId(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }}>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          )}
          <button onClick={handleAdd} disabled={!canSubmit} className="w-full text-sm font-semibold py-3 rounded-xl mt-1" style={{ background: canSubmit ? C.teal : C.border, color: canSubmit ? '#fff' : C.muted }}>Add income</button>
        </div>
      </div>
    </div>
  );
}

function SubToggle({ value, onChange, options }) {
  return (
    <div className="flex items-center gap-1 rounded-full p-1 w-fit" style={{ background: '#F2F2F2' }}>
      {options.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)} className="text-xs font-semibold px-4 py-1.5 rounded-full"
          style={{ background: value === o.key ? '#fff' : 'transparent', color: value === o.key ? C.text : C.muted }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function IncomeRow({ label, sublabel, ghsAmount, eurAmount, status, paidAt, showPropertyTag, propertyColor }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.bg }}>
      <div className="flex items-center gap-3">
        {showPropertyTag && <div className="w-2 h-2 rounded-full" style={{ background: propertyColor }} />}
        <div>
          <p className="text-sm font-medium" style={{ color: C.text }}>{label}</p>
          {sublabel && <p className="text-xs" style={{ color: C.muted }}>{sublabel}</p>}
          {paidAt && <p className="text-xs mt-0.5" style={{ color: C.teal }}>Confirmed {paidAt}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          {ghsAmount !== null && <p className="text-sm font-semibold" style={{ color: C.text }}>{fmtGHS(ghsAmount)}</p>}
          {eurAmount !== null && <p className="text-xs" style={{ color: C.muted }}>{fmtEUR(eurAmount)}</p>}
        </div>
        {status && <Pill tone={status === 'confirmed' ? 'teal' : 'amber'}>{status === 'confirmed' ? 'Confirmed' : 'Expected'}</Pill>}
      </div>
    </div>
  );
}

function CurrencyToggle({ value, onChange, currencies }) {
  if (!currencies || currencies.length < 2) return null;
  return (
    <div className="flex items-center gap-1 rounded-full p-1 w-fit" style={{ background: '#F2F2F2' }}>
      {currencies.map(cur => (
        <button key={cur} onClick={() => onChange(cur)} className="text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{ background: value === cur ? '#fff' : 'transparent', color: value === cur ? C.text : C.muted }}>
          {cur}
        </button>
      ))}
    </div>
  );
}

function fmtCurrency(amount, currency) {
  if (currency === 'EUR') return `€${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `GH₵${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function FinancialsView({ expenses, bookings, manualIncome, onAddManualIncome, onAddExpense, properties, selectedPropertyId, showPropertyTag, team, canEdit }) {
  const [tab, setTab] = useState('owner');
  const [ownerCurrency, setOwnerCurrency] = useState('GHS');
  const [oakCurrency, setOakCurrency] = useState('GHS');
  const [ownerSub, setOwnerSub] = useState('income');
  const [oakcoSub, setOakcoSub] = useState('income');
  const [showForm, setShowForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [monthIndex, setMonthIndex] = useState(1);

  // Active property config
  const activeProp = properties.find(p => p.id === selectedPropertyId) || properties[0] || {};
  const propCurrencies = activeProp.currencies || ['GHS'];
  const propAlloc = activeProp.allocation || { GHS: { owners: 60, operations: 15, management: 25 } };
  const prevBalance = activeProp.prevBalance || { GHS: { owners: 9374.21, management: 4200 }, EUR: { owners: 0, management: 0 } };

  // Ensure currency stays valid when property changes
  const ownerCur = propCurrencies.includes(ownerCurrency) ? ownerCurrency : propCurrencies[0];
  const oakCur = propCurrencies.includes(oakCurrency) ? oakCurrency : propCurrencies[0];

  const monthPrefix = MONTH_PREFIXES[monthIndex];

  // Helpers scoped to currency
  const monthBookings = bookings.filter(b => b.checkIn.startsWith(monthPrefix) && b.currency === ownerCur);
  const monthBookingsOak = bookings.filter(b => b.checkIn.startsWith(monthPrefix) && b.currency === oakCur);
  const monthExpenses = expenses.filter(e => e.date.startsWith(monthPrefix) && (e.currency || 'GHS') === ownerCur);
  const monthExpensesOak = expenses.filter(e => e.date.startsWith(monthPrefix) && (e.currency || 'GHS') === oakCur);

  const allocOwner = propAlloc[ownerCur] || { owners: 60, operations: 15, management: 25 };
  const allocOak = propAlloc[oakCur] || { owners: 60, operations: 15, management: 25 };
  const momo = (e) => (e.currency || 'GHS') === 'GHS' ? e.amount * 1.01 : e.amount;

  // Owner tab calculations
  const ownerIncome = monthBookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + b.amount, 0);
  const ownersAlloc = ownerIncome * (allocOwner.owners / 100);
  const opsAlloc = ownerIncome * (allocOwner.operations / 100);
  const ownersExp = monthExpenses.filter(e => e.category === 'owners').reduce((s, e) => s + momo(e), 0);
  const opsExp = monthExpenses.filter(e => e.category === 'operations').reduce((s, e) => s + momo(e), 0);
  const ownersBalance = ownersAlloc - ownersExp;
  const opsBalance = opsAlloc - opsExp;
  const prevOwners = (prevBalance[ownerCur] || {}).owners || 0;
  const ownerRunning = prevOwners + ownersBalance + opsBalance;
  const ownerLineItems = monthExpenses.filter(e => e.category === 'owners' || e.category === 'operations').sort((a, b) => a.date < b.date ? 1 : -1);

  // Owner income rows
  const ownerIncomeRows = monthBookings.map(b => ({
    id: b.id, booking: b,
    ownersAmt: b.amount * (allocOwner.owners / 100),
    opsAmt: b.amount * (allocOwner.operations / 100),
  }));
  const manualIncomeMonth = (manualIncome || []).filter(m => m.date.startsWith(monthPrefix) && (m.currency || 'GHS') === ownerCur);

  // Oak & Co tab calculations
  const oakIncome = monthBookingsOak.filter(b => b.status === 'confirmed').reduce((s, b) => s + b.amount, 0);
  const oakAlloc = oakIncome * (allocOak.management / 100);
  const oakExp = monthExpensesOak.filter(e => e.category === 'oak_co').reduce((s, e) => s + momo(e), 0);
  const oakBalance = oakAlloc - oakExp;
  const prevOak = (prevBalance[oakCur] || {}).management || 0;
  const oakRunning = prevOak + oakBalance;
  const oakExpItems = monthExpensesOak.filter(e => e.category === 'oak_co').sort((a, b) => a.date < b.date ? 1 : -1);
  const oakIncomeRows = monthBookingsOak.map(b => ({ id: b.id, booking: b, amt: b.amount * (allocOak.management / 100) }));

  const fmt = (amt, cur) => fmtCurrency(amt, cur);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: C.text }}>Financials</h1>
        <div className="flex items-center gap-2">
          {canEdit && <button onClick={() => setShowIncomeForm(true)} className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full" style={{ background: C.teal, color: '#fff' }}><Plus size={16} /> Add income</button>}
          {canEdit && <button onClick={() => setShowForm(true)} className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full" style={{ background: 'var(--accent, #111111)', color: '#fff' }}><Plus size={16} /> Add expense</button>}
        </div>
      </div>

      {/* Month switcher */}
      <div className="flex items-center gap-2">
        <button onClick={() => setMonthIndex(Math.max(0, monthIndex - 1))} disabled={monthIndex === 0} className="p-2 rounded-full" style={{ background: C.card, border: `1px solid ${C.border}`, opacity: monthIndex === 0 ? 0.4 : 1 }}><ChevronLeft size={16} style={{ color: C.text }} /></button>
        <span className="text-sm font-semibold w-28 text-center" style={{ color: C.text }}>{MONTHS[monthIndex]}</span>
        <button onClick={() => setMonthIndex(Math.min(2, monthIndex + 1))} disabled={monthIndex === 2} className="p-2 rounded-full" style={{ background: C.card, border: `1px solid ${C.border}`, opacity: monthIndex === 2 ? 0.4 : 1 }}><ChevronRight size={16} style={{ color: C.text }} /></button>
      </div>

      {/* Primary tabs */}
      <div className="flex items-center gap-1 rounded-full p-1 w-fit" style={{ background: '#F2F2F2' }}>
        <button onClick={() => setTab('owner')} className="text-xs font-semibold px-4 py-2 rounded-full" style={{ background: tab === 'owner' ? '#fff' : 'transparent', color: tab === 'owner' ? C.text : C.muted }}>Owner Report</button>
        {canEdit && <button onClick={() => setTab('oakco')} className="text-xs font-semibold px-4 py-2 rounded-full" style={{ background: tab === 'oakco' ? '#fff' : 'transparent', color: tab === 'oakco' ? C.text : C.muted }}>Oak & Co. · Internal</button>}
      </div>

      {/* ── OWNER REPORT ── */}
      {tab === 'owner' && (
        <>
          <CurrencyToggle value={ownerCur} onChange={setOwnerCurrency} currencies={propCurrencies} />

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.muted }}>Owners Fund — {allocOwner.owners}%</p>
              <p className="text-2xl font-bold mt-2" style={{ color: C.text }}>{fmt(ownersAlloc, ownerCur)}</p>
              <div className="flex items-center justify-between text-sm mt-3" style={{ color: C.muted }}><span>Expenses</span><span>-{fmt(ownersExp, ownerCur)}</span></div>
              <div className="flex items-center justify-between text-sm font-semibold mt-1" style={{ color: 'var(--accent, #111111)' }}><span>Balance</span><span>{fmt(ownersBalance, ownerCur)}</span></div>
            </Card>
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.muted }}>Operations Fund — {allocOwner.operations}%</p>
              <p className="text-2xl font-bold mt-2" style={{ color: C.text }}>{fmt(opsAlloc, ownerCur)}</p>
              <div className="flex items-center justify-between text-sm mt-3" style={{ color: C.muted }}><span>Expenses</span><span>-{fmt(opsExp, ownerCur)}</span></div>
              <div className="flex items-center justify-between text-sm font-semibold mt-1" style={{ color: 'var(--accent, #111111)' }}><span>Balance</span><span>{fmt(opsBalance, ownerCur)}</span></div>
            </Card>
          </div>

          <Card style={{ background: C.teal }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.7)' }}>Owners Running Balance — {ownerCur}</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-3xl font-bold" style={{ color: '#fff' }}>{fmt(ownerRunning, ownerCur)}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>prev {fmt(prevOwners, ownerCur)} + this month</p>
            </div>
          </Card>

          <SubToggle value={ownerSub} onChange={setOwnerSub} options={[{ key: 'income', label: 'Income' }, { key: 'expenses', label: 'Expenses' }]} />

          {ownerSub === 'income' && (
            <Card>
              <p className="text-sm font-semibold mb-3" style={{ color: C.text }}>Income — {MONTHS[monthIndex]} ({ownerCur})</p>
              <div className="flex flex-col gap-2">
                {ownerIncomeRows.length === 0 && manualIncomeMonth.length === 0 && <p className="text-sm" style={{ color: C.muted }}>No {ownerCur} income for {MONTHS[monthIndex]}.</p>}
                {ownerIncomeRows.map(r => (
                  <div key={r.id} className="flex flex-col gap-1 py-2 px-3 rounded-xl" style={{ background: C.bg }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium" style={{ color: C.text }}>{r.booking.guest}</p>
                        <p className="text-xs" style={{ color: C.muted }}>{r.booking.checkIn} → {r.booking.checkOut}</p>
                        {r.booking.paidAt && <p className="text-xs" style={{ color: C.teal }}>Confirmed {r.booking.paidAt}</p>}
                      </div>
                      <Pill tone={r.booking.status === 'confirmed' ? 'teal' : 'amber'}>{r.booking.status === 'confirmed' ? 'Confirmed' : 'Expected'}</Pill>
                    </div>
                    <div className="flex gap-4 mt-1">
                      <span className="text-xs" style={{ color: C.muted }}>Owners {allocOwner.owners}%: <span className="font-semibold" style={{ color: C.text }}>{fmt(r.ownersAmt, ownerCur)}</span></span>
                      <span className="text-xs" style={{ color: C.muted }}>Operations {allocOwner.operations}%: <span className="font-semibold" style={{ color: C.text }}>{fmt(r.opsAmt, ownerCur)}</span></span>
                    </div>
                  </div>
                ))}
                {manualIncomeMonth.map(m => (
                  <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.bg }}>
                    <div><p className="text-sm font-medium" style={{ color: C.text }}>{m.description}</p><p className="text-xs" style={{ color: C.muted }}>{m.date}</p></div>
                    <div className="flex items-center gap-2"><Pill tone="muted">Manual</Pill><span className="text-sm font-semibold" style={{ color: C.text }}>{fmt(m.amount, ownerCur)}</span></div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {ownerSub === 'expenses' && (
            <Card>
              <p className="text-sm font-semibold mb-3" style={{ color: C.text }}>Expenses — {MONTHS[monthIndex]} ({ownerCur})</p>
              <div className="flex flex-col gap-2">
                {ownerLineItems.length === 0 && <p className="text-sm" style={{ color: C.muted }}>No {ownerCur} expenses for {MONTHS[monthIndex]}.</p>}
                {ownerLineItems.map(e => (
                  <div key={e.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.bg }}>
                    <div className="flex items-center gap-3"><Pill tone={CATEGORY_TONE[e.category]}>{CATEGORY_LABEL[e.category]}</Pill><p className="text-sm" style={{ color: C.text }}>{e.description}</p></div>
                    <div className="flex items-center gap-3"><span className="text-xs" style={{ color: C.muted }}>{e.date}</span><span className="text-sm font-semibold w-24 text-right" style={{ color: C.text }}>{fmt(momo(e), ownerCur)}</span></div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* ── MANAGEMENT INTERNAL ── */}
      {tab === 'oakco' && canEdit && (
        <>
          <Card style={{ background: 'var(--accent-soft, rgba(0,0,0,0.07))', border: '1px solid rgba(255,90,95,0.2)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--accent, #111111)' }}>Internal only — never visible to owners</p>
          </Card>

          <CurrencyToggle value={oakCur} onChange={setOakCurrency} currencies={propCurrencies} />

          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.muted }}>Oak & Co. Fund — {allocOak.management}%</p>
            <p className="text-2xl font-bold mt-2" style={{ color: C.text }}>{fmt(oakAlloc, oakCur)}</p>
            <div className="flex items-center justify-between text-sm mt-3" style={{ color: C.muted }}><span>Team payments</span><span>-{fmt(oakExp, oakCur)}</span></div>
            <div className="flex items-center justify-between text-sm font-semibold mt-1" style={{ color: 'var(--accent, #111111)' }}><span>Balance</span><span>{fmt(oakBalance, oakCur)}</span></div>
          </Card>

          <Card style={{ background: C.teal }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.7)' }}>Oak & Co. Running Balance — {oakCur}</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-3xl font-bold" style={{ color: '#fff' }}>{fmt(oakRunning, oakCur)}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>prev {fmt(prevOak, oakCur)} + this month</p>
            </div>
          </Card>

          <SubToggle value={oakcoSub} onChange={setOakcoSub} options={[{ key: 'income', label: 'Income' }, { key: 'expenses', label: 'Expenses' }]} />

          {oakcoSub === 'income' && (
            <Card>
              <p className="text-sm font-semibold mb-3" style={{ color: C.text }}>Oak & Co. income — {MONTHS[monthIndex]} ({oakCur})</p>
              <div className="flex flex-col gap-2">
                {oakIncomeRows.length === 0 && <p className="text-sm" style={{ color: C.muted }}>No {oakCur} income for {MONTHS[monthIndex]}.</p>}
                {oakIncomeRows.map(r => (
                  <div key={r.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.bg }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.text }}>{r.booking.guest}</p>
                      <p className="text-xs" style={{ color: C.muted }}>{r.booking.checkIn} → {r.booking.checkOut} · Management {allocOak.management}%</p>
                      {r.booking.paidAt && <p className="text-xs" style={{ color: C.teal }}>Confirmed {r.booking.paidAt}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill tone={r.booking.status === 'confirmed' ? 'teal' : 'amber'}>{r.booking.status === 'confirmed' ? 'Confirmed' : 'Expected'}</Pill>
                      <span className="text-sm font-semibold" style={{ color: C.text }}>{fmt(r.amt, oakCur)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {oakcoSub === 'expenses' && oakExpItems.length > 0 && (
            <Card>
              <p className="text-sm font-semibold mb-3" style={{ color: C.text }}>Team payments — {MONTHS[monthIndex]} ({oakCur})</p>
              <div className="flex flex-col gap-2">
                {oakExpItems.map(e => (
                  <div key={e.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.bg }}>
                    <div className="flex items-center gap-3"><Pill tone="amber">{e.person}</Pill><p className="text-sm" style={{ color: C.text }}>{e.description}</p></div>
                    <div className="flex items-center gap-3"><span className="text-xs" style={{ color: C.muted }}>{e.date}</span><span className="text-sm font-semibold w-24 text-right" style={{ color: C.text }}>{fmt(momo(e), oakCur)}</span></div>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {oakcoSub === 'expenses' && oakExpItems.length === 0 && (
            <p className="text-sm px-1" style={{ color: C.muted }}>No {oakCur} team payments for {MONTHS[monthIndex]}.</p>
          )}
        </>
      )}

      {canEdit && showForm && (
        <ExpenseForm onClose={() => setShowForm(false)} onAdd={onAddExpense} defaultCategory={tab === 'oakco' ? 'oak_co' : 'operations'} defaultCurrency={tab === 'oakco' ? oakCur : ownerCur} defaultDate={`${MONTH_PREFIXES[monthIndex]}-07`} properties={properties} defaultPropertyId={selectedPropertyId} team={team} />
      )}
      {canEdit && showIncomeForm && (
        <AddIncomeForm onClose={() => setShowIncomeForm(false)} onAdd={onAddManualIncome} defaultDate={`${MONTH_PREFIXES[monthIndex]}-07`} properties={properties} defaultPropertyId={selectedPropertyId} />
      )}
    </div>
  );
}

function IssuesView({ issues, schedules, bookings, properties, showPropertyTag, team, canEdit, onSetIssueStatus, onAddIssue, onAddSchedule, onEditSchedule, selectedPropertyId, pendingIssue, onClearPendingIssue }) {
  const [issueTab, setIssueTab] = useState('issues');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Deep-link from Dashboard
  useEffect(() => {
    if (pendingIssue) {
      setIssueTab('issues');
      setSelectedIssue(pendingIssue);
      onClearPendingIssue();
    }
  }, [pendingIssue]);

  const filteredIssues = issues.filter(i => filterStatus === 'all' ? true : i.status === filterStatus)
    .sort((a, b) => a.date < b.date ? 1 : -1);

  const upcomingSchedules = [...schedules].sort((a, b) => a.date < b.date ? -1 : 1);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: C.text }}>Issues & Schedules</h1>
        {canEdit && (
          <div className="flex gap-2">
            <button onClick={() => setShowIssueForm(true)} className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full" style={{ background: 'var(--accent-soft, rgba(0,0,0,0.07))', color: 'var(--accent, #111111)' }}><AlertTriangle size={16} /> Log issue</button>
            <button onClick={() => setShowScheduleForm(true)} className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full" style={{ background: C.teal, color: '#fff' }}><ClipboardList size={16} /> Add schedule</button>
          </div>
        )}
      </div>

      {/* Tab toggle */}
      <div className="flex items-center gap-1 rounded-full p-1 w-fit" style={{ background: '#F2F2F2' }}>
        {['issues', 'schedules'].map(t => (
          <button key={t} onClick={() => setIssueTab(t)} className="text-xs font-semibold px-4 py-1.5 rounded-full capitalize"
            style={{ background: issueTab === t ? '#fff' : 'transparent', color: issueTab === t ? C.text : C.muted }}>
            {t === 'issues' ? 'Issues' : 'Schedules'}
          </button>
        ))}
      </div>

      {/* ── ISSUES ── */}
      {issueTab === 'issues' && (
        <>
          {/* Status filter */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'Open', 'In Progress', 'Resolved'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: filterStatus === s ? C.text : C.bg, color: filterStatus === s ? '#fff' : C.muted, border: `1px solid ${C.border}` }}>
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {filteredIssues.length === 0 && (
              <Card><p className="text-sm" style={{ color: C.muted }}>No issues {filterStatus !== 'all' ? `with status "${filterStatus}"` : 'logged yet'}.</p></Card>
            )}
            {filteredIssues.map(i => (
              <Card key={i.id} style={{ cursor: 'pointer', border: selectedIssue?.id === i.id ? `2px solid ${C.text}` : undefined }}
                onClick={() => setSelectedIssue(selectedIssue?.id === i.id ? null : i)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Pill tone={STATUS_TONE[i.status] || 'muted'}>{i.status || 'Note'}</Pill>
                      <p className="text-sm font-semibold" style={{ color: C.text }}>{i.type}</p>
                    </div>
                    <p className="text-sm" style={{ color: C.muted }}>{i.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {i.guest && <span className="text-xs" style={{ color: C.muted }}>Guest: {i.guest}</span>}
                      <span className="text-xs" style={{ color: C.muted }}>{i.date}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: C.muted, transform: selectedIssue?.id === i.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
                </div>

                {/* Expanded issue detail */}
                {selectedIssue?.id === i.id && canEdit && (
                  <div className="mt-4 pt-4 flex flex-col gap-4" style={{ borderTop: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Change status</p>
                      <div className="flex gap-2 flex-wrap">
                        {STATUS_OPTIONS.map(s => (
                          <button key={s} onClick={() => onSetIssueStatus(i.id, s)} className="text-xs font-semibold px-3 py-2 rounded-full"
                            style={{ background: i.status === s ? (s === 'Open' ? 'var(--accent, #111111)' : s === 'In Progress' ? '#F59E0B' : C.teal) : C.bg, color: i.status === s ? '#fff' : C.text, border: `1px solid ${C.border}` }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    {i.statusHistory?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Status history</p>
                        <div className="flex flex-col gap-0">
                          {[...i.statusHistory].reverse().map((h, idx) => (
                            <div key={idx} className="flex items-start gap-3 pb-3">
                              <div className="flex flex-col items-center">
                                <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: h.status === 'Open' ? 'var(--accent, #111111)' : h.status === 'In Progress' ? '#F59E0B' : C.teal }} />
                                {idx < i.statusHistory.length - 1 && <div className="w-px mt-1" style={{ background: C.border, minHeight: 16 }} />}
                              </div>
                              <div>
                                <p className="text-sm font-semibold" style={{ color: C.text }}>{h.status}</p>
                                <p className="text-xs mt-0.5" style={{ color: C.muted }}>{h.at}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ── SCHEDULES ── */}
      {issueTab === 'schedules' && (
        <div className="flex flex-col gap-3">
          {upcomingSchedules.length === 0 && (
            <Card><p className="text-sm" style={{ color: C.muted }}>No schedules yet.</p></Card>
          )}
          {upcomingSchedules.map(s => (
            <Card key={s.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: C.text }}>{s.type}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                    {s.assignedTo}{s.note ? ` · ${s.note}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold" style={{ color: C.teal }}>{s.date}</span>
                  {showPropertyTag && <div className="w-2 h-2 rounded-full" style={{ background: propColor(properties, s.propertyId) }} />}
                  {canEdit && (
                    <button onClick={() => setEditingSchedule(s)} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: C.bg, color: C.text }}>Edit</button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Forms */}
      {showIssueForm && (
        <IssueForm date={new Date().toISOString().slice(0, 10)} defaultGuest={null} bookings={bookings} onClose={() => setShowIssueForm(false)} onAdd={onAddIssue} properties={properties} defaultPropertyId={selectedPropertyId} />
      )}
      {showScheduleForm && (
        <ShiftForm date={new Date().toISOString().slice(0, 10)} onClose={() => setShowScheduleForm(false)} onAdd={onAddSchedule} onEdit={null} properties={properties} defaultPropertyId={selectedPropertyId} team={team} />
      )}
      {editingSchedule && (
        <ShiftForm date={editingSchedule.date} schedule={editingSchedule} onClose={() => setEditingSchedule(null)} onAdd={() => {}} onEdit={onEditSchedule} properties={properties} defaultPropertyId={editingSchedule.propertyId} team={team} />
      )}
    </div>
  );
}

function TeamMemberDetail({ name, role, expenses, onClose }) {
  const payments = expenses.filter(e => e.category === 'oak_co' && e.person === name).sort((a, b) => (a.date < b.date ? 1 : -1));
  const total = payments.reduce((s, e) => s + e.amount * 1.01, 0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col" style={{ background: '#fff', maxHeight: '80vh' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div><p className="text-lg font-bold" style={{ color: C.text }}>{name}</p><p className="text-xs" style={{ color: C.muted }}>{role}</p></div>
          <button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button>
        </div>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4 p-3 rounded-xl" style={{ background: C.bg }}>
            <span className="text-sm font-semibold" style={{ color: C.text }}>Total paid</span>
            <span className="text-lg font-bold" style={{ color: C.text }}>{fmtGHS(total)}</span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Payment history</p>
          <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 300 }}>
            {payments.length === 0 && <p className="text-sm" style={{ color: C.muted }}>No payments logged yet.</p>}
            {payments.map(e => (
              <div key={e.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: C.bg }}>
                <p className="text-sm" style={{ color: C.text }}>{e.description}</p>
                <div className="flex items-center gap-3"><span className="text-xs" style={{ color: C.muted }}>{e.date}</span><span className="text-sm font-semibold w-24 text-right" style={{ color: C.text }}>{fmtGHS(e.amount * 1.01)}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamMemberForm({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const canSubmit = name.trim() && role.trim();
  const handleSubmit = () => { if (!canSubmit) return; onAdd(name.trim(), role.trim()); onClose(); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#fff' }}>
        <div className="flex items-center justify-between mb-5"><p className="text-lg font-bold" style={{ color: C.text }}>Add team member</p><button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button></div>
        <label className="text-xs font-semibold" style={{ color: C.muted }}>Name</label>
        <input value={name} onChange={e => setName(e.target.value)} autoFocus className="w-full mt-1 mb-4 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} placeholder="e.g. Kojo" />
        <label className="text-xs font-semibold" style={{ color: C.muted }}>Role</label>
        <input value={role} onChange={e => setRole(e.target.value)} className="w-full mt-1 mb-4 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} placeholder="e.g. Cleaner" />
        <button onClick={handleSubmit} disabled={!canSubmit} className="w-full text-sm font-semibold py-3 rounded-xl" style={{ background: canSubmit ? 'var(--accent, #111111)' : C.border, color: canSubmit ? '#fff' : C.muted }}>Add team member</button>
      </div>
    </div>
  );
}

function TeamView({ team, expenses, onAddMember, onDeleteMember }) {
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold" style={{ color: C.text }}>Team</h1><p className="text-sm mt-1" style={{ color: C.muted }}>Click a team member to see their payment history.</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full" style={{ background: 'var(--accent, #111111)', color: '#fff' }}><Plus size={16} /> Add team member</button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {team.map(t => {
          const payments = expenses.filter(e => e.category === 'oak_co' && e.person === t.name);
          const total = payments.reduce((s, e) => s + e.amount * 1.01, 0);
          const last = payments.length ? payments.map(p => p.date).sort().slice(-1)[0] : null;
          return (
            <Card key={t.name}>
              <div onClick={() => setSelected(t.name)} className="cursor-pointer">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-semibold" style={{ color: C.text }}>{t.name}</p><p className="text-xs" style={{ color: C.muted }}>{t.role}</p></div>
                  <p className="text-sm font-bold" style={{ color: C.text }}>{fmtGHS(total)}</p>
                </div>
                <p className="text-xs mt-3" style={{ color: C.muted }}>{last ? `Last payment ${last} · ${payments.length} payment${payments.length !== 1 ? 's' : ''}` : 'No payments yet'}</p>
              </div>
              <div className="flex items-center justify-end mt-3" style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                {confirmDelete === t.name ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: C.muted }}>Remove {t.name}?</span>
                    <button onClick={() => { onDeleteMember(t.name); setConfirmDelete(null); }} className="text-xs font-semibold" style={{ color: 'var(--accent, #111111)' }}>Confirm</button>
                    <button onClick={() => setConfirmDelete(null)} className="text-xs font-semibold" style={{ color: C.muted }}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(t.name)} className="text-xs font-semibold" style={{ color: C.muted }}>Remove</button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      {selected && <TeamMemberDetail name={selected} role={team.find(t => t.name === selected)?.role} expenses={expenses} onClose={() => setSelected(null)} />}
      {showForm && <TeamMemberForm onClose={() => setShowForm(false)} onAdd={onAddMember} />}
    </div>
  );
}

function BookingForm({ onClose, onAdd, onEdit, booking, properties, defaultPropertyId }) {
  const isEdit = !!booking;
  const [guest, setGuest] = useState(booking?.guest || '');
  const [checkIn, setCheckIn] = useState(booking?.checkIn || '');
  const [checkOut, setCheckOut] = useState(booking?.checkOut || '');
  const [source, setSource] = useState(booking?.source || 'airbnb');
  const [amount, setAmount] = useState(booking?.amount?.toString() || '');
  const [currency, setCurrency] = useState(booking?.currency || 'EUR');
  const [propertyId, setPropertyId] = useState(booking?.propertyId || (defaultPropertyId !== 'all' ? defaultPropertyId : properties[0].id));
  const canSubmit = guest.trim() && checkIn && checkOut && amount;
  const handleSubmit = () => {
    if (!canSubmit) return;
    const data = { id: booking?.id || Date.now(), propertyId, guest: guest.trim(), checkIn, checkOut, amount: parseFloat(amount), currency, source, status: booking?.status || 'expected' };
    if (isEdit) onEdit(data); else onAdd(data);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.3)' }}>
      <div className="w-full max-w-sm h-full p-6 overflow-y-auto" style={{ background: '#fff' }}>
        <div className="flex items-center justify-between mb-6"><p className="text-lg font-bold" style={{ color: C.text }}>{isEdit ? 'Edit booking' : 'New booking'}</p><button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button></div>
        <div className="flex flex-col gap-4">
          {properties.length > 1 && (
            <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Property</label><select value={propertyId} onChange={e => setPropertyId(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }}>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          )}
          <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Guest name</label><input value={guest} onChange={e => setGuest(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} placeholder="e.g. Sofia R." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Check-in</label><input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} /></div>
            <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Check-out</label><input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} /></div>
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Source</label>
            <div className="flex gap-2 mt-1">
              <button onClick={() => { setSource('airbnb'); setCurrency('EUR'); }} className="flex-1 text-sm font-medium py-2.5 rounded-xl" style={{ background: source === 'airbnb' ? 'var(--accent-soft, rgba(0,0,0,0.07))' : C.bg, color: source === 'airbnb' ? 'var(--accent, #111111)' : C.muted }}>Airbnb</button>
              <button onClick={() => { setSource('local'); setCurrency('GHS'); }} className="flex-1 text-sm font-medium py-2.5 rounded-xl" style={{ background: source === 'local' ? 'var(--accent-soft, rgba(0,0,0,0.07))' : C.bg, color: source === 'local' ? 'var(--accent, #111111)' : C.muted }}>Local / Cash</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Amount</label><input value={amount} onChange={e => setAmount(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} placeholder="0.00" /></div>
            <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Currency</label><select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }}><option>EUR</option><option>GHS</option></select></div>
          </div>
          <button onClick={handleSubmit} disabled={!canSubmit} className="w-full text-sm font-semibold py-3 rounded-xl mt-2 flex items-center justify-center gap-2" style={{ background: canSubmit ? 'var(--accent, #111111)' : C.border, color: canSubmit ? '#fff' : C.muted }}>
            <CalendarIcon size={16} /> {isEdit ? 'Save changes' : 'Create & sync to Google Calendar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ExpenseForm({ onClose, onAdd, defaultCategory, defaultDate, defaultCurrency, properties, defaultPropertyId, team }) {
  const [date, setDate] = useState(defaultDate || '2026-07-07');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency || 'GHS');
  const [category, setCategory] = useState(defaultCategory || 'operations');
  const [person, setPerson] = useState(team[0]?.name || '');
  const [propertyId, setPropertyId] = useState(defaultPropertyId !== 'all' ? defaultPropertyId : properties[0].id);
  const canSubmit = description.trim() && amount;
  const handleSubmit = () => {
    if (!canSubmit) return;
    onAdd({ id: Date.now(), propertyId, date, description: description.trim(), amount: parseFloat(amount), currency, category, person: category === 'oak_co' ? person : null });
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.3)' }}>
      <div className="w-full max-w-sm h-full p-6 overflow-y-auto" style={{ background: '#fff' }}>
        <div className="flex items-center justify-between mb-6"><p className="text-lg font-bold" style={{ color: C.text }}>Add expense</p><button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button></div>
        <div className="flex flex-col gap-4">
          {properties.length > 1 && (
            <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Property</label><select value={propertyId} onChange={e => setPropertyId(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }}>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          )}
          <div>
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Currency</label>
            <div className="flex gap-2 mt-1">
              {['GHS', 'EUR'].map(cur => <button key={cur} onClick={() => setCurrency(cur)} className="flex-1 text-sm font-semibold py-2.5 rounded-xl" style={{ background: currency === cur ? C.text : C.bg, color: currency === cur ? '#fff' : C.muted }}>{cur}</button>)}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Category</label>
            <div className="flex gap-2 mt-1">
              {['owners', 'operations', 'oak_co'].map(cat => <button key={cat} onClick={() => setCategory(cat)} className="flex-1 text-xs font-semibold py-2.5 rounded-xl" style={{ background: category === cat ? 'var(--accent-soft, rgba(0,0,0,0.07))' : C.bg, color: category === cat ? 'var(--accent, #111111)' : C.muted }}>{CATEGORY_LABEL[cat]}</button>)}
            </div>
          </div>
          {category === 'oak_co' && (
            <div>
              <label className="text-xs font-semibold" style={{ color: C.muted }}>Team member</label>
              <select value={person} onChange={e => setPerson(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }}>{team.map(t => <option key={t.name}>{t.name}</option>)}</select>
              <p className="text-xs mt-1" style={{ color: C.muted }}>This payment will show up on {person}'s page in Team.</p>
            </div>
          )}
          <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} /></div>
          <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Description</label><input value={description} onChange={e => setDescription(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} placeholder="e.g. ECG, Cleaning — turnover" /></div>
          <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Amount ({currency})</label><input value={amount} onChange={e => setAmount(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} placeholder="0.00" /></div>
          <p className="text-xs" style={{ color: C.muted }}>MoMo charge (1%) is added automatically for GHS expenses.</p>
          <button onClick={handleSubmit} disabled={!canSubmit} className="w-full text-sm font-semibold py-3 rounded-xl mt-1 flex items-center justify-center gap-2" style={{ background: canSubmit ? 'var(--accent, #111111)' : C.border, color: canSubmit ? '#fff' : C.muted }}><DollarSign size={16} /> Log expense</button>
        </div>
      </div>
    </div>
  );
}

function ShiftForm({ date, schedule, onClose, onAdd, onEdit, properties, defaultPropertyId, team }) {
  const isEdit = !!schedule;
  const [type, setType] = useState(schedule?.type || 'Cleaning');
  const [shiftDate, setShiftDate] = useState(schedule?.date || date);
  const [assignedTo, setAssignedTo] = useState(schedule?.assignedTo || team[0]?.name || '');
  const [note, setNote] = useState(schedule?.note || '');
  const [propertyId, setPropertyId] = useState(schedule?.propertyId || (defaultPropertyId !== 'all' ? defaultPropertyId : properties[0].id));
  const handleSubmit = () => {
    const data = { id: schedule?.id || Date.now(), propertyId, type, date: shiftDate, assignedTo, note: note.trim() };
    if (isEdit && onEdit) onEdit(data); else onAdd(data);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.3)' }}>
      <div className="w-full max-w-sm h-full p-6 overflow-y-auto" style={{ background: '#fff' }}>
        <div className="flex items-center justify-between mb-6"><p className="text-lg font-bold" style={{ color: C.text }}>{isEdit ? 'Edit schedule' : 'Add schedule'}</p><button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button></div>
        <div className="flex flex-col gap-4">
          {properties.length > 1 && (
            <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Property</label><select value={propertyId} onChange={e => setPropertyId(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }}>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          )}
          <div>
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Type</label>
            <div className="grid grid-cols-2 gap-2 mt-1">{SHIFT_TYPES.map(t => <button key={t} onClick={() => setType(t)} className="text-xs font-semibold py-2.5 rounded-xl" style={{ background: type === t ? C.tealSoft : C.bg, color: type === t ? C.teal : C.muted }}>{t}</button>)}</div>
          </div>
          <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Date</label><input type="date" value={shiftDate} onChange={e => setShiftDate(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} /></div>
          <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Assigned to</label><select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }}>{team.map(t => <option key={t.name}>{t.name}</option>)}</select></div>
          <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Note (optional)</label><input value={note} onChange={e => setNote(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} placeholder="e.g. Turnover for Sofia R." /></div>
          <button onClick={handleSubmit} className="w-full text-sm font-semibold py-3 rounded-xl mt-1 flex items-center justify-center gap-2" style={{ background: C.teal, color: '#fff' }}><ClipboardList size={16} /> {isEdit ? 'Save changes' : 'Add schedule'}</button>
        </div>
      </div>
    </div>
  );
}

function IssueForm({ date, defaultGuest, bookings, onClose, onAdd, properties, defaultPropertyId }) {
  const [type, setType] = useState(defaultGuest ? 'Guest Complaint' : 'Maintenance');
  const [issueDate, setIssueDate] = useState(date);
  const [description, setDescription] = useState('');
  const [guest, setGuest] = useState(defaultGuest || '');
  const [propertyId, setPropertyId] = useState(defaultPropertyId !== 'all' ? defaultPropertyId : properties[0].id);
  const canSubmit = description.trim();
  const handleSubmit = () => {
    if (!canSubmit) return;
    onAdd({ id: Date.now(), propertyId, date: issueDate, type, description: description.trim(), guest: guest || null, status: type === 'Note' ? null : 'Open' });
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.3)' }}>
      <div className="w-full max-w-sm h-full p-6 overflow-y-auto" style={{ background: '#fff' }}>
        <div className="flex items-center justify-between mb-6"><p className="text-lg font-bold" style={{ color: C.text }}>Log an issue</p><button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button></div>
        <div className="flex flex-col gap-4">
          {properties.length > 1 && (
            <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Property</label><select value={propertyId} onChange={e => setPropertyId(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }}>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          )}
          <div>
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Type</label>
            <div className="flex gap-2 mt-1">
              {ISSUE_TYPES.map(t => <button key={t} onClick={() => setType(t)} className="flex-1 text-xs font-semibold py-2.5 rounded-xl" style={{ background: type === t ? 'var(--accent-soft, rgba(0,0,0,0.07))' : C.bg, color: type === t ? 'var(--accent, #111111)' : C.muted }}>{t}</button>)}
            </div>
          </div>
          <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Date</label><input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} /></div>
          <div>
            <label className="text-xs font-semibold" style={{ color: C.muted }}>Related guest (optional)</label>
            <select value={guest} onChange={e => setGuest(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }}>
              <option value="">None</option>
              {bookings.map(b => <option key={b.id} value={b.guest}>{b.guest}</option>)}
            </select>
          </div>
          <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} placeholder="What happened?" /></div>
          <button onClick={handleSubmit} disabled={!canSubmit} className="w-full text-sm font-semibold py-3 rounded-xl mt-1 flex items-center justify-center gap-2" style={{ background: canSubmit ? 'var(--accent, #111111)' : C.border, color: canSubmit ? '#fff' : C.muted }}><AlertTriangle size={16} /> Log issue</button>
        </div>
      </div>
    </div>
  );
}

function GenerateReportModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#fff' }}>
        <div className="flex items-center justify-between mb-1"><p className="text-lg font-bold" style={{ color: C.text }}>Generate report</p><button onClick={onClose}><X size={20} style={{ color: C.muted }} /></button></div>
        <p className="text-sm mb-5" style={{ color: C.muted }}>Choose a date range to generate the report for.</p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div><label className="text-xs font-semibold" style={{ color: C.muted }}>From</label><input type="date" defaultValue="2026-07-01" className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} /></div>
          <div><label className="text-xs font-semibold" style={{ color: C.muted }}>To</label><input type="date" defaultValue="2026-07-31" className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} /></div>
        </div>
        <div className="flex flex-col gap-2 mb-5">
          <label className="flex items-center gap-2 text-sm" style={{ color: C.text }}><input type="checkbox" defaultChecked /> Owner Report (Owners + Operations)</label>
          <label className="flex items-center gap-2 text-sm" style={{ color: C.text }}><input type="checkbox" /> Oak & Co. internal report</label>
        </div>
        <button className="w-full text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-2" style={{ background: 'var(--accent, #111111)', color: '#fff' }}><FileText size={16} /> Generate PDF</button>
      </div>
    </div>
  );
}

function LoginPage({ onLogin, users }) {
  const [showPw, setShowPw] = useState(false);
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('cecilia@asarehouse.com');

  const handleSignIn = () => {
    const match = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    onLogin(match || users[0]);
  };

  return (
    <div className="w-full flex items-center justify-center" style={{ background: C.bg, minHeight: '100vh' }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <p className="text-xl font-bold" style={{ color: C.text }}>MNGO</p>
          <p className="text-xs font-medium mt-1" style={{ color: C.muted }}>Booking tracking, reporting and owner insights</p>
        </div>
        <Card>
          {mode === 'signin' ? (
            <div className="flex flex-col gap-4">
              <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Email</label><div className="relative mt-1"><Mail size={15} style={{ position: 'absolute', left: 12, top: 12, color: C.muted }} /><input value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} placeholder="cecilia@example.com" /></div></div>
              <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Password</label><div className="relative mt-1"><Lock size={15} style={{ position: 'absolute', left: 12, top: 12, color: C.muted }} /><input type={showPw ? 'text' : 'password'} className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} placeholder="••••••••" defaultValue="password123" /><button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: 12, color: C.muted }}>{showPw ? <EyeOff size={15} /> : <Eye size={15} />}</button></div></div>
              <div className="flex justify-end"><span className="text-xs font-medium" style={{ color: KAYLA_LOGIN }}>Forgot password?</span></div>
              <button onClick={handleSignIn} className="w-full text-sm font-semibold py-3 rounded-xl mt-1" style={{ background: KAYLA_LOGIN, color: '#fff' }}>Sign in</button>
              <p className="text-xs text-center mt-1" style={{ color: C.muted }}>New here? <button onClick={() => setMode('signup')} className="font-semibold" style={{ color: KAYLA_LOGIN }}>Sign up</button></p>
              <p className="text-xs text-center" style={{ color: C.muted }}>Mock login — try an invited owner's email to preview their view.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Full name</label><input className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} placeholder="e.g. Cecilia Owusu" /></div>
              <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Email</label><div className="relative mt-1"><Mail size={15} style={{ position: 'absolute', left: 12, top: 12, color: C.muted }} /><input className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} placeholder="you@example.com" /></div></div>
              <div><label className="text-xs font-semibold" style={{ color: C.muted }}>Password</label><div className="relative mt-1"><Lock size={15} style={{ position: 'absolute', left: 12, top: 12, color: C.muted }} /><input type={showPw ? 'text' : 'password'} className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.border}` }} placeholder="Create a password" /><button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: 12, color: C.muted }}>{showPw ? <EyeOff size={15} /> : <Eye size={15} />}</button></div></div>
              <button onClick={() => onLogin(users[0])} className="w-full text-sm font-semibold py-3 rounded-xl mt-1" style={{ background: KAYLA_LOGIN, color: '#fff' }}>Create account</button>
              <p className="text-xs text-center mt-1" style={{ color: C.muted }}>Already have an account? <button onClick={() => setMode('signin')} className="font-semibold" style={{ color: KAYLA_LOGIN }}>Sign in</button></p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function AsareHouseManager() {
  const [appState, setAppState] = useState('loading');
  const [nav, setNav] = useState('dashboard');
  const [navHistory, setNavHistory] = useState(['dashboard']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [tabsOpen, setTabsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
  const [manualIncome, setManualIncome] = useState([]);
  const addManualIncome = (entry) => setManualIncome(prev => [...prev, { ...entry, id: `mi-${Date.now()}` }]);
  const [schedules, setShifts] = useState(INITIAL_SHIFTS);
  const [issues, setIssues] = useState(INITIAL_ISSUES);
  const [properties, setProperties] = useState(INITIAL_PROPERTIES);
  const [team, setTeam] = useState(INITIAL_TEAM);
  const [selectedPropertyId, setSelectedPropertyId] = useState('all');
  const [users, setUsers] = useState([
    { id: 'u1', name: 'Cecilia', email: 'cecilia@oakandco.com', role: 'manager' },
    { id: 'u2', name: 'Prince', email: 'prince@email.com', role: 'owner' },
    { id: 'u3', name: 'Pamela', email: 'pamela@email.com', role: 'owner' },
  ]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => { const t = setTimeout(() => setAppState('login'), 4000); return () => clearTimeout(t); }, []);

  const addBooking = (b) => setBookings(prev => [...prev, b]);
  const editBooking = (updated) => setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
  const deleteBooking = (id) => setBookings(prev => prev.filter(b => b.id !== id));
  const confirmPayout = (id) => {
    const today = new Date().toISOString().slice(0, 10);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed', paidAt: today } : b));
  };
  const addExpense = (e) => setExpenses(prev => [...prev, e]);
  const addShift = (s) => setShifts(prev => [...prev, s]);
  const editShift = (updated) => setShifts(prev => prev.map(s => s.id === updated.id ? updated : s));
  const addIssue = (i) => setIssues(prev => [...prev, { ...i, statusHistory: i.status ? [{ status: i.status, at: new Date().toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '') }] : [] }]);
  const toggleIssue = (id) => {
    const now = new Date().toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '');
    setIssues(prev => prev.map(i => {
      if (i.id !== id) return i;
      const next = i.status === 'Open' ? 'Resolved' : 'Open';
      return { ...i, status: next, statusHistory: [...(i.statusHistory || []), { status: next, at: now }] };
    }));
  };
  const setIssueStatus = (id, newStatus) => {
    const now = new Date().toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '');
    setIssues(prev => prev.map(i => {
      if (i.id !== id) return i;
      return { ...i, status: newStatus, statusHistory: [...(i.statusHistory || []), { status: newStatus, at: now }] };
    }));
  };
  const addProperty = (name) => {
    const newProp = { id: `prop-${Date.now()}`, name, color: PALETTE[properties.length % PALETTE.length], rooms: [], facilities: [] };
    setProperties(prev => [...prev, newProp]);
    setSelectedPropertyId(newProp.id);
  };
  const deleteProperty = (id) => {
    if (properties.length <= 1) return;
    setProperties(prev => prev.filter(p => p.id !== id));
    if (selectedPropertyId === id) setSelectedPropertyId('all');
  };
  const updateProperty = (updated) => setProperties(prev => prev.map(p => p.id === updated.id ? updated : p));
  const addTeamMember = (name, role) => setTeam(prev => [...prev, { name, role }]);
  const deleteTeamMember = (name) => setTeam(prev => prev.length > 1 ? prev.filter(t => t.name !== name) : prev);
  const inviteOwner = (name, email) => setUsers(prev => [...prev, { id: `u-${Date.now()}`, name, email, role: 'owner' }]);
  const revokeAccess = (id) => setUsers(prev => prev.filter(u => u.id !== id));

  const goTo = (key) => {
    const truncated = navHistory.slice(0, historyIndex + 1);
    setNavHistory([...truncated, key]);
    setHistoryIndex(truncated.length);
    setNav(key);
  };
  const goBack = () => { if (historyIndex === 0) return; const i = historyIndex - 1; setHistoryIndex(i); setNav(navHistory[i]); };
  const goForward = () => { if (historyIndex >= navHistory.length - 1) return; const i = historyIndex + 1; setHistoryIndex(i); setNav(navHistory[i]); };

  const showPropertyTag = properties.length > 1;
  const activeColor = selectedPropertyId !== 'all' ? propColor(properties, selectedPropertyId) : '#111111';
  const activeColorSoft = withAlpha(activeColor, 0.1);
  const filteredBookings = selectedPropertyId === 'all' ? bookings : bookings.filter(b => b.propertyId === selectedPropertyId);
  const filteredExpenses = selectedPropertyId === 'all' ? expenses : expenses.filter(e => e.propertyId === selectedPropertyId);
  const filteredShifts = selectedPropertyId === 'all' ? schedules : schedules.filter(s => s.propertyId === selectedPropertyId);
  const filteredIssues = selectedPropertyId === 'all' ? issues : issues.filter(i => i.propertyId === selectedPropertyId);
  const canEdit = currentUser?.role === 'manager';
  const visibleNavItems = canEdit ? NAV_ITEMS : NAV_ITEMS.filter(i => i.key !== 'team');
  const [pendingIssue, setPendingIssue] = useState(null);
  const [previewUser, setPreviewUser] = useState(null);

  // When in preview mode, substitute the preview user for currentUser everywhere
  const effectiveUser = previewUser || currentUser;
  const effectiveCanEdit = !previewUser && canEdit;
  const effectiveNavItems = effectiveCanEdit ? NAV_ITEMS : NAV_ITEMS.filter(i => i.key !== 'team');

  const handleLogin = (user) => { setCurrentUser(user); setAppState('app'); if (nav === 'team' && user.role !== 'manager') setNav('dashboard'); };

  const exitPreview = () => { setPreviewUser(null); setNav('dashboard'); };

  return (
    <div style={{ fontFamily: FONT_FAMILY, width: '100%', height: '100vh', '--accent': activeColor, '--accent-soft': activeColorSoft }}>
      <style>{FONT_IMPORT}</style>

      {appState === 'loading' && <LoadingScreen />}
      {appState === 'login' && <LoginPage onLogin={handleLogin} users={users} />}

      {appState === 'app' && (
        <div className="flex flex-col w-full" style={{ background: C.bg, height: '100vh' }}>
          {/* Preview banner */}
          {previewUser && (
            <div className="flex items-center justify-between px-6 py-2.5 flex-shrink-0" style={{ background: '#FEF9C3', borderBottom: '1px solid #FDE68A' }}>
              <div className="flex items-center gap-2">
                <Eye size={14} style={{ color: '#92400E' }} />
                <p className="text-xs font-semibold" style={{ color: '#92400E' }}>Previewing as {previewUser.name} — Owner view only</p>
              </div>
              <button onClick={exitPreview} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: '#92400E', color: '#fff' }}>
                Exit preview
              </button>
            </div>
          )}
          <TopBar
            nav={nav} goTo={goTo} onSignOut={() => setAppState('login')} onOpenProfile={() => setShowProfile(true)}
            tabsOpen={tabsOpen} setTabsOpen={setTabsOpen}
            canGoBack={historyIndex > 0} canGoForward={historyIndex < navHistory.length - 1}
            onBack={goBack} onForward={goForward}
            onOpenSearch={() => setSearchOpen(true)}
            onGenerateReport={() => setShowReportModal(true)}
            properties={properties} selectedPropertyId={selectedPropertyId} setSelectedPropertyId={setSelectedPropertyId} onAddProperty={addProperty} onDeleteProperty={deleteProperty} onUpdateProperty={updateProperty}
            navItems={effectiveNavItems} canEdit={effectiveCanEdit} currentUser={effectiveUser}
          />
          <div className="flex flex-1 overflow-hidden">
            {tabsOpen && <TabsSidebar nav={nav} goTo={goTo} onGenerateReport={() => setShowReportModal(true)} onOpenProfile={() => setShowProfile(true)} onSignOut={() => setAppState('login')} navItems={effectiveNavItems} />}
            <div className="flex-1 p-8 overflow-y-auto">
              {nav === 'dashboard' && <Dashboard bookings={filteredBookings} schedules={filteredShifts} issues={filteredIssues} expenses={filteredExpenses} properties={properties} showPropertyTag={showPropertyTag} onConfirmPayout={confirmPayout} currentUser={effectiveUser} canEdit={effectiveCanEdit} onSetIssueStatus={setIssueStatus} onViewBooking={(b) => { setPendingBooking(b); goTo('bookings'); }} onOpenIssue={(issue) => { setPendingIssue(issue); goTo('issues'); }} />}
              {nav === 'bookings' && <BookingsView bookings={filteredBookings} schedules={filteredShifts} issues={filteredIssues} onAddBooking={addBooking} onEditBooking={editBooking} onDeleteBooking={deleteBooking} onConfirmPayout={confirmPayout} onAddShift={addShift} onEditSchedule={editShift} onAddIssue={addIssue} onToggleIssue={toggleIssue} properties={properties} selectedPropertyId={selectedPropertyId} showPropertyTag={showPropertyTag} team={team} canEdit={effectiveCanEdit} pendingBooking={pendingBooking} onClearPendingBooking={() => setPendingBooking(null)} />}
              {nav === 'financials' && <FinancialsView expenses={filteredExpenses} bookings={filteredBookings} manualIncome={manualIncome} onAddManualIncome={addManualIncome} onAddExpense={addExpense} properties={properties} selectedPropertyId={selectedPropertyId} showPropertyTag={showPropertyTag} team={team} canEdit={effectiveCanEdit} />}
              {nav === 'issues' && <IssuesView issues={filteredIssues} schedules={filteredShifts} bookings={filteredBookings} properties={properties} showPropertyTag={showPropertyTag} team={team} canEdit={effectiveCanEdit} onSetIssueStatus={setIssueStatus} onAddIssue={addIssue} onAddSchedule={addShift} onEditSchedule={editShift} selectedPropertyId={selectedPropertyId} pendingIssue={pendingIssue} onClearPendingIssue={() => setPendingIssue(null)} />}
              {nav === 'team' && effectiveCanEdit && <TeamView team={team} expenses={filteredExpenses} onAddMember={addTeamMember} onDeleteMember={deleteTeamMember} />}
            </div>
          </div>
          {showReportModal && <GenerateReportModal onClose={() => setShowReportModal(false)} />}
          {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} bookings={filteredBookings} team={team} goTo={goTo} />}
          {showProfile && <ProfileModal properties={properties} currentUser={currentUser} users={users} onInvite={inviteOwner} onRevoke={revokeAccess} onClose={() => setShowProfile(false)} onSignOut={() => { setShowProfile(false); setAppState('login'); }} onPreviewAs={(u) => { setPreviewUser(u); setNav('dashboard'); }} />}
        </div>
      )}
    </div>
  );
}
