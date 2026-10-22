import { Outlet } from 'react-router-dom';

export default function SystemAdminLayout() {
    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col">
            <header className="p-4 border-b border-slate-800 font-bold text-rose-500">
                SUPER ADMIN PORTAL
            </header>
            <main className="flex-1 p-6 bg-slate-950">
                <Outlet />
            </main>
        </div>
    );
}