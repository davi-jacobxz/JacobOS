import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Edit3,
  Mail,
  MoreVertical,
  Plus,
  Phone,
  Search,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";

function normalizar(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function obterTipoPesquisa(valor) {
  const termo = valor.trim();

  if (!termo) return "pesquisa";
  if (termo.includes("@")) return "e-mail";

  const apenasNumeros = termo.replace(/\D/g, "");

  if (apenasNumeros.length >= 11 && apenasNumeros.length <= 14) {
    return "WhatsApp ou documento";
  }

  return "nome";
}

function iniciais(nome) {
  return (
    nome
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join("")
      .toUpperCase() || "CL"
  );
}

function formatarData(data) {
  if (!data) return "—";

  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function Clientes() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [mostrarExclusao, setMostrarExclusao] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);

  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState("");
  const [erroExclusao, setErroExclusao] = useState("");
  const [pesquisa, setPesquisa] = useState("");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [documento, setDocumento] = useState("");
  const [status, setStatus] = useState("ativo");
  const [observacoes, setObservacoes] = useState("");

  async function carregarClientes() {
    setCarregando(true);
    setErro("");

    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar clientes:", error);
      setErro(error.message);
      setClientes([]);
    } else {
      setClientes(data || []);
    }

    setCarregando(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarClientes();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  async function salvarCliente() {
    if (!nome.trim()) {
      setErro("Digite o nome do cliente.");
      return;
    }

    setSalvando(true);
    setErro("");

    const dados = {
      nome: nome.trim(),
      email: email.trim() || null,
      whatsapp: whatsapp.trim() || null,
      documento: documento.trim() || null,
      status,
      observacoes: observacoes.trim() || null,
    };

    if (modoEdicao && clienteSelecionado?.id) {
      const { data, error } = await supabase
        .from("clientes")
        .update(dados)
        .eq("id", clienteSelecionado.id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar cliente:", error);
        setErro(error.message);
        setSalvando(false);
        return;
      }

      setClientes((clientesAtuais) =>
        clientesAtuais.map((cliente) =>
          cliente.id === data.id ? data : cliente
        )
      );
      setClienteSelecionado(data);
    } else {
      const { data, error } = await supabase
        .from("clientes")
        .insert([dados])
        .select()
        .single();

      if (error) {
        console.error("Erro ao cadastrar cliente:", error);
        setErro(error.message);
        setSalvando(false);
        return;
      }

      setClientes((clientesAtuais) => [data, ...clientesAtuais]);
      setClienteSelecionado(data);
    }

    limparFormulario();
    setMostrarFormulario(false);
    setModoEdicao(false);
    setSalvando(false);
  }

  function limparFormulario() {
    setNome("");
    setEmail("");
    setWhatsapp("");
    setDocumento("");
    setStatus("ativo");
    setObservacoes("");
    setErro("");
  }

  function abrirDetalhes(cliente) {
    setClienteSelecionado(cliente);
    setMostrarDetalhes(true);
    setMostrarExclusao(false);
  }

  function abrirNovoCliente() {
    limparFormulario();
    setClienteSelecionado(null);
    setModoEdicao(false);
    setMostrarFormulario(true);
  }

  function abrirEdicao(cliente) {
    setClienteSelecionado(cliente);
    setNome(cliente.nome || "");
    setEmail(cliente.email || "");
    setWhatsapp(cliente.whatsapp || "");
    setDocumento(cliente.documento || "");
    setStatus(cliente.status || "ativo");
    setObservacoes(cliente.observacoes || "");
    setErro("");
    setModoEdicao(true);
    setMostrarDetalhes(false);
    setMostrarFormulario(true);
  }

  function abrirExclusao(cliente) {
    setClienteSelecionado(cliente);
    setErroExclusao("");
    setMostrarDetalhes(false);
    setMostrarExclusao(true);
  }

  async function excluirCliente() {
    if (!clienteSelecionado?.id) return;

    setExcluindo(true);
    setErroExclusao("");

    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", clienteSelecionado.id);

    if (error) {
      console.error("Erro ao excluir cliente:", error);
      setErroExclusao(error.message);
      setExcluindo(false);
      return;
    }

    setClientes((clientesAtuais) =>
      clientesAtuais.filter((cliente) => cliente.id !== clienteSelecionado.id)
    );
    setClienteSelecionado(null);
    setMostrarExclusao(false);
    setExcluindo(false);
  }

  function limparPesquisa() {
    setPesquisa("");
  }

  const clientesFiltrados = useMemo(() => {
    const termo = normalizar(pesquisa);

    if (!termo) return clientes;

    return clientes.filter((cliente) =>
      [cliente.nome, cliente.email, cliente.whatsapp, cliente.documento].some(
        (valor) => normalizar(valor).includes(termo)
      )
    );
  }, [clientes, pesquisa]);

  const clientesAtivos = clientes.filter(
    (cliente) => cliente.status === "ativo"
  ).length;

  const nenhumResultado =
    !carregando &&
    !erro &&
    clientes.length > 0 &&
    pesquisa.trim() &&
    clientesFiltrados.length === 0;

  return (
    <div className="min-h-screen bg-[#0b0d10] p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
                <Users size={21} className="text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Gerencie sua base de clientes e acompanhe seus negócios.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={abrirNovoCliente}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
          >
            <Plus size={18} />
            Novo cliente
          </button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#101318] p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total de clientes
            </p>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-3xl font-bold">{clientes.length}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                <Users size={17} className="text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101318] p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Clientes ativos
            </p>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-3xl font-bold">{clientesAtivos}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
                <Check size={17} className="text-green-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101318] p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Resultado da pesquisa
            </p>
            <div className="mt-2">
              <span className="text-3xl font-bold">
                {pesquisa.trim() ? clientesFiltrados.length : "—"}
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
              placeholder="Pesquisar por nome, WhatsApp, e-mail ou CPF/CNPJ..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
            />
            {pesquisa && (
              <button
                type="button"
                onClick={limparPesquisa}
                className="shrink-0 rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-white"
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
                  <p className="text-sm text-gray-500">Carregando clientes...</p>
                </div>
              </div>
            )}

            {!carregando && erro && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5">
                <p className="font-medium text-red-400">
                  Não foi possível carregar os clientes.
                </p>
                <p className="mt-1 text-sm text-red-400/70">{erro}</p>
                <button
                  type="button"
                  onClick={carregarClientes}
                  className="mt-4 rounded-lg border border-red-400/20 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-400/10"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {!carregando && !erro && clientes.length === 0 && (
              <div className="flex min-h-72 flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                  <Users size={27} className="text-gray-500" />
                </div>
                <h2 className="text-xl font-semibold">Nenhum cliente cadastrado</h2>
                <p className="mt-2 max-w-md text-sm text-gray-500">
                  Sua base de clientes ainda está vazia. Cadastre seu primeiro
                  cliente para começar a organizar seu negócio.
                </p>
                <button
                  type="button"
                  onClick={abrirNovoCliente}
                  className="mt-6 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
                >
                  <Plus size={18} />
                  Cadastrar primeiro cliente
                </button>
              </div>
            )}

            {nenhumResultado && (
              <div className="flex min-h-72 flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                  <Search size={26} className="text-gray-500" />
                </div>
                <h2 className="text-xl font-semibold">Cliente não encontrado</h2>
                <p className="mt-2 max-w-lg text-sm leading-6 text-gray-500">
                  Não existe nenhum cliente cadastrado com{" "}
                  <span className="font-medium text-gray-300">
                    {obterTipoPesquisa(pesquisa)}
                  </span>{" "}
                  <span className="text-gray-300">"{pesquisa.trim()}"</span>.
                  <br />
                  Verifique os dados informados ou cadastre um novo cliente.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={limparPesquisa}
                    className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
                  >
                    Limpar pesquisa
                  </button>
                  <button
                    type="button"
                    onClick={abrirNovoCliente}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
                  >
                    <Plus size={17} />
                    Novo cliente
                  </button>
                </div>
              </div>
            )}

            {!carregando &&
              !erro &&
              clientesFiltrados.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px]">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-gray-500">
                        <th className="px-4 py-3 font-medium">Cliente</th>
                        <th className="px-4 py-3 font-medium">Contato</th>
                        <th className="px-4 py-3 font-medium">Documento</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientesFiltrados.map((cliente) => (
                        <tr
                          key={cliente.id}
                          className="border-b border-white/5 transition hover:bg-white/[0.025]"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-xs font-bold text-blue-400">
                                {iniciais(cliente.nome)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-white">{cliente.nome}</p>
                                <p className="mt-0.5 text-xs text-gray-600">Cliente</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              {cliente.whatsapp && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <Phone size={13} />
                                  {cliente.whatsapp}
                                </div>
                              )}
                              {cliente.email && (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Mail size={13} />
                                  {cliente.email}
                                </div>
                              )}
                              {!cliente.whatsapp && !cliente.email && (
                                <span className="text-sm text-gray-600">—</span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-4 text-sm text-gray-400">
                            {cliente.documento || "—"}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                                cliente.status === "ativo"
                                  ? "border-green-500/15 bg-green-500/10 text-green-400"
                                  : "border-gray-500/15 bg-gray-500/10 text-gray-400"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  cliente.status === "ativo"
                                    ? "bg-green-400"
                                    : "bg-gray-400"
                                }`}
                              />
                              {cliente.status === "ativo" ? "Ativo" : "Inativo"}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => abrirDetalhes(cliente)}
                                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
                              >
                                Ver cliente
                              </button>
                              <button
                                type="button"
                                onClick={() => abrirEdicao(cliente)}
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-white"
                                title="Editar cliente"
                              >
                                <Edit3 size={17} />
                              </button>
                              <button
                                type="button"
                                onClick={() => abrirExclusao(cliente)}
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-red-500/10 hover:text-red-400"
                                title="Excluir cliente"
                              >
                                <Trash2 size={17} />
                              </button>
                              <button
                                type="button"
                                onClick={() => abrirDetalhes(cliente)}
                                className="rounded-lg p-2 text-gray-600 transition hover:bg-white/5 hover:text-white"
                                title="Mais ações"
                              >
                                <MoreVertical size={18} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#101318] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div>
                <h2 className="text-xl font-bold">
                  {modoEdicao ? "Editar cliente" : "Novo cliente"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {modoEdicao
                    ? "Atualize os dados do cliente."
                    : "Cadastre os dados principais do cliente."}
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

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Nome *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome completo ou empresa"
                  className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(16) 99999-9999"
                    className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    CPF / CNPJ
                  </label>
                  <input
                    type="text"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    placeholder="CPF ou CNPJ"
                    className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                  />
                </div>
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
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Observações
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Informações importantes sobre o cliente..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
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
                  onClick={salvarCliente}
                  disabled={salvando}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {salvando
                    ? modoEdicao
                      ? "Salvando..."
                      : "Cadastrando..."
                    : modoEdicao
                    ? "Salvar alterações"
                    : "Cadastrar cliente"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarDetalhes && clienteSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#101318] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 font-bold text-blue-400">
                  {iniciais(clienteSelecionado.nome)}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{clienteSelecionado.nome}</h2>
                  <p className="mt-1 text-sm text-gray-500">Cadastro do cliente</p>
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
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-gray-600">
                  <User size={14} />
                  Nome
                </div>
                <p className="text-sm font-medium text-white">
                  {clienteSelecionado.nome || "—"}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0b0d10] p-4">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-gray-600">
                  <Mail size={14} />
                  E-mail
                </div>
                <p className="break-all text-sm font-medium text-white">
                  {clienteSelecionado.email || "Não informado"}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0b0d10] p-4">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-gray-600">
                  <Phone size={14} />
                  WhatsApp
                </div>
                <p className="text-sm font-medium text-white">
                  {clienteSelecionado.whatsapp || "Não informado"}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0b0d10] p-4">
                <p className="mb-2 text-xs uppercase tracking-wider text-gray-600">
                  CPF / CNPJ
                </p>
                <p className="text-sm font-medium text-white">
                  {clienteSelecionado.documento || "Não informado"}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0b0d10] p-4">
                <p className="mb-2 text-xs uppercase tracking-wider text-gray-600">
                  Cadastro
                </p>
                <p className="text-sm font-medium text-white">
                  {formatarData(clienteSelecionado.created_at)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0b0d10] p-4">
                <p className="mb-2 text-xs uppercase tracking-wider text-gray-600">
                  Status
                </p>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                    clienteSelecionado.status === "ativo"
                      ? "border-green-500/15 bg-green-500/10 text-green-400"
                      : "border-gray-500/15 bg-gray-500/10 text-gray-400"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      clienteSelecionado.status === "ativo"
                        ? "bg-green-400"
                        : "bg-gray-400"
                    }`}
                  />
                  {clienteSelecionado.status === "ativo" ? "Ativo" : "Inativo"}
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0b0d10] p-4 sm:col-span-2">
                <p className="mb-2 text-xs uppercase tracking-wider text-gray-600">
                  Observações
                </p>
                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-300">
                  {clienteSelecionado.observacoes || "Nenhuma observação cadastrada."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-3 border-t border-white/10 p-6">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => abrirEdicao(clienteSelecionado)}
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/5"
                >
                  <Edit3 size={16} />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => abrirExclusao(clienteSelecionado)}
                  className="flex items-center gap-2 rounded-xl border border-red-500/15 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 size={16} />
                  Excluir
                </button>
              </div>

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
      )}

      {mostrarExclusao && clienteSelecionado && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101318] p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
              <AlertTriangle size={23} />
            </div>

            <h2 className="mt-5 text-xl font-bold">Excluir cliente?</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Você está prestes a excluir <span className="font-medium text-gray-300">{clienteSelecionado.nome}</span>.
              Essa ação remove o cadastro do banco de dados.
            </p>

            {erroExclusao && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {erroExclusao}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setMostrarExclusao(false);
                  setErroExclusao("");
                }}
                disabled={excluindo}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/5 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={excluirCliente}
                disabled={excluindo}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {excluindo ? "Excluindo..." : "Excluir cliente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;
