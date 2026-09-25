import { useCallback, useEffect, useState } from "react";

import {
  BarChart3,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Smartphone,
  Users,
  X,
} from "lucide-react";

import { supabase } from "./lib/supabase";

import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Projetos from "./pages/Projetos";
import Financeiro from "./pages/Financeiro";
import Mensalidades from "./pages/Mensalidades";
import ConfigurarMFA from "./ConfigurarMFA";

// =====================================================
// LOGO
// =====================================================

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/dev.jacob.jpg"
        alt="Dev Jacob"
        className="h-10 w-10 rounded-xl object-cover"
      />

      <div>
        <p className="text-sm font-bold text-white">JacobOS</p>
        <p className="text-[11px] text-gray-500">
          Sistema de gestão
        </p>
      </div>
    </div>
  );
}

// =====================================================
// LOGIN
// =====================================================

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [modoRecuperacao, setModoRecuperacao] = useState(false);

  async function entrar(event) {
    event.preventDefault();

    setErro("");
    setMensagem("");

    if (!email.trim() || !senha) {
      setErro("Preencha seu e-mail e sua senha.");
      return;
    }

    setCarregando(true);

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

    if (error) {
      console.error("Erro no login:", error);
      setErro("E-mail ou senha incorretos.");
      setCarregando(false);
      return;
    }

    setCarregando(false);

    if (data?.user) {
      onLogin(data.user);
    }
  }

  async function recuperarSenha(event) {
    event.preventDefault();

    setErro("");
    setMensagem("");

    if (!email.trim()) {
      setErro("Digite seu e-mail primeiro.");
      return;
    }

    setCarregando(true);

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: window.location.origin,
        }
      );

    setCarregando(false);

    if (error) {
      console.error(
        "Erro ao enviar recuperação:",
        error
      );
      setErro(error.message);
      return;
    }

    setMensagem(
      "Enviamos as instruções de recuperação para seu e-mail."
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080a0d] px-4 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_35%)]" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#101318] p-6 shadow-2xl sm:p-8">
          <div className="mb-7">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">
              {modoRecuperacao ? (
                <KeyRound
                  size={22}
                  className="text-blue-400"
                />
              ) : (
                <LockKeyhole
                  size={22}
                  className="text-blue-400"
                />
              )}
            </div>

            <h1 className="text-2xl font-bold">
              {modoRecuperacao
                ? "Recuperar acesso"
                : "Entrar no JacobOS"}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              {modoRecuperacao
                ? "Digite seu e-mail para receber o link de recuperação."
                : "Acesse seu sistema de gestão."}
            </p>
          </div>

          <form
            onSubmit={
              modoRecuperacao
                ? recuperarSenha
                : entrar
            }
            className="space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                E-mail
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="seu@email.com"
                autoComplete="email"
                className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500/60"
              />
            </div>

            {!modoRecuperacao && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Senha
                </label>

                <div className="relative">
                  <input
                    type={
                      mostrarSenha
                        ? "text"
                        : "password"
                    }
                    value={senha}
                    onChange={(event) =>
                      setSenha(event.target.value)
                    }
                    placeholder="Sua senha"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 pr-20 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500/60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setMostrarSenha(
                        (valor) => !valor
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 transition hover:text-white"
                  >
                    {mostrarSenha
                      ? "Ocultar"
                      : "Mostrar"}
                  </button>
                </div>
              </div>
            )}

            {erro && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {erro}
              </div>
            )}

            {mensagem && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                {mensagem}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {carregando
                ? "Aguarde..."
                : modoRecuperacao
                  ? "Enviar recuperação"
                  : "Entrar"}
            </button>
          </form>

          <div className="mt-6 text-center">
            {modoRecuperacao ? (
              <button
                type="button"
                onClick={() => {
                  setModoRecuperacao(false);
                  setErro("");
                  setMensagem("");
                }}
                className="text-sm text-blue-400 transition hover:text-blue-300"
              >
                Voltar para o login
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setModoRecuperacao(true);
                  setErro("");
                  setMensagem("");
                }}
                className="text-sm text-gray-500 transition hover:text-white"
              >
                Esqueci minha senha
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-600">
          <ShieldCheck size={14} />
          Acesso protegido por Supabase Auth
        </div>
      </div>
    </div>
  );
}

// =====================================================
// MFA
// =====================================================

function MFAScreen({ onVerified, onLogout }) {
  const [codigo, setCodigo] = useState("");
  const [carregando, setCarregando] =
    useState(false);
  const [erro, setErro] = useState("");
  const [factorId, setFactorId] = useState(null);
  const [challengeId, setChallengeId] =
    useState(null);

  async function prepararChallenge() {
    setErro("");

    const { data, error } =
      await supabase.auth.mfa.listFactors();

    if (error) {
      console.error(
        "Erro ao buscar MFA:",
        error
      );

      setErro(
        "Não foi possível carregar o autenticador."
      );

      return;
    }

    const fator =
      data?.totp?.find(
        (item) => item.status === "verified"
      );

    if (!fator) {
      setErro(
        "Nenhum autenticador TOTP verificado foi encontrado."
      );

      return;
    }

    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({
        factorId: fator.id,
      });

    if (challengeError) {
      console.error(
        "Erro ao criar desafio MFA:",
        challengeError
      );

      setErro(challengeError.message);
      return;
    }

    setFactorId(fator.id);
    setChallengeId(challenge.id);
  }

  async function verificarCodigo(event) {
    event.preventDefault();

    setErro("");

    if (!/^\d{6}$/.test(codigo)) {
      setErro(
        "Digite o código de 6 dígitos."
      );

      return;
    }

    setCarregando(true);

    let idFactor = factorId;
    let idChallenge = challengeId;

    if (!idFactor || !idChallenge) {
      const { data, error } =
        await supabase.auth.mfa.listFactors();

      if (error) {
        setErro(error.message);
        setCarregando(false);
        return;
      }

      const fator =
        data?.totp?.find(
          (item) => item.status === "verified"
        );

      if (!fator) {
        setErro(
          "Nenhum autenticador TOTP verificado foi encontrado."
        );

        setCarregando(false);
        return;
      }

      idFactor = fator.id;

      const {
        data: challenge,
        error: challengeError,
      } = await supabase.auth.mfa.challenge({
        factorId: idFactor,
      });

      if (challengeError) {
        setErro(challengeError.message);
        setCarregando(false);
        return;
      }

      idChallenge = challenge.id;

      setFactorId(idFactor);
      setChallengeId(idChallenge);
    }

    const { error } =
      await supabase.auth.mfa.verify({
        factorId: idFactor,
        challengeId: idChallenge,
        code: codigo,
      });

    if (error) {
      console.error(
        "Erro ao verificar MFA:",
        error
      );

      setErro(
        "Código inválido ou expirado. Gere um novo código e tente novamente."
      );

      setCodigo("");
      setCarregando(false);

      await prepararChallenge();
      return;
    }

    setCarregando(false);
    onVerified();
  }

  async function novoCodigo() {
    setCodigo("");
    setFactorId(null);
    setChallengeId(null);

    await prepararChallenge();
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      prepararChallenge();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080a0d] px-4 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_35%)]" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#101318] p-6 shadow-2xl sm:p-8">
          <div className="mb-7">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">
              <Smartphone
                size={25}
                className="text-blue-400"
              />
            </div>

            <h1 className="text-2xl font-bold">
              Verificação em duas etapas
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Abra seu aplicativo autenticador e
              digite o código de 6 dígitos.
            </p>
          </div>

          <form
            onSubmit={verificarCodigo}
            className="space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Código de autenticação
              </label>

              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={codigo}
                onChange={(event) =>
                  setCodigo(
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6)
                  )
                }
                placeholder="000000"
                autoFocus
                className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-white outline-none transition placeholder:text-gray-700 focus:border-blue-500/60"
              />
            </div>

            {erro && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-300">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={
                carregando ||
                codigo.length !== 6
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShieldCheck size={18} />

              {carregando
                ? "Verificando..."
                : "Verificar código"}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-3 text-center">
            <button
              type="button"
              onClick={novoCodigo}
              className="text-sm text-gray-500 transition hover:text-white"
            >
              Gerar novo desafio
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="text-sm text-red-400 transition hover:text-red-300"
            >
              Sair da conta
            </button>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-600">
          <LockKeyhole size={13} />
          Sua sessão está aguardando o segundo fator
        </div>
      </div>
    </div>
  );
}

// =====================================================
// SIDEBAR
// =====================================================

const MENU = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "clientes",
    label: "Clientes",
    icon: Users,
  },
  {
    id: "projetos",
    label: "Projetos",
    icon: FolderKanban,
  },
  {
    id: "financeiro",
    label: "Financeiro",
    icon: CircleDollarSign,
  },
  {
    id: "mensalidades",
    label: "Mensalidades",
    icon: CreditCard,
  },
];

function Sidebar({
  pagina,
  setPagina,
  aberta,
  fechar,
  logout,
}) {
  return (
    <>
      {aberta && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={fechar}
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[250px] flex-col border-r border-white/10 bg-[#0b0d10] transition-transform duration-300 lg:translate-x-0 ${
          aberta
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center border-b border-white/10 px-5">
          <Logo />

          <button
            type="button"
            onClick={fechar}
            className="ml-auto rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-600">
            Principal
          </p>

          <nav className="space-y-1">
            {MENU.map((item) => {
              const Icon = item.icon;
              const ativo =
                pagina === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setPagina(item.id);
                    fechar();
                  }}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                    ativo
                      ? "bg-blue-600/10 text-blue-400"
                      : "text-gray-500 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon
                    size={19}
                    className={
                      ativo
                        ? "text-blue-400"
                        : "text-gray-600 group-hover:text-gray-300"
                    }
                  />

                  <span>{item.label}</span>

                  {ativo && (
                    <ChevronRight
                      size={15}
                      className="ml-auto"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <p className="mb-3 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-600">
            Sistema
          </p>

          <div className="space-y-1">
            <button
              type="button"
              disabled
              className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-gray-700"
            >
              <BarChart3 size={19} />
              Relatórios

              <span className="ml-auto text-[9px] uppercase tracking-wider">
                Em breve
              </span>
            </button>

            <button
              type="button"
              disabled
              className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-gray-700"
            >
              <Settings size={19} />
              Configurações

              <span className="ml-auto text-[9px] uppercase tracking-wider">
                Em breve
              </span>
            </button>
          </div>
        </div>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-500 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={19} />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}

// =====================================================
// MOBILE HEADER
// =====================================================

function MobileHeader({ abrirMenu }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-white/10 bg-[#0b0d10]/95 px-4 backdrop-blur lg:hidden">
      <button
        type="button"
        onClick={abrirMenu}
        className="mr-3 rounded-xl p-2 text-gray-400 hover:bg-white/5 hover:text-white"
      >
        <Menu size={22} />
      </button>

      <Logo />
    </header>
  );
}

// =====================================================
// MOBILE BOTTOM NAV
// =====================================================

function MobileBottomNav({
  pagina,
  setPagina,
}) {
  const itens = MENU.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0b0d10]/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="grid grid-cols-5">
        {itens.map((item) => {
          const Icon = item.icon;
          const ativo =
            pagina === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                setPagina(item.id)
              }
              className={`flex min-h-[62px] flex-col items-center justify-center gap-1 text-[10px] font-medium transition ${
                ativo
                  ? "text-blue-400"
                  : "text-gray-600"
              }`}
            >
              <Icon size={19} />

              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// =====================================================
// SISTEMA
// =====================================================

function Sistema({ logout }) {
  const [pagina, setPagina] =
    useState("dashboard");

  const [menuAberto, setMenuAberto] =
    useState(false);

  function renderPagina() {
    switch (pagina) {
      case "clientes":
        return <Clientes />;

      case "projetos":
        return <Projetos />;

      case "financeiro":
        return <Financeiro />;

      case "mensalidades":
        return <Mensalidades />;

      case "dashboard":
      default:
        return <Dashboard />;
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0d10] text-white">
      <Sidebar
        pagina={pagina}
        setPagina={setPagina}
        aberta={menuAberto}
        fechar={() => setMenuAberto(false)}
        logout={logout}
      />

      <MobileHeader
        abrirMenu={() =>
          setMenuAberto(true)
        }
      />

      <main className="min-h-screen pb-20 lg:ml-[250px] lg:pb-0">
        {renderPagina()}
      </main>

      <MobileBottomNav
        pagina={pagina}
        setPagina={setPagina}
      />
    </div>
  );
}

// =====================================================
// AUTENTICAÇÃO + MFA
// =====================================================

function AuthenticatedApp() {
  const [user, setUser] = useState(null);
  const [carregando, setCarregando] =
    useState(true);

  const [precisaMFA, setPrecisaMFA] =
    useState(false);

  const [precisaCadastrarMFA, setPrecisaCadastrarMFA] =
    useState(false);

  const verificarMFA = useCallback(
    async () => {
      const {
        data: fatores,
        error: fatoresError,
      } = await supabase.auth.mfa.listFactors();

      if (fatoresError) {
        console.error(
          "Erro ao verificar fatores MFA:",
          fatoresError
        );
        return;
      }

      const totpVerificado =
        fatores?.totp?.some(
          (fator) =>
            fator.status === "verified"
        );

      if (!totpVerificado) {
        setPrecisaCadastrarMFA(true);
        setPrecisaMFA(false);
        return;
      }

      const {
        data,
        error,
      } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (error) {
        console.error(
          "Erro ao verificar nível MFA:",
          error
        );
        return;
      }

      if (
        data?.nextLevel === "aal2" &&
        data?.currentLevel !== "aal2"
      ) {
        setPrecisaMFA(true);
        setPrecisaCadastrarMFA(false);
      } else {
        setPrecisaMFA(false);
        setPrecisaCadastrarMFA(false);
      }
    },
    []
  );

  const carregarSessao = useCallback(
    async () => {
      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (!session?.user) {
        setUser(null);
        setPrecisaMFA(false);
        setPrecisaCadastrarMFA(false);
        setCarregando(false);
        return;
      }

      setUser(session.user);

      await verificarMFA();

      setCarregando(false);
    },
    [verificarMFA]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarSessao();
    }, 0);

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (event, session) => {
          setTimeout(async () => {
            if (!session?.user) {
              setUser(null);
              setPrecisaMFA(false);
              setPrecisaCadastrarMFA(false);
              setCarregando(false);
              return;
            }

            setUser(session.user);

            await verificarMFA();

            setCarregando(false);
          }, 0);
        }
      );

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [carregarSessao, verificarMFA]);

  async function logout() {
    await supabase.auth.signOut();

    setUser(null);
    setPrecisaMFA(false);
    setPrecisaCadastrarMFA(false);
  }

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080a0d]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />

          <p className="text-sm text-gray-500">
            Carregando JacobOS...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Login
        onLogin={(usuario) =>
          setUser(usuario)
        }
      />
    );
  }

  if (precisaCadastrarMFA) {
    return (
      <ConfigurarMFA
        onConcluido={async () => {
          setPrecisaCadastrarMFA(false);
          await verificarMFA();
        }}
      />
    );
  }

  if (precisaMFA) {
    return (
      <MFAScreen
        onVerified={async () => {
          await verificarMFA();
        }}
        onLogout={logout}
      />
    );
  }

  return <Sistema logout={logout} />;
}

// =====================================================
// EXPORT
// =====================================================

export default function App() {
  return <AuthenticatedApp />;
}