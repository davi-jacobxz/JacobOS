
import BuscaCliente from "../BuscaCliente";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Edit3,
  FolderKanban,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";

const STATUS = {
  planejamento: {
    label: "Planejamento",
    className: "border-slate-500/20 bg-slate-500/10 text-slate-300",
  },
  em_andamento: {
    label: "Em andamento",
    className: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  },
  concluido: {
    label: "Concluído",
    className: "border-green-500/20 bg-green-500/10 text-green-300",
  },
  pausado: {
    label: "Pausado",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  },
  cancelado: {
    label: "Cancelado",
    className: "border-red-500/20 bg-red-500/10 text-red-300",
  },
};

function normalizar(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .toLowerCase();
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);
}

function formatarData(data) {
  if (!data) return "—";

  const dataLocal = new Date(`${data}T00:00:00`);

  return dataLocal.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function converterValor(valor) {
  const texto = String(valor ?? "").trim();
  if (!texto) return 0;

  const normalizado = texto.includes(",")
    ? texto.replace(/\\./g, "").replace(",", ".")
    : texto;

  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : 0;
}

function iniciais(nome) {
  return (
    nome
      ?.trim()
      .split(/\\s+/)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join("")
      .toUpperCase() || "PR"
  );
}

function ProjetoStatus({ status }) {
  const config = STATUS[status] ?? STATUS.planejamento;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${config.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}

function Projetos() {
  const [projetos, setProjetos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState("");
  const [pesquisa, setPesquisa] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [mostrarExclusao, setMostrarExclusao] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [projetoSelecionado, setProjetoSelecionado] = useState(null);

  const [clienteId, setClienteId] = useState("");
  const [nome, setNome] = useState("");
  const [status, setStatus] = useState("planejamento");
  const [valorDesenvolvimento, setValorDesenvolvimento] = useState("");
  const [valorHospedagem, setValorHospedagem] = useState("");
  const [valorManutencao, setValorManutencao] = useState("");
  const [valorDominio, setValorDominio] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [observacoes, setObservacoes] = useState("");

  async function carregarDados() {
    setCarregando(true);
    setErro("");

    const [projetosResponse, clientesResponse] = await Promise.all([
      supabase
        .from("projetos")
        .select("*, cliente:clientes(id, nome)")
        .order("created_at", { ascending: false }),
      supabase.from("clientes").select("id, nome").order("nome"),
    ]);

    if (projetosResponse.error || clientesResponse.error) {
      const mensagem =
        projetosResponse.error?.message ||
        clientesResponse.error?.message ||
        "Não foi possível carregar os dados.";

      console.error("Erro ao carregar projetos:", {
        projetos: projetosResponse.error,
        clientes: clientesResponse.error,
      });

      setErro(mensagem);
      setProjetos([]);
      setClientes([]);
    } else {
      setProjetos(projetosResponse.data || []);
      setClientes(clientesResponse.data || []);
    }

    setCarregando(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarDados();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  function limparFormulario() {
    setClienteId("");
    setNome("");
    setStatus("planejamento");
    setValorDesenvolvimento("");
    setValorHospedagem("");
    setValorManutencao("");
    setValorDominio("");
    setDataVencimento("");
    setDataEntrega("");
    setObservacoes("");
    setErro("");
  }

  function abrirNovoProjeto() {
    limparFormulario();
    setProjetoSelecionado(null);
    setModoEdicao(false);
    setMostrarDetalhes(false);
    setMostrarExclusao(false);
    setMostrarFormulario(true);
  }

  function preencherFormulario(projeto) {
    setProjetoSelecionado(projeto);
    setClienteId(projeto.cliente_id || "");
    setNome(projeto.nome || "");
    setStatus(projeto.status || "planejamento");
    setValorDesenvolvimento(
      projeto.valor_desenvolvimento != null
        ? String(projeto.valor_desenvolvimento)
        : ""
    );
    setValorHospedagem(
      projeto.valor_hospedagem != null ? String(projeto.valor_hospedagem) : ""
    );
    setValorManutencao(
      projeto.valor_manutencao != null ? String(projeto.valor_manutencao) : ""
    );
    setValorDominio(
      projeto.valor_dominio != null ? String(projeto.valor_dominio) : ""
    );
    setDataVencimento(projeto.data_vencimento || "");
    setDataEntrega(projeto.data_entrega || "");
    setObservacoes(projeto.observacoes || "");
    setErro("");
  }

  function abrirEdicao(projeto) {
    preencherFormulario(projeto);
    setModoEdicao(true);
    setMostrarDetalhes(false);
    setMostrarExclusao(false);
    setMostrarFormulario(true);
  }

  function abrirDetalhes(projeto) {
    setProjetoSelecionado(projeto);
    setMostrarDetalhes(true);
    setMostrarExclusao(false);
  }

  function abrirExclusao(projeto) {
    setProjetoSelecionado(projeto);
    setMostrarDetalhes(false);
    setMostrarExclusao(true);
    setErro("");
  }

  async function salvarProjeto() {
    if (!clienteId) {
      setErro("Selecione o cliente do projeto.");
      return;
    }

    if (!nome.trim()) {
      setErro("Digite o nome do projeto.");
      return;
    }

    setSalvando(true);
    setErro("");

    const dados = {
      cliente_id: clienteId,
      nome: nome.trim(),
      status,
      valor_desenvolvimento: converterValor(valorDesenvolvimento),
      valor_hospedagem: converterValor(valorHospedagem),
      valor_manutencao: converterValor(valorManutencao),
      valor_dominio: converterValor(valorDominio),
      data_vencimento: dataVencimento || null,
      data_entrega: dataEntrega || null,
      observacoes: observacoes.trim() || null,
    };

    if (modoEdicao && projetoSelecionado?.id) {
      const { data, error } = await supabase
        .from("projetos")
        .update(dados)
        .eq("id", projetoSelecionado.id)
        .select("*, cliente:clientes(id, nome)")
        .single();

      if (error) {
        console.error("Erro ao atualizar projeto:", error);
        setErro(error.message);
        setSalvando(false);
        return;
      }

      setProjetos((projetosAtuais) =>
        projetosAtuais.map((projeto) =>
          projeto.id === data.id ? data : projeto
        )
      );
      setProjetoSelecionado(data);
      setMostrarDetalhes(true);
    } else {
      const { data, error } = await supabase
        .from("projetos")
        .insert([dados])
        .select("*, cliente:clientes(id, nome)")
        .single();

      if (error) {
        console.error("Erro ao cadastrar projeto:", error);
        setErro(error.message);
        setSalvando(false);
        return;
      }

      setProjetos((projetosAtuais) => [data, ...projetosAtuais]);
      setProjetoSelecionado(data);
      setMostrarDetalhes(true);
    }

    limparFormulario();
    setMostrarFormulario(false);
    setModoEdicao(false);
    setSalvando(false);
  }

  async function excluirProjeto() {
    if (!projetoSelecionado?.id) return;

    setExcluindo(true);
    setErro("");

    const { error } = await supabase
      .from("projetos")
      .delete()
      .eq("id", projetoSelecionado.id);

    if (error) {
      console.error("Erro ao excluir projeto:", error);
      setErro(error.message);
      setExcluindo(false);
      return;
    }

    setProjetos((projetosAtuais) =>
      projetosAtuais.filter((projeto) => projeto.id !== projetoSelecionado.id)
    );

    setProjetoSelecionado(null);
    setMostrarExclusao(false);
    setExcluindo(false);
  }

  const projetosFiltrados = useMemo(() => {
    const termo = normalizar(pesquisa);

    if (!termo) return projetos;

    return projetos.filter((projeto) =>
      [
        projeto.nome,
        projeto.cliente?.nome,
        STATUS[projeto.status]?.label,
      ].some((valor) => normalizar(valor).includes(termo))
    );
  }, [projetos, pesquisa]);

  const projetosEmAndamento = projetos.filter(
    (projeto) => projeto.status === "em_andamento"
  ).length;

  const projetosConcluidos = projetos.filter(
    (projeto) => projeto.status === "concluido"
  ).length;

  const valorTotalDesenvolvimento = projetos.reduce(
    (total, projeto) => total + Number(projeto.valor_desenvolvimento || 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#0b0d10] p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
                <FolderKanban size={21} className="text-blue-400" />
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Organize sites, serviços e contratos ligados aos seus clientes.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={abrirNovoProjeto}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
          >
            <Plus size={18} />
            Novo projeto
          </button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#101318] p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total de projetos
            </p>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-3xl font-bold">{projetos.length}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                <FolderKanban size={17} className="text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101318] p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Em andamento
            </p>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-3xl font-bold">{projetosEmAndamento}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                <Check size={17} className="text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101318] p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Concluídos
            </p>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-3xl font-bold">{projetosConcluidos}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
                <Check size={17} className="text-green-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101318] p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Valor em desenvolvimento
            </p>
            <div className="mt-2">
              <span className="text-2xl font-bold">
                {formatarMoeda(valorTotalDesenvolvimento)}
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101318]">
          <div className="flex items-center gap-3 border-b border-white/10 p-5">
            <Search size={18} className="shrink-0 text-gray-500" />
            <input
              type="text"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Pesquisar por projeto, cliente ou status..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
            />
            {pesquisa && (
              <button
                type="button"
                onClick={() => setPesquisa("")}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-white"
                title="Limpar pesquisa"
              >
                <X size={17} />
              </button>
            )}
          </div>

          <div className="p-5">
            {carregando && (
              <div className="flex min-h-72 items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />
                  <p className="text-sm text-gray-500">Carregando projetos...</p>
                </div>
              </div>
            )}

            {!carregando && erro && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5">
                <p className="font-medium text-red-400">
                  Não foi possível carregar os projetos.
                </p>
                <p className="mt-1 text-sm text-red-400/70">{erro}</p>
                <button
                  type="button"
                  onClick={carregarDados}
                  className="mt-4 rounded-lg border border-red-400/20 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-400/10"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {!carregando && !erro && projetos.length === 0 && (
              <div className="flex min-h-72 flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                  <FolderKanban size={27} className="text-gray-500" />
                </div>
                <h2 className="text-xl font-semibold">Nenhum projeto cadastrado</h2>
                <p className="mt-2 max-w-md text-sm text-gray-500">
                  Crie seu primeiro projeto e vincule-o a um cliente para começar
                  a acompanhar desenvolvimento, hospedagem e manutenção.
                </p>
                <button
                  type="button"
                  onClick={abrirNovoProjeto}
                  className="mt-6 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
                >
                  <Plus size={18} />
                  Cadastrar primeiro projeto
                </button>
              </div>
            )}

            {!carregando &&
              !erro &&
              projetos.length > 0 &&
              projetosFiltrados.length === 0 && (
                <div className="flex min-h-72 flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                    <Search size={26} className="text-gray-500" />
                  </div>
                  <h2 className="text-xl font-semibold">Projeto não encontrado</h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Nenhum projeto corresponde à pesquisa "{pesquisa.trim()}".
                  </p>
                  <button
                    type="button"
                    onClick={() => setPesquisa("")}
                    className="mt-6 rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white"
                  >
                    Limpar pesquisa
                  </button>
                </div>
              )}

            {!carregando &&
              !erro &&
              projetosFiltrados.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px]">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-gray-500">
                        <th className="px-4 py-3 font-medium">Projeto</th>
                        <th className="px-4 py-3 font-medium">Cliente</th>
                        <th className="px-4 py-3 font-medium">Desenvolvimento</th>
                        <th className="px-4 py-3 font-medium">Recorrência</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Entrega</th>
                        <th className="px-4 py-3 text-right font-medium">Ações</th>
                      </tr>
                    </thead>

                    <tbody>
                      {projetosFiltrados.map((projeto) => (
                        <tr
                          key={projeto.id}
                          className="border-b border-white/5 transition hover:bg-white/[0.025]"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-xs font-bold text-blue-400">
                                {iniciais(projeto.nome)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-white">{projeto.nome}</p>
                                <p className="mt-0.5 text-xs text-gray-600">Projeto</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <UserRound size={14} className="text-gray-500" />
                              {projeto.cliente?.nome || "Cliente removido"}
                            </div>
                          </td>

                          <td className="px-4 py-4 text-sm font-medium text-gray-200">
                            {formatarMoeda(projeto.valor_desenvolvimento)}
                          </td>

                          <td className="px-4 py-4">
                            <div className="space-y-1 text-xs text-gray-500">
                              <div>Hosp.: {formatarMoeda(projeto.valor_hospedagem)}/mês</div>
                              <div>Manut.: {formatarMoeda(projeto.valor_manutencao)}/mês</div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <ProjetoStatus status={projeto.status} />
                          </td>

                          <td className="px-4 py-4 text-sm text-gray-400">
                            {formatarData(projeto.data_entrega)}
                          </td>

                          <td className="px-4 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => abrirDetalhes(projeto)}
                                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
                              >
                                Ver projeto
                              </button>

                              <button
                                type="button"
                                onClick={() => abrirEdicao(projeto)}
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-white"
                                title="Editar projeto"
                              >
                                <Edit3 size={17} />
                              </button>

                              <button
                                type="button"
                                onClick={() => abrirExclusao(projeto)}
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-red-500/10 hover:text-red-400"
                                title="Excluir projeto"
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </div>
      </div>

      {mostrarFormulario && (
       <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 pb-28 pt-20 backdrop-blur-sm lg:items-center lg:p-4">
         <div className="max-h-[calc(100dvh-120px)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#101318] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div>
                <h2 className="text-xl font-bold">
                  {modoEdicao ? "Editar projeto" : "Novo projeto"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Vincule o projeto a um cliente e registre os valores do contrato.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMostrarFormulario(false);
                  setModoEdicao(false);
                  setErro("");
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              {erro && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  {erro}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                
                <BuscaCliente
  clientes={clientes}
  value={clienteId}
  onChange={setClienteId}
/>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Nome do projeto *
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex.: Site institucional da empresa"
                    className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                  >
                    {Object.entries(STATUS).map(([valor, config]) => (
                      <option key={valor} value={valor}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Valor de desenvolvimento
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={valorDesenvolvimento}
                    onChange={(e) => setValorDesenvolvimento(e.target.value)}
                    placeholder="Ex.: 2500,00"
                    className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Hospedagem / mês
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={valorHospedagem}
                    onChange={(e) => setValorHospedagem(e.target.value)}
                    placeholder="Ex.: 49,90"
                    className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Manutenção / mês
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={valorManutencao}
                    onChange={(e) => setValorManutencao(e.target.value)}
                    placeholder="Ex.: 150,00"
                    className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Domínio
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={valorDominio}
                    onChange={(e) => setValorDominio(e.target.value)}
                    placeholder="Ex.: 59,90"
                    className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Vencimento
                  </label>
                  <input
                    type="date"
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Data de entrega
                  </label>
                  <input
                    type="date"
                    value={dataEntrega}
                    onChange={(e) => setDataEntrega(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Observações
                  </label>
                  <textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={4}
                    placeholder="Detalhes do projeto, escopo, observações comerciais..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                  />
                </div>
              </div>

            <div className="flex gap-3 border-t border-white/10 pb-2 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormulario(false);
                    setModoEdicao(false);
                    setErro("");
                  }}
                  className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/5"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={salvarProjeto}
                  disabled={salvando}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {salvando
                    ? modoEdicao
                      ? "Salvando..."
                      : "Cadastrando..."
                    : modoEdicao
                      ? "Salvar alterações"
                      : "Cadastrar projeto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarDetalhes && projetoSelecionado && (
       <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 pb-20 pt-20 backdrop-blur-sm lg:items-center lg:p-4">
          <div className="max-h-[calc(100dvh-110px)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#101318] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 font-bold text-blue-400">
                  {iniciais(projetoSelecionado.nome)}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{projetoSelecionado.nome}</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {projetoSelecionado.cliente?.nome || "Cliente removido"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMostrarDetalhes(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-[#0b0d10] p-4">
                <p className="mb-2 text-xs uppercase tracking-wider text-gray-600">
                  Cliente
                </p>
                <p className="text-sm font-medium text-white">
                  {projetoSelecionado.cliente?.nome || "Cliente removido"}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0b0d10] p-4">
                <p className="mb-2 text-xs uppercase tracking-wider text-gray-600">
                  Status
                </p>
                <ProjetoStatus status={projetoSelecionado.status} />
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0b0d10] p-4">
                <p className="mb-2 text-xs uppercase tracking-wider text-gray-600">
                  Desenvolvimento
                </p>
                <p className="text-lg font-semibold text-white">
                  {formatarMoeda(projetoSelecionado.valor_desenvolvimento)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0b0d10] p-4">
                <p className="mb-2 text-xs uppercase tracking-wider text-gray-600">
                  Recorrências
                </p>
                <div className="space-y-1 text-sm text-gray-300">
                  <p>Hospedagem: {formatarMoeda(projetoSelecionado.valor_hospedagem)}/mês</p>
                  <p>Manutenção: {formatarMoeda(projetoSelecionado.valor_manutencao)}/mês</p>
                  <p>Domínio: {formatarMoeda(projetoSelecionado.valor_dominio)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0b0d10] p-4">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-gray-600">
                  <CalendarDays size={14} />
                  Vencimento
                </div>
                <p className="text-sm font-medium text-white">
                  {formatarData(projetoSelecionado.data_vencimento)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0b0d10] p-4">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-gray-600">
                  <CalendarDays size={14} />
                  Entrega
                </div>
                <p className="text-sm font-medium text-white">
                  {formatarData(projetoSelecionado.data_entrega)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0b0d10] p-4 sm:col-span-2">
                <p className="mb-2 text-xs uppercase tracking-wider text-gray-600">
                  Observações
                </p>
                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-300">
                  {projetoSelecionado.observacoes || "Nenhuma observação registrada."}
                </p>
              </div>
            </div>

            <div className="flex justify-between border-t border-white/10 p-6">
              <button
                type="button"
                onClick={() => abrirExclusao(projetoSelecionado)}
                className="flex items-center gap-2 rounded-xl border border-red-500/20 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10"
              >
                <Trash2 size={16} />
                Excluir
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => abrirEdicao(projetoSelecionado)}
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white"
                >
                  <Edit3 size={16} />
                  Editar
                </button>

                <button
                  type="button"
                  onClick={() => setMostrarDetalhes(false)}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarExclusao && projetoSelecionado && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101318] p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
              <AlertTriangle size={22} />
            </div>

            <h2 className="mt-5 text-xl font-bold">Excluir projeto?</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              O projeto <span className="font-medium text-gray-300">{projetoSelecionado.nome}</span> será removido permanentemente do sistema.
            </p>

            {erro && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {erro}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setMostrarExclusao(false);
                  setErro("");
                }}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/5"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={excluirProjeto}
                disabled={excluindo}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {excluindo ? "Excluindo..." : "Excluir projeto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {clientes.length === 0 && !carregando && !erro && (
        <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 text-sm text-amber-300">
          <div className="flex items-center gap-2">
            <UserRound size={16} />
            Cadastre pelo menos um cliente antes de criar um projeto.
          </div>
        </div>
      )}
    </div>
  );
}

export default Projetos;
