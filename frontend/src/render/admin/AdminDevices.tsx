import { useState } from 'react';
import type { FormEvent } from 'react';
import { CircleAlert, MapPin, Package, Search, Plus, History, Warehouse, Wrench, X, Link2 } from 'lucide-react';
import { recordAdminAction } from './adminAudit';

type DeviceType = 'Camera' | 'DL GPS';
type Status = 'Tồn kho' | 'Đang lắp đặt' | 'Đang sử dụng' | 'Lỗi' | 'Bảo hành' | 'Lỗi/Bảo hành';
type Entry = { time: string; detail: string };
type Device = { id: string; imei: string; serial: string; type: DeviceType; received: string; status: Status; tenantId: string; vehicle: string; history: Entry[] };
type Tenant = { id: string; name: string };
const key = 'sys_admin_inventory_demo_v1';
const statuses: Status[] = ['Tồn kho', 'Đang lắp đặt', 'Đang sử dụng', 'Lỗi', 'Bảo hành'];
const summaryStatuses = ['Tồn kho', 'Đang lắp đặt', 'Đang sử dụng', 'Lỗi/Bảo hành'] as const;
const statusIcons: Record<(typeof summaryStatuses)[number], typeof Package> = {
  'Tồn kho': Warehouse,
  'Đang lắp đặt': Wrench,
  'Đang sử dụng': MapPin,
  'Lỗi/Bảo hành': CircleAlert,
};
const demo: Device[] = [
  { id: 'demo-1', imei: '356938035643809', serial: 'CAM-DL-001', type: 'Camera', received: '2026-10-15', status: 'Đang sử dụng', tenantId: 'COMPANY_A', vehicle: '29A-111.11', history: [{time: '2026-10-16T09:00:00', detail: 'Đã liên kết với Demo CTY A · xe 29A-111.11'}] },
  { id: 'demo-2', imei: '356938035643817', serial: 'GPS-DL-002', type: 'DL GPS', received: '2026-11-01', status: 'Tồn kho', tenantId: '', vehicle: '', history: [{time: '2026-11-01T09:00:00', detail: 'Nhập thiết bị vào kho'}] },
  { id: 'demo-3', imei: '356938035643825', serial: 'CAM-DL-003', type: 'Camera', received: '2026-11-05', status: 'Bảo hành', tenantId: 'COMPANY_B', vehicle: '43A-112.22', history: [{time: '2026-11-10T09:00:00', detail: 'Chuyển thiết bị sang bảo hành'}] },
];
const input = 'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500';
const blank = { imei: '', serial: '', type: 'Camera' as DeviceType, received: '', status: 'Tồn kho' as Status, tenantId: '', vehicle: '' };
function readDevices(): Device[] {
  const raw = localStorage.getItem(key);
  if (!raw) return demo;
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error('Dữ liệu không hợp lệ');
  return data.map((device: Omit<Device, 'type' | 'status'> & { type: string; status: string }) => ({
    ...device,
    type: device.type === 'AI Camera' ? 'Camera' : device.type === 'GPS Tracker' ? 'DL GPS' : device.type,
    status: device.status === 'Trong kho' ? 'Tồn kho' : device.status,
  })) as Device[];
}
function readTenants(): Tenant[] { try { const data: unknown = JSON.parse(localStorage.getItem('sys_tenants') || '[]'); return Array.isArray(data) ? data.filter(t => typeof t.id === 'string' && typeof t.name === 'string') : []; } catch { return []; } }

export default function AdminDevices() {
  const [devices, setDevices] = useState<Device[]>(() => { try { return readDevices(); } catch { return []; } });
  const [error, setError] = useState(() => { try { readDevices(); return ''; } catch { return 'Không thể đọc dữ liệu thiết bị trên trình duyệt.'; } });
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState(''); const [type, setType] = useState('ALL'); const [status, setStatus] = useState('ALL'); const [tenant, setTenant] = useState('ALL');
  const [adding, setAdding] = useState(false); const [form, setForm] = useState(blank);
  const [selected, setSelected] = useState<string | null>(null);
  const [linkTarget, setLinkTarget] = useState<string | null>(null); const [linkTenant, setLinkTenant] = useState(''); const [linkVehicle, setLinkVehicle] = useState('');
  const tenants = readTenants();
  const tenantName = (id: string) => tenants.find(t => t.id === id)?.name || (id ? `Doanh nghiệp ${id}` : 'Chưa liên kết');
  const selectedDevice = devices.find(d => d.id === selected);
  const filtered = devices.filter(d => [d.imei, d.serial, d.vehicle].some(v => v.toLowerCase().includes(search.trim().toLowerCase())) && (type === 'ALL' || d.type === type) && (status === 'ALL' || d.status === status) && (tenant === 'ALL' || d.tenantId === tenant));
  const save = (next: Device[], message: string, audit: string) => { try { localStorage.setItem(key, JSON.stringify(next)); setDevices(next); setError(''); setNotice(message); recordAdminAction('THIẾT BỊ', audit); return true; } catch { setError('Không thể lưu dữ liệu thiết bị trên trình duyệt.'); return false; } };
  const add = (event: FormEvent) => {
    event.preventDefault(); const imei = form.imei.trim(); const serial = form.serial.trim();
    if (!/^\d{15}$/.test(imei)) { setError('IMEI phải gồm 15 chữ số.'); return; }
    if (!serial) { setError('Vui lòng nhập Serial Number.'); return; }
    if (devices.some(d => d.imei === imei || d.serial.toLowerCase() === serial.toLowerCase())) { setError('IMEI hoặc Serial Number đã tồn tại.'); return; }
    const entry: Device = { ...form, imei, serial, id: `device-${Date.now()}-${Math.random().toString(36).slice(2)}`, history: [{time: new Date().toISOString(), detail: `Nhập thiết bị · trạng thái ${form.status}`}] };
    if (save([entry, ...devices], 'Đã thêm thiết bị.', `Thêm thiết bị ${serial}`)) { setAdding(false); setForm(blank); }
  };
  const changeStatus = (device: Device, next: Status) => {
    if (next === device.status) return;
    const detail = `Chuyển trạng thái: ${device.status} → ${next}`;
    save(devices.map(d => d.id === device.id ? {...d, status: next, history: [{time: new Date().toISOString(), detail}, ...d.history]} : d), 'Đã cập nhật trạng thái.', `${device.serial}: ${detail}`);
  };
  const updateLink = (event: FormEvent) => {
    event.preventDefault(); const device = devices.find(d => d.id === linkTarget); if (!device) return;
    const vehicle = linkVehicle.trim().toUpperCase();
    if (vehicle && !linkTenant) { setError('Vui lòng chọn doanh nghiệp trước khi nhập phương tiện.'); return; }
    if (linkTenant && !tenants.some(t => t.id === linkTenant)) { setError('Doanh nghiệp không còn tồn tại.'); return; }
    const detail = linkTenant ? `Liên kết với ${tenantName(linkTenant)}${vehicle ? ` · xe ${vehicle}` : ''}` : 'Đã tháo liên kết doanh nghiệp và phương tiện';
    if (save(devices.map(d => d.id === device.id ? {...d, tenantId: linkTenant, vehicle, history: [{time: new Date().toISOString(), detail}, ...d.history]} : d), 'Đã cập nhật liên kết.', `${device.serial}: ${detail}`)) setLinkTarget(null);
  };
  return <main className="p-5 sm:p-8"><div className="mx-auto max-w-7xl">
    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Trang chủ / <span className="text-red-600">Camera & Định vị</span></p>
    <div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-extrabold text-slate-900">Camera & Định vị</h1><p className="mt-2 text-sm text-slate-500">Quản lý kho Camera và DL GPS.</p></div><button onClick={() => { setAdding(true); setError(''); setNotice(''); }} className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700"><Plus className="h-4 w-4"/> Thêm thiết bị</button></div>
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}{notice && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    <div className="my-6 grid grid-cols-2 gap-3 lg:grid-cols-5">{[{label:'Tổng thiết bị', count:devices.length, icon:Package}, ...summaryStatuses.map(s => ({label:s, count:devices.filter(d => s === 'Lỗi/Bảo hành' ? ['Lỗi', 'Bảo hành', 'Lỗi/Bảo hành'].includes(d.status) : d.status === s).length, icon:statusIcons[s]}))].map(({label,count,icon:Icon}) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex justify-between gap-2 text-xs font-bold text-slate-500"><span>{label}</span><Icon className="h-4 w-4 shrink-0 text-red-500"/></div><p className="mt-3 text-2xl font-extrabold text-slate-900">{count}</p></div>)}</div>
    <section className="rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 p-5"><h2 className="text-lg font-bold">Danh sách thiết bị</h2><p className="mt-1 text-sm text-slate-500">{filtered.length} / {devices.length} thiết bị</p><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><label className="relative"><span className="sr-only">Tìm kiếm thiết bị</span><Search className="absolute left-3 top-3 h-5 w-5 text-slate-400"/><input className={`${input} pl-10`} placeholder="IMEI, serial hoặc biển số" value={search} onChange={e => setSearch(e.target.value)}/></label><label><span className="sr-only">Loại thiết bị</span><select className={input} value={type} onChange={e => setType(e.target.value)}><option value="ALL">Tất cả loại</option><option>Camera</option><option>DL GPS</option></select></label><label><span className="sr-only">Trạng thái</span><select className={input} value={status} onChange={e => setStatus(e.target.value)}><option value="ALL">Tất cả trạng thái</option>{statuses.map(s => <option key={s}>{s}</option>)}{devices.some(d => d.status === 'Lỗi/Bảo hành') && <option value="Lỗi/Bảo hành">Lỗi/Bảo hành (chưa phân loại)</option>}</select></label><label><span className="sr-only">Doanh nghiệp</span><select className={input} value={tenant} onChange={e => setTenant(e.target.value)}><option value="ALL">Tất cả doanh nghiệp</option><option value="">Chưa liên kết</option>{tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label></div></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{['Thiết bị','IMEI / Serial Number','Ngày nhập','Trạng thái','Doanh nghiệp / Phương tiện','Thao tác'].map(h => <th key={h} className="px-5 py-4">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.map(d => <tr key={d.id}><td className="px-5 py-4 font-bold">{d.type}</td><td className="px-5 py-4"><div>{d.imei}</div><div className="mt-1 text-slate-500">{d.serial}</div></td><td className="px-5 py-4 whitespace-nowrap">{d.received.split('-').reverse().join('/')}</td><td className="px-5 py-4"><label><span className="sr-only">Trạng thái {d.serial}</span><select value={d.status} onChange={e => changeStatus(d, e.target.value as Status)} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm">{d.status === 'Lỗi/Bảo hành' && <option value="Lỗi/Bảo hành">Lỗi/Bảo hành (chưa phân loại)</option>}{statuses.map(s => <option key={s}>{s}</option>)}</select></label></td><td className="px-5 py-4"><div>{tenantName(d.tenantId)}</div><div className="mt-1 text-slate-500">{d.vehicle || 'Chưa gắn phương tiện'}</div></td><td className="px-5 py-4"><div className="flex flex-col items-start gap-2"><button onClick={() => { setSelected(d.id); setError(''); }} className="font-semibold text-red-700 hover:underline">Chi tiết</button><button onClick={() => { setLinkTarget(d.id); setLinkTenant(d.tenantId); setLinkVehicle(d.vehicle); setError(''); setNotice(''); }} className="font-semibold text-red-700 hover:underline">Liên kết</button></div></td></tr>)}{!filtered.length && <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">Không tìm thấy thiết bị phù hợp.</td></tr>}</tbody></table></div></section>
    {adding && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><form onSubmit={add} role="dialog" aria-modal="true" aria-labelledby="add-device-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"><div className="flex justify-between"><h2 id="add-device-title" className="text-lg font-bold">Thêm thiết bị</h2><button type="button" aria-label="Đóng" onClick={() => {setAdding(false); setError('');}}><X className="h-5 w-5"/></button></div>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}<div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">IMEI<input required inputMode="numeric" maxLength={15} className={`${input} mt-1`} value={form.imei} onChange={e => setForm({...form, imei:e.target.value})}/></label><label className="text-sm font-semibold">Serial Number<input required className={`${input} mt-1`} value={form.serial} onChange={e => setForm({...form, serial:e.target.value})}/></label><label className="text-sm font-semibold">Loại thiết bị<select className={`${input} mt-1`} value={form.type} onChange={e => setForm({...form, type:e.target.value as DeviceType})}><option>Camera</option><option>DL GPS</option></select></label><label className="text-sm font-semibold">Ngày nhập<input required type="date" className={`${input} mt-1`} value={form.received} onChange={e => setForm({...form, received:e.target.value})}/></label><label className="text-sm font-semibold">Trạng thái<select className={`${input} mt-1`} value={form.status} onChange={e => setForm({...form, status:e.target.value as Status})}>{statuses.map(s => <option key={s}>{s}</option>)}</select></label></div><div className="mt-6 flex gap-3"><button className="rounded-lg bg-red-600 px-4 py-2.5 font-bold text-white">Lưu thiết bị</button><button type="button" className="rounded-lg border border-slate-300 px-4 py-2.5" onClick={() => {setAdding(false); setError('');}}>Hủy</button></div></form></div>}
    {linkTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><form onSubmit={updateLink} role="dialog" aria-modal="true" aria-labelledby="link-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"><h2 id="link-title" className="flex items-center gap-2 text-lg font-bold"><Link2 className="h-5 w-5 text-red-600"/> Liên kết thiết bị</h2><p className="mt-2 text-sm text-slate-500">Chọn doanh nghiệp và nhập biển số. Để trống doanh nghiệp để tháo liên kết.</p>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}<div className="mt-5 space-y-4"><label className="block text-sm font-semibold">Doanh nghiệp<select className={`${input} mt-1`} value={linkTenant} onChange={e => {setLinkTenant(e.target.value); setLinkVehicle('');}}><option value="">Chưa liên kết</option>{tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label className="block text-sm font-semibold">Biển số phương tiện (mẫu)<input disabled={!linkTenant} className={`${input} mt-1 disabled:bg-slate-100`} value={linkVehicle} onChange={e => setLinkVehicle(e.target.value)} placeholder="VD: 29A-111.11"/></label></div><div className="mt-6 flex gap-3"><button className="rounded-lg bg-red-600 px-4 py-2.5 font-bold text-white">Lưu liên kết</button><button type="button" onClick={() => {setLinkTarget(null); setError('');}} className="rounded-lg border border-slate-300 px-4 py-2.5">Hủy</button></div></form></div>}
    {selectedDevice && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="detail-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"><div className="flex justify-between"><h2 id="detail-title" className="text-lg font-bold">Chi tiết thiết bị</h2><button aria-label="Đóng" onClick={() => setSelected(null)}><X className="h-5 w-5"/></button></div><dl className="mt-5 grid grid-cols-2 gap-4 text-sm">{[['Loại',selectedDevice.type],['Trạng thái',selectedDevice.status],['IMEI',selectedDevice.imei],['Serial Number',selectedDevice.serial],['Ngày nhập',selectedDevice.received.split('-').reverse().join('/')],['Doanh nghiệp',tenantName(selectedDevice.tenantId)],['Phương tiện',selectedDevice.vehicle || 'Chưa liên kết']].map(([label,value]) => <div key={label}><dt className="text-slate-500">{label}</dt><dd className="mt-1 font-semibold break-words">{value}</dd></div>)}</dl><h3 className="mt-7 flex items-center gap-2 font-bold"><History className="h-4 w-4 text-red-600"/> Lịch sử thay đổi</h3><ul className="mt-3 space-y-3">{selectedDevice.history.map((entry,i) => <li key={i} className="rounded-lg bg-slate-50 p-3 text-sm"><p>{entry.detail}</p><p className="mt-1 text-xs text-slate-500">{new Date(entry.time).toLocaleString('vi-VN')}</p></li>)}</ul></section></div>}
  </div></main>;
}
