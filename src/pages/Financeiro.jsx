import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Check,
  ChevronDown,
  Edit3,
  Filter,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import BuscaCliente from "../BuscaCliente";

const CATEGORIAS_ENTRADA = [
  ["venda_site", "Venda de site"],
  ["mensalidade", "Mensalidade"],
  ["hospedagem", "Hospedagem"],
  ["manutencao", "Manutenção"],
  ["dominio", "Domínio"],
  ["servico", "Outro serviço"],
  ["outros", "Outros"],
];

const CATEGORIAS_SAIDA = [
  ["hospedagem", "Hospedagem"],
  ["dominio", "Domínio"],
  ["ferramentas", "Ferramentas"],
  ["api", "APIs"],
  ["anuncios", "Anúncios"],
  ["servidor", "Servidor"],
  ["assinaturas", "Assinaturas"],
  ["outros", "Outros"],
];

const FORMAS_PAGAMENTO = [
  ["pix", "Pix"],
  ["cartao", "Cartão"],
  ["boleto", "Boleto"],
  ["transferencia", "Transferência"],
  ["dinheiro", "Dinheiro"],
  ["outro", "Outro"],
];

function dataHoje() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(valor) {
  if (!valor) return "—";

  const [ano, mes, dia] = valor.split("-");

  if (!ano || !mes || !dia) return valor;

  return `${dia}/${mes}/${ano}`;
}

function normalizar(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function categoriaNome(tipo, categoria) {
  const lista =
    tipo === "entrada" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;

  return (
    lista.find(([id]) => id === categoria)?.[1] ||
    categoria ||
    "Outros"
  );
}

function formatarValorInput(valor) {
  const numeros = String(valor ?? "").replace(/\D/g, "");

  if (!numeros) return "";

  const numero = Number(numeros) / 100;

  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function converterValor(valor) {
  const texto = String(valor ?? "").trim();

  if (!texto) return 0;

  const limpo = texto.replace(/\./g, "").replace(",", ".");

  return Number(limpo);
}

function BuscaProjeto({
  projetos,
  value,
  onChange,
  clienteId,
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    function fechar(evento) {
      if (ref.current && !ref.current.contains(evento.target)) {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", fechar);

    return () => {
      document.removeEventListener("mousedown", fechar);
    };
  }, []);

  const projetosDisponiveis = projetos.filter(
    (projeto) =>
      !clienteId || projeto.cliente_id === clienteId
  );

  const projetoSelecionado = projetosDisponiveis.find(
    (projeto) => projeto.id === value
  );

  const projetosFiltrados = projetosDisponiveis.filter(
    (projeto) =>
      normalizar(projeto.nome).includes(normalizar(busca))
  );

  return (
    <div ref={ref} className="relative">
      <label className="mb-2 block text-sm font-medium text-gray-300">
        Projeto
      </label>

      <button
        type="button"
        onClick={() => setAberto((estado) => !estado)}
        disabled={projetosDisponiveis.length === 0}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-left text-sm text-white outline-none transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span
          className={
            projetoSelecionado ? "text-white" : "text-gray-500"
          }
        >
          {projetoSelecionado?.nome ||
            (projetosDisponiveis.length === 0
              ? clienteId
                ? "Nenhum projeto para este cliente"
                : "Nenhum projeto cadastrado"
              : "Pesquisar projeto...")}
        </span>

        <ChevronDown
          size={17}
          className="shrink-0 text-gray-500"
        />
      </button>

      {aberto && projetosDisponiveis.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-[80] mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#15181e] shadow-2xl">
          <div className="flex items-center gap-2 border-b border-white/10 p-3">
            <Search
              size={16}
              className="shrink-0 text-gray-500"
            />

            <input
              autoFocus
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar projeto..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
            />

            {busca && (
              <button
                type="button"
                onClick={() => setBusca("")}
                className="rounded-md p-1 text-gray-500 hover:bg-white/5 hover:text-white"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto p-2">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setBusca("");
                setAberto(false);
              }}
              className="mb-1 flex w-full items-center rounded-lg px-3 py-3 text-left text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              Sem projeto
            </button>

            {projetosFiltrados.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-500">
                Nenhum projeto encontrado.
              </div>
            ) : (
              projetosFiltrados.map((projeto) => {
                const selecionado = projeto.id === value;

                return (
                  <button
                    key={projeto.id}
                    type="button"
                    onClick={() => {
                      onChange(projeto.id);
                      setBusca("");
                      setAberto(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm transition hover:bg-white/5"
                  >
                    <span className="truncate text-gray-200">
                      {projeto.nome}
                    </span>

                    {selecionado && (
                      <Check
                        size={17}
                        className="shrink-0 text-blue-400"
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Financeiro() {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [pesquisa, setPesquisa] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const [tipo, setTipo] = useState("entrada");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("venda_site");
  const [valor, setValor] = useState("");
  const [dataLancamento, setDataLancamento] = useState(dataHoje());
  const [dataVencimento, setDataVencimento] = useState("");
  const [status, setStatus] = useState("pendente");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [recorrente, setRecorrente] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [projetoId, setProjetoId] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [erroFormulario, setErroFormulario] = useState("");

  async function carregarDados() {
    setCarregando(true);
    setErro("");

    const [
      movResult,
      clientesResult,
      projetosResult,
    ] = await Promise.all([
      supabase
        .from("movimentacoes")
        .select(
          "*, cliente:clientes(id,nome), projeto:projetos(id,nome)"
        )
        .order("data_lancamento", { ascending: false })
        .order("created_at", { ascending: false }),

      supabase
        .from("clientes")
        .select("id,nome")
        .order("nome"),

      supabase
        .from("projetos")
        .select("id,nome,cliente_id")
        .order("nome"),
    ]);

    if (
      movResult.error ||
      clientesResult.error ||
      projetosResult.error
    ) {
      const primeiraFalha =
        movResult.error ||
        clientesResult.error ||
        projetosResult.error;

      console.error(
        "Erro ao carregar financeiro:",
        primeiraFalha
      );

      setErro(primeiraFalha.message);
    } else {
      setMovimentacoes(movResult.data || []);
      setClientes(clientesResult.data || []);
      setProjetos(projetosResult.data || []);
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
    setEditandoId(null);
    setTipo("entrada");
    setDescricao("");
    setCategoria("venda_site");
    setValor("");
    setDataLancamento(dataHoje());
    setDataVencimento("");
    setStatus("pendente");
    setFormaPagamento("");
    setRecorrente(false);
    setClienteId("");
    setProjetoId("");
    setObservacoes("");
    setErroFormulario("");
  }

  function abrirNovoLancamento() {
    limparFormulario();
    setMostrarFormulario(true);
  }

  function abrirEdicao(item) {
    setEditandoId(item.id);
    setTipo(item.tipo);
    setDescricao(item.descricao || "");
    setCategoria(item.categoria || "outros");
    setValor(formatarValorInput(item.valor));
    setDataLancamento(
      item.data_lancamento || dataHoje()
    );
    setDataVencimento(item.data_vencimento || "");
    setStatus(item.status || "pendente");
    setFormaPagamento(item.forma_pagamento || "");
    setRecorrente(Boolean(item.recorrente));
    setClienteId(item.cliente_id || "");
    setProjetoId(item.projeto_id || "");
    setObservacoes(item.observacoes || "");
    setErroFormulario("");
    setMostrarFormulario(true);
  }

  function trocarTipo(novoTipo) {
    setTipo(novoTipo);
    setCategoria(
      novoTipo === "entrada" ? "venda_site" : "outros"
    );
  }

  function alterarValor(evento) {
    setValor(formatarValorInput(evento.target.value));
  }

  async function salvarLancamento() {
    if (!descricao.trim()) {
      setErroFormulario("Digite uma descrição.");
      return;
    }

    const valorNumerico = converterValor(valor);

    if (
      !Number.isFinite(valorNumerico) ||
      valorNumerico <= 0
    ) {
      setErroFormulario(
        "Digite um valor válido maior que zero."
      );
      return;
    }

    if (!dataLancamento) {
      setErroFormulario(
        "Informe a data do lançamento."
      );
      return;
    }

    setSalvando(true);
    setErroFormulario("");

    const payload = {
      tipo,
      descricao: descricao.trim(),
      categoria,
      valor: valorNumerico,
      data_lancamento: dataLancamento,
      data_vencimento: dataVencimento || null,
      status,
      forma_pagamento: formaPagamento || null,
      recorrente,
      cliente_id: clienteId || null,
      projeto_id: projetoId || null,
      observacoes: observacoes.trim() || null,
    };

    const query = editandoId
      ? supabase
          .from("movimentacoes")
          .update(payload)
          .eq("id", editandoId)
          .select(
            "*, cliente:clientes(id,nome), projeto:projetos(id,nome)"
          )
          .single()
      : supabase
          .from("movimentacoes")
          .insert([payload])
          .select(
            "*, cliente:clientes(id,nome), projeto:projetos(id,nome)"
          )
          .single();

    const { data, error } = await query;

    if (error) {
      console.error(
        "Erro ao salvar lançamento:",
        error
      );

      setErroFormulario(error.message);
      setSalvando(false);
      return;
    }

    if (editandoId) {
      setMovimentacoes((lista) =>
        lista.map((item) =>
          item.id === data.id ? data : item
        )
      );
    } else {
      setMovimentacoes((lista) => [data, ...lista]);
    }

    setMostrarFormulario(false);
    limparFormulario();
    setSalvando(false);
  }

  async function excluirLancamento(id) {
    const confirmado = window.confirm(
      "Excluir este lançamento? Essa ação não pode ser desfeita."
    );

    if (!confirmado) return;

    const { error } = await supabase
      .from("movimentacoes")
      .delete()
      .eq("id", id);

    if (error) {
      setErro(error.message);
      return;
    }

    setMovimentacoes((lista) =>
      lista.filter((item) => item.id !== id)
    );
  }

  async function alterarStatus(item) {
    const novoStatus =
      item.status === "pago" ? "pendente" : "pago";

    const { data, error } = await supabase
      .from("movimentacoes")
      .update({ status: novoStatus })
      .eq("id", item.id)
      .select(
        "*, cliente:clientes(id,nome), projeto:projetos(id,nome)"
      )
      .single();

    if (error) {
      setErro(error.message);
      return;
    }

    setMovimentacoes((lista) =>
      lista.map((linha) =>
        linha.id === data.id ? data : linha
      )
    );
  }

  const hoje = dataHoje();
  const mesAtual = hoje.slice(0, 7);

  const entradasMes = movimentacoes
    .filter(
      (item) =>
        item.tipo === "entrada" &&
        item.status !== "cancelado" &&
        item.data_lancamento?.slice(0, 7) === mesAtual
    )
    .reduce(
      (total, item) => total + Number(item.valor || 0),
      0
    );

  const saidasMes = movimentacoes
    .filter(
      (item) =>
        item.tipo === "saida" &&
        item.status !== "cancelado" &&
        item.data_lancamento?.slice(0, 7) === mesAtual
    )
    .reduce(
      (total, item) => total + Number(item.valor || 0),
      0
    );

  const lucroMes = entradasMes - saidasMes;

  const receber = movimentacoes
    .filter(
      (item) =>
        item.tipo === "entrada" &&
        item.status === "pendente" &&
        (!item.data_vencimento ||
          item.data_vencimento >= hoje)
    )
    .reduce(
      (total, item) => total + Number(item.valor || 0),
      0
    );

  const atrasado = movimentacoes
    .filter(
      (item) =>
        item.tipo === "entrada" &&
        item.status === "pendente" &&
        item.data_vencimento &&
        item.data_vencimento < hoje
    )
    .reduce(
      (total, item) => total + Number(item.valor || 0),
      0
    );

  const movimentacoesFiltradas = useMemo(() => {
    const termo = normalizar(pesquisa);

    return movimentacoes.filter((item) => {
      const correspondeTipo =
        filtroTipo === "todos" ||
        item.tipo === filtroTipo;

      const correspondeStatus =
        filtroStatus === "todos" ||
        item.status === filtroStatus;

      if (!correspondeTipo || !correspondeStatus) {
        return false;
      }

      if (!termo) return true;

      const texto = [
        item.descricao,
        item.categoria,
        item.cliente?.nome,
        item.projeto?.nome,
        item.forma_pagamento,
      ]
        .map(normalizar)
        .join(" ");

      return texto.includes(termo);
    });
  }, [
    movimentacoes,
    pesquisa,
    filtroTipo,
    filtroStatus,
  ]);

  const categorias =
    tipo === "entrada"
      ? CATEGORIAS_ENTRADA
      : CATEGORIAS_SAIDA;

  return (
    <div className="min-h-screen bg-[#0b0d10] p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                <Wallet
                  size={21}
                  className="text-emerald-400"
                />
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Financeiro
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Controle entradas, despesas,
                  recebimentos e resultado do negócio.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={abrirNovoLancamento}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
          >
            <Plus size={18} />
            Novo lançamento
          </button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-[#101318] p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Entradas no mês
            </p>

            <div className="mt-2 flex items-end justify-between gap-3">
              <span className="text-2xl font-bold text-emerald-400">
                {moeda(entradasMes)}
              </span>

              <ArrowUpCircle
                size={20}
                className="text-emerald-400"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101318] p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Saídas no mês
            </p>

            <div className="mt-2 flex items-end justify-between gap-3">
              <span className="text-2xl font-bold text-red-400">
                {moeda(saidasMes)}
              </span>

              <ArrowDownCircle
                size={20}
                className="text-red-400"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101318] p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Resultado do mês
            </p>

            <div className="mt-2 flex items-end justify-between gap-3">
              <span
                className={`text-2xl font-bold ${
                  lucroMes >= 0
                    ? "text-blue-400"
                    : "text-red-400"
                }`}
              >
                {moeda(lucroMes)}
              </span>

              <Wallet
                size={20}
                className="text-blue-400"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101318] p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              A receber
            </p>

            <div className="mt-2 flex items-end justify-between gap-3">
              <span className="text-2xl font-bold text-amber-400">
                {moeda(receber)}
              </span>

              <ChevronDown
                size={20}
                className="text-amber-400"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101318] p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Em atraso
            </p>

            <div className="mt-2 flex items-end justify-between gap-3">
              <span className="text-2xl font-bold text-red-400">
                {moeda(atrasado)}
              </span>

              <Filter
                size={20}
                className="text-red-400"
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101318]">
          <div className="flex flex-col gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Search
                size={18}
                className="shrink-0 text-gray-500"
              />

              <input
                type="text"
                value={pesquisa}
                onChange={(e) =>
                  setPesquisa(e.target.value)
                }
                placeholder="Pesquisar descrição, cliente ou projeto..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
              />

              {pesquisa && (
                <button
                  type="button"
                  onClick={() => setPesquisa("")}
                  className="rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={filtroTipo}
                onChange={(e) =>
                  setFiltroTipo(e.target.value)
                }
                className="rounded-xl border border-white/10 bg-[#0b0d10] px-3 py-2.5 text-sm text-gray-300 outline-none"
              >
                <option value="todos">
                  Todos os tipos
                </option>
                <option value="entrada">
                  Entradas
                </option>
                <option value="saida">
                  Saídas
                </option>
              </select>

              <select
                value={filtroStatus}
                onChange={(e) =>
                  setFiltroStatus(e.target.value)
                }
                className="rounded-xl border border-white/10 bg-[#0b0d10] px-3 py-2.5 text-sm text-gray-300 outline-none"
              >
                <option value="todos">
                  Todos os status
                </option>
                <option value="pendente">
                  Pendentes
                </option>
                <option value="pago">
                  Pagos
                </option>
                <option value="cancelado">
                  Cancelados
                </option>
              </select>
            </div>
          </div>

          <div className="p-5">
            {carregando && (
              <div className="flex min-h-72 items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />

                  <p className="text-sm text-gray-500">
                    Carregando financeiro...
                  </p>
                </div>
              </div>
            )}

            {!carregando && erro && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5">
                <p className="font-medium text-red-400">
                  Não foi possível carregar o financeiro.
                </p>

                <p className="mt-1 text-sm text-red-400/70">
                  {erro}
                </p>

                <button
                  type="button"
                  onClick={carregarDados}
                  className="mt-4 rounded-lg border border-red-400/20 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-400/10"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {!carregando &&
              !erro &&
              movimentacoesFiltradas.length === 0 && (
                <div className="flex min-h-72 flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                    <Wallet
                      size={27}
                      className="text-gray-500"
                    />
                  </div>

                  <h2 className="text-xl font-semibold">
                    Nenhum lançamento encontrado
                  </h2>

                  <p className="mt-2 max-w-md text-sm text-gray-500">
                    Cadastre sua primeira entrada ou
                    despesa para começar a acompanhar o
                    caixa.
                  </p>

                  <button
                    type="button"
                    onClick={abrirNovoLancamento}
                    className="mt-6 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
                  >
                    <Plus size={18} />
                    Novo lançamento
                  </button>
                </div>
              )}

            {!carregando &&
              !erro &&
              movimentacoesFiltradas.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px]">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-gray-500">
                        <th className="px-4 py-3 font-medium">
                          Lançamento
                        </th>

                        <th className="px-4 py-3 font-medium">
                          Cliente / Projeto
                        </th>

                        <th className="px-4 py-3 font-medium">
                          Data
                        </th>

                        <th className="px-4 py-3 font-medium">
                          Status
                        </th>

                        <th className="px-4 py-3 text-right font-medium">
                          Valor
                        </th>

                        <th className="px-4 py-3 text-right font-medium">
                          Ações
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {movimentacoesFiltradas.map(
                        (item) => (
                          <tr
                            key={item.id}
                            className="border-b border-white/5 transition hover:bg-white/[0.025]"
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                    item.tipo ===
                                    "entrada"
                                      ? "bg-emerald-500/10"
                                      : "bg-red-500/10"
                                  }`}
                                >
                                  {item.tipo ===
                                  "entrada" ? (
                                    <ArrowUpCircle
                                      size={18}
                                      className="text-emerald-400"
                                    />
                                  ) : (
                                    <ArrowDownCircle
                                      size={18}
                                      className="text-red-400"
                                    />
                                  )}
                                </div>

                                <div>
                                  <p className="font-medium text-white">
                                    {item.descricao}
                                  </p>

                                  <p className="mt-1 text-xs text-gray-600">
                                    {categoriaNome(
                                      item.tipo,
                                      item.categoria
                                    )}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <p className="text-sm text-gray-300">
                                {item.cliente?.nome ||
                                  "Sem cliente"}
                              </p>

                              <p className="mt-1 text-xs text-gray-600">
                                {item.projeto?.nome ||
                                  "Sem projeto"}
                              </p>
                            </td>

                            <td className="px-4 py-4">
                              <p className="text-sm text-gray-300">
                                {formatarData(
                                  item.data_lancamento
                                )}
                              </p>

                              <p className="mt-1 text-xs text-gray-600">
                                Venc.:{" "}
                                {formatarData(
                                  item.data_vencimento
                                )}
                              </p>
                            </td>

                            <td className="px-4 py-4">
                              <button
                                type="button"
                                onClick={() =>
                                  item.status !==
                                    "cancelado" &&
                                  alterarStatus(item)
                                }
                                disabled={
                                  item.status ===
                                  "cancelado"
                                }
                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                                  item.status ===
                                  "pago"
                                    ? "border-green-500/15 bg-green-500/10 text-green-400"
                                    : item.status ===
                                      "cancelado"
                                    ? "border-white/10 bg-white/5 text-gray-500"
                                    : "border-amber-500/15 bg-amber-500/10 text-amber-400 hover:bg-amber-500/15"
                                }`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />

                                {item.status ===
                                "pago"
                                  ? "Pago"
                                  : item.status ===
                                    "cancelado"
                                  ? "Cancelado"
                                  : "Pendente"}
                              </button>
                            </td>

                            <td
                              className={`px-4 py-4 text-right text-sm font-semibold ${
                                item.tipo ===
                                "entrada"
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }`}
                            >
                              {item.tipo === "entrada"
                                ? "+"
                                : "-"}{" "}
                              {moeda(item.valor)}
                            </td>

                            <td className="px-4 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    abrirEdicao(item)
                                  }
                                  className="rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-white"
                                  title="Editar"
                                >
                                  <Edit3 size={17} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    excluirLancamento(
                                      item.id
                                    )
                                  }
                                  className="rounded-lg p-2 text-gray-500 transition hover:bg-red-500/10 hover:text-red-400"
                                  title="Excluir"
                                >
                                  <Trash2 size={17} />
                                </button>

                                <button
                                  type="button"
                                  className="rounded-lg p-2 text-gray-600"
                                  title="Mais ações"
                                >
                                  <MoreVertical
                                    size={17}
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </div>
      </div>

      {mostrarFormulario && (
        <div className="max-h-[calc(100dvh-140px)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#101318] shadow-2xl">
         <div className="max-h-[calc(100dvh-140px)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#101318] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div>
                <h2 className="text-xl font-bold">
                  {editandoId
                    ? "Editar lançamento"
                    : "Novo lançamento"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Registre uma entrada ou despesa do
                  negócio.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMostrarFormulario(false);
                  limparFormulario();
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              {erroFormulario && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  {erroFormulario}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    trocarTipo("entrada")
                  }
                  className={`rounded-xl border p-4 text-left transition ${
                    tipo === "entrada"
                      ? "border-emerald-500/30 bg-emerald-500/10"
                      : "border-white/10 bg-[#0b0d10] hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ArrowUpCircle
                      size={20}
                      className="text-emerald-400"
                    />

                    <div>
                      <p className="font-semibold">
                        Entrada
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Receita ou valor a receber.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    trocarTipo("saida")
                  }
                  className={`rounded-xl border p-4 text-left transition ${
                    tipo === "saida"
                      ? "border-red-500/30 bg-red-500/10"
                      : "border-white/10 bg-[#0b0d10] hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ArrowDownCircle
                      size={20}
                      className="text-red-400"
                    />

                    <div>
                      <p className="font-semibold">
                        Saída
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Despesa ou custo do negócio.
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Descrição *
                  </label>

                  <input
                    value={descricao}
                    onChange={(e) =>
                      setDescricao(e.target.value)
                    }
                    placeholder="Ex.: Desenvolvimento do site da Clínica X"
                    className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Categoria
                  </label>

                  <select
                    value={categoria}
                    onChange={(e) =>
                      setCategoria(e.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-gray-300 outline-none"
                  >
                    {categorias.map(
                      ([id, nome]) => (
                        <option
                          key={id}
                          value={id}
                        >
                          {nome}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Valor *
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                      R$
                    </span>

                    <input
                      type="text"
                      inputMode="decimal"
                      value={valor}
                      onChange={alterarValor}
                      placeholder="0,00"
                      className="w-full rounded-xl border border-white/10 bg-[#0b0d10] py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Data do lançamento *
                  </label>

                  <input
                    type="date"
                    value={dataLancamento}
                    onChange={(e) =>
                      setDataLancamento(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Data de vencimento
                  </label>

                  <input
                    type="date"
                    value={dataVencimento}
                    onChange={(e) =>
                      setDataVencimento(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Status
                  </label>

                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-gray-300 outline-none"
                  >
                    <option value="pendente">
                      Pendente
                    </option>

                    <option value="pago">
                      Pago
                    </option>

                    <option value="cancelado">
                      Cancelado
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Forma de pagamento
                  </label>

                  <select
                    value={formaPagamento}
                    onChange={(e) =>
                      setFormaPagamento(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-gray-300 outline-none"
                  >
                    <option value="">
                      Não informado
                    </option>

                    {FORMAS_PAGAMENTO.map(
                      ([id, nome]) => (
                        <option
                          key={id}
                          value={id}
                        >
                          {nome}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <BuscaCliente
                    clientes={clientes}
                    value={clienteId}
                    onChange={(id) => {
                      setClienteId(id);
                      setProjetoId("");
                    }}
                    label="Cliente"
                  />
                </div>

                <div>
                  <BuscaProjeto
                    projetos={projetos}
                    value={projetoId}
                    onChange={setProjetoId}
                    clienteId={clienteId}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Observações
                  </label>

                  <textarea
                    rows="3"
                    value={observacoes}
                    onChange={(e) =>
                      setObservacoes(e.target.value)
                    }
                    placeholder="Informações adicionais..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-[#0b0d10] p-4 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={recorrente}
                    onChange={(e) =>
                      setRecorrente(
                        e.target.checked
                      )
                    }
                    className="h-4 w-4 accent-blue-600"
                  />

                  <div>
                    <p className="text-sm font-medium text-gray-300">
                      Lançamento recorrente
                    </p>

                    <p className="mt-1 text-xs text-gray-600">
                      Marque para indicar cobrança ou
                      custo que se repete.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 border-t border-white/10 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormulario(false);
                    limparFormulario();
                  }}
                  className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/5"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={salvarLancamento}
                  disabled={salvando}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {salvando
                    ? "Salvando..."
                    : editandoId
                    ? "Salvar alterações"
                    : "Cadastrar lançamento"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Financeiro;