import { useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";

import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Projetos from "./pages/Projetos";
import Financeiro from "./pages/Financeiro";
import Mensalidades from "./pages/Mensalidades";

const paginas = [
  {
    id: "dashboard",
    nome: "Dashboard",
    icone: LayoutDashboard,
    componente: Dashboard,
  },
  {
    id: "clientes",
    nome: "Clientes",
    icone: Users,
    componente: Clientes,
  },
  {
    id: "projetos",
    nome: "Projetos",
    icone: BriefcaseBusiness,
    componente: Projetos,
  },
  {
    id: "financeiro",
    nome: "Financeiro",
    icone: CircleDollarSign,
    componente: Financeiro,
  },
  {
    id: "mensalidades",
    nome: "Mensalidades",
    icone: CalendarDays,
    componente: Mensalidades,
  },
];

function App() {
  const [paginaAtual, setPaginaAtual] = useState("dashboard");
  const [menuAberto, setMenuAberto] = useState(false);

  const paginaSelecionada =
    paginas.find((pagina) => pagina.id === paginaAtual) || paginas[0];

  const Pagina = paginaSelecionada.componente;

  function navegar(id) {
    setPaginaAtual(id);
    setMenuAberto(false);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      {/* =========================
          MOBILE HEADER
      ========================== */}
      <header className="fixed left-0 right-0 top-0 z-50 flex h-[68px] items-center justify-between border-b border-white/10 bg-[#080a0f]/95 px-4 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => setMenuAberto(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] transition hover:bg-white/[0.08]"
          aria-label="Abrir menu"
        >
          <Menu size={21} />
        </button>

        <button
          type="button"
          onClick={() => navegar("dashboard")}
          className="flex items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-black text-black">
            J
          </div>

          <div className="text-left">
            <p className="text-sm font-bold tracking-tight">JacobOS</p>
            <p className="text-[10px] text-zinc-500">Gestão</p>
          </div>
        </button>

        <div className="h-10 w-10" />
      </header>

      {/* =========================
          OVERLAY MOBILE
      ========================== */}
      {menuAberto && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMenuAberto(false)}
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* =========================
          MOBILE DRAWER
      ========================== */}
      <aside
        className={`fixed left-0 top-0 z-[70] flex h-full w-[285px] flex-col border-r border-white/10 bg-[#0b0d12] shadow-2xl transition-transform duration-300 lg:hidden ${
          menuAberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-black text-black">
              J
            </div>

            <div>
              <p className="font-bold">JacobOS</p>
              <p className="text-xs text-zinc-500">Painel de gestão</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMenuAberto(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
            Menu principal
          </p>

          {paginas.map((pagina) => {
            const Icon = pagina.icone;
            const ativo = paginaAtual === pagina.id;

            return (
              <button
                key={pagina.id}
                type="button"
                onClick={() => navegar(pagina.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                  ativo
                    ? "bg-white text-black"
                    : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <Icon size={19} />
                <span className="flex-1">{pagina.nome}</span>

                {ativo && <ChevronRight size={16} />}
              </button>
            );
          })}

          <div className="my-5 h-px bg-white/5" />

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
          >
            <BarChart3 size={19} />
            <span>Relatórios</span>
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
          >
            <Settings size={19} />
            <span>Configurações</span>
          </button>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs font-semibold text-white">JacobOS</p>
            <p className="mt-1 text-[11px] text-zinc-500">
              Sistema de gestão
            </p>
          </div>
        </div>
      </aside>

      {/* =========================
          DESKTOP SIDEBAR
      ========================== */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[250px] flex-col border-r border-white/10 bg-[#0b0d12] lg:flex">
        <div className="flex h-[82px] items-center border-b border-white/10 px-6">
          <button
            type="button"
            onClick={() => navegar("dashboard")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-black text-black">
              J
            </div>

            <div className="text-left">
              <p className="font-bold tracking-tight">JacobOS</p>
              <p className="text-[11px] text-zinc-500">
                Sistema de gestão
              </p>
            </div>
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
            Menu principal
          </p>

          {paginas.map((pagina) => {
            const Icon = pagina.icone;
            const ativo = paginaAtual === pagina.id;

            return (
              <button
                key={pagina.id}
                type="button"
                onClick={() => navegar(pagina.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  ativo
                    ? "bg-white text-black"
                    : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <Icon size={19} />
                <span className="flex-1 text-left">{pagina.nome}</span>

                {ativo && <ChevronRight size={16} />}
              </button>
            );
          })}

          <div className="my-5 h-px bg-white/5" />

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
          >
            <BarChart3 size={19} />
            <span>Relatórios</span>
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
          >
            <Settings size={19} />
            <span>Configurações</span>
          </button>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs font-semibold text-white">JacobOS</p>
            <p className="mt-1 text-[11px] text-zinc-500">
              Painel administrativo
            </p>
          </div>
        </div>
      </aside>

      {/* =========================
          CONTEÚDO
      ========================== */}
      <main className="min-h-screen lg:ml-[250px]">
        <div className="px-4 pb-24 pt-[88px] sm:px-6 lg:px-8 lg:pb-8 lg:pt-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <Pagina />
          </div>
        </div>
      </main>

      {/* =========================
          MOBILE BOTTOM NAV
      ========================== */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0b0d12]/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {paginas.map((pagina) => {
            const Icon = pagina.icone;
            const ativo = paginaAtual === pagina.id;

            return (
              <button
                key={pagina.id}
                type="button"
                onClick={() => navegar(pagina.id)}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl py-2 transition ${
                  ativo ? "text-white" : "text-zinc-600"
                }`}
              >
                <Icon size={19} />

                <span
                  className={`max-w-full truncate text-[9px] font-medium ${
                    ativo ? "text-white" : "text-zinc-600"
                  }`}
                >
                  {pagina.nome}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default App;