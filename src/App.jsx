import { useState } from "react";
import {
  BarChart3,
  CalendarClock,
  FolderKanban,
  LayoutDashboard,
  Wallet,
  Users,
} from "lucide-react";

import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Projetos from "./pages/Projetos";
import Financeiro from "./pages/Financeiro";
import Mensalidades from "./pages/Mensalidades";

function App() {
  const [pagina, setPagina] = useState("dashboard");

  const menu = [
    { id: "dashboard", nome: "Dashboard", icone: LayoutDashboard },
    { id: "clientes", nome: "Clientes", icone: Users },
    { id: "projetos", nome: "Projetos", icone: FolderKanban },
    { id: "financeiro", nome: "Financeiro", icone: Wallet },
    { id: "mensalidades", nome: "Mensalidades", icone: CalendarClock },
  ];

  function renderizarPagina() {
    switch (pagina) {
      case "clientes": return <Clientes />;
      case "projetos": return <Projetos />;
      case "financeiro": return <Financeiro />;
      case "mensalidades": return <Mensalidades />;
      case "dashboard":
      default: return <Dashboard />;
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0d10] text-white">
      <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-white/10 bg-[#101318] p-5">
        <div className="mb-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15">
              <BarChart3 size={21} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Jacob<span className="text-blue-500">OS</span></h1>
              <p className="text-xs text-gray-500">Gestão da sua empresa</p>
            </div>
          </div>
        </div>
        <nav className="space-y-2">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-600">Principal</p>
          {menu.map((item) => {
            const Icone = item.icone;
            const ativo = pagina === item.id;
            return <button key={item.id} type="button" onClick={() => setPagina(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${ativo ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}><Icone size={18} /><span>{item.nome}</span></button>;
          })}
        </nav>
        <div className="mt-auto rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-xs font-medium text-gray-400">JacobOS</p>
          <p className="mt-1 text-[11px] text-gray-600">Sistema de gestão</p>
        </div>
      </aside>
      <main className="ml-64 min-h-screen">{renderizarPagina()}</main>
    </div>
  );
}

export default App;
