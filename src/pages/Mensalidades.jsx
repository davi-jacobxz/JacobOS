import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Edit3,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import BuscaCliente from "../BuscaCliente";
import { supabase } from "../lib/supabase";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function converterValor(valor) {
  const numero = String(valor || "")
    .replace(/[^\d,]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const resultado = Number(numero);

  return Number.isFinite(resultado) ? resultado : 0;
}

function formatarValorInput(valor) {
  const numeros = String(valor || "").replace(/\D/g, "");

  if (!numeros) return "";

  return (Number(numeros) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatarData(data) {
  if (!data) return "—";

  return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR");
}

function dataPrimeiraCobrancaPadrao() {
  const hoje = new Date();

  const proximoMes = new Date(
    hoje.getFullYear(),
    hoje.getMonth() + 1,
    hoje.getDate()
  );

  return proximoMes.toISOString().slice(0, 10);
}

function gerarProximasCobrancas(dataInicial, quantidade = 6) {
  if (!dataInicial) return [];

  const original = new Date(`${dataInicial}T12:00:00`);
  const diaOriginal = original.getDate();

  return Array.from({ length: quantidade }, (_, index) => {
    const data = new Date(
      original.getFullYear(),
      original.getMonth() + index,
      1
    );

    const ultimoDia = new Date(
      data.getFullYear(),
      data.getMonth() + 1,
      0
    ).getDate();

    data.setDate(Math.min(diaOriginal, ultimoDia));

    return data;
  });
}

function obterStatusCobranca(status, dataVencimento) {
  if (status === "pago") return "pago";
  if (status === "cancelado") return "cancelado";

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const vencimento = new Date(`${dataVencimento}T12:00:00`);

  if (vencimento < hoje) return "atrasado";

  return "pendente";
}

export default function Mensalidades() {
  const anoAtual = new Date().getFullYear();

  const [ano, setAno] = useState(anoAtual);

  const [mensalidades, setMensalidades] = useState([]);
  const [cobrancas, setCobrancas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [projetos, setProjetos] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [pesquisa, setPesquisa] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);

  const [erro, setErro] = useState("");

  const [form, setForm] = useState({
    cliente_id: "",
    projeto_id: "",
    descricao: "",
    categoria: "manutencao",
    valor: "",
    data_primeira_cobranca: dataPrimeiraCobrancaPadrao(),
    data_fim: "",
    status: "ativa",
    observacoes: "",
  });

  const carregarBase = useCallback(async () => {
    const [clientesResponse, projetosResponse] = await Promise.all([
      supabase
        .from("clientes")
        .select("id, nome")
        .order("nome", { ascending: true }),

      supabase
        .from("projetos")
        .select("id, nome, cliente_id")
        .order("nome", { ascending: true }),
    ]);

    if (clientesResponse.error) {
      setErro(clientesResponse.error.message);
    } else {
      setClientes(clientesResponse.data || []);
    }

    if (projetosResponse.error) {
      setErro(projetosResponse.error.message);
    } else {
      setProjetos(projetosResponse.data || []);
    }
  }, []);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");

    const inicio = `${ano}-01-01`;
    const fim = `${ano}-12-31`;

    await supabase.rpc("gerar_cobrancas_mensais", {
      p_inicio: inicio,
      p_fim: fim,
    });

    const [mensalidadesResponse, cobrancasResponse] = await Promise.all([
      supabase
        .from("mensalidades")
        .select(`
          *,
          cliente:clientes(id, nome),
          projeto:projetos(id, nome)
        `)
        .order("created_at", { ascending: false }),

      supabase
        .from("cobrancas_mensais")
        .select(`
          *,
          mensalidade:mensalidades(
            id,
            descricao,
            cliente:clientes(id, nome)
          )
        `)
        .gte("competencia", inicio)
        .lte("competencia", fim)
        .order("data_vencimento", { ascending: true }),
    ]);

    if (mensalidadesResponse.error) {
      setErro(mensalidadesResponse.error.message);
    } else {
      setMensalidades(mensalidadesResponse.data || []);
    }

    if (cobrancasResponse.error) {
      setErro(cobrancasResponse.error.message);
    } else {
      setCobrancas(cobrancasResponse.data || []);
    }

    setCarregando(false);
  }, [ano]);

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarBase();
      carregar();
    }, 0);

    return () => clearTimeout(timer);
  }, [carregarBase, carregar]);

  const mensalidadesFiltradas = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) {
      return mensalidades;
    }

    return mensalidades.filter((item) => {
      const cliente = item.cliente?.nome || "";
      const projeto = item.projeto?.nome || "";

      return (
        item.descricao?.toLowerCase().includes(termo) ||
        cliente.toLowerCase().includes(termo) ||
        projeto.toLowerCase().includes(termo) ||
        item.categoria?.toLowerCase().includes(termo)
      );
    });
  }, [mensalidades, pesquisa]);

  const cobrancasAno = useMemo(() => {
    return cobrancas.filter((item) =>
      item.competencia?.startsWith(String(ano))
    );
  }, [cobrancas, ano]);

  const totalMensal = useMemo(() => {
    return mensalidades
      .filter((item) => item.status === "ativa")
      .reduce((total, item) => total + Number(item.valor || 0), 0);
  }, [mensalidades]);

  const totalPago = useMemo(() => {
    return cobrancasAno
      .filter((item) => item.status === "pago")
      .reduce((total, item) => total + Number(item.valor || 0), 0);
  }, [cobrancasAno]);

  const totalReceber = useMemo(() => {
    return cobrancasAno
      .filter(
        (item) =>
          obterStatusCobranca(item.status, item.data_vencimento) ===
          "pendente"
      )
      .reduce((total, item) => total + Number(item.valor || 0), 0);
  }, [cobrancasAno]);

  const totalAtrasado = useMemo(() => {
    return cobrancasAno
      .filter(
        (item) =>
          obterStatusCobranca(item.status, item.data_vencimento) ===
          "atrasado"
      )
      .reduce((total, item) => total + Number(item.valor || 0), 0);
  }, [cobrancasAno]);

  const projetosDoCliente = useMemo(() => {
    if (!form.cliente_id) return [];

    return projetos.filter(
      (projeto) => projeto.cliente_id === form.cliente_id
    );
  }, [projetos, form.cliente_id]);

  function abrirNovo() {
    setEditando(null);
    setErro("");

    setForm({
      cliente_id: "",
      projeto_id: "",
      descricao: "",
      categoria: "manutencao",
      valor: "",
      data_primeira_cobranca: dataPrimeiraCobrancaPadrao(),
      data_fim: "",
      status: "ativa",
      observacoes: "",
    });

    setModalAberto(true);
  }

  function abrirEditar(item) {
    setEditando(item);
    setErro("");

    setForm({
      cliente_id: item.cliente_id || "",
      projeto_id: item.projeto_id || "",
      descricao: item.descricao || "",
      categoria: item.categoria || "manutencao",
      valor: formatarValorInput(item.valor),
      data_primeira_cobranca:
        item.data_primeira_cobranca ||
        item.data_inicio ||
        dataPrimeiraCobrancaPadrao(),
      data_fim: item.data_fim || "",
      status: item.status || "ativa",
      observacoes: item.observacoes || "",
    });

    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) return;

    setModalAberto(false);
    setEditando(null);
    setErro("");
  }

  async function salvar() {
    setErro("");

    if (!form.cliente_id) {
      setErro("Selecione um cliente.");
      return;
    }

    if (!form.descricao.trim()) {
      setErro("Digite a descrição da mensalidade.");
      return;
    }

    if (!form.valor) {
      setErro("Digite o valor mensal.");
      return;
    }

    if (!form.data_primeira_cobranca) {
      setErro("Informe a primeira cobrança.");
      return;
    }

    if (
      form.data_fim &&
      form.data_fim < form.data_primeira_cobranca
    ) {
      setErro(
        "A data final não pode ser anterior à primeira cobrança."
      );
      return;
    }

    setSalvando(true);

    const valor = converterValor(form.valor);

    const dados = {
      cliente_id: form.cliente_id,
      projeto_id: form.projeto_id || null,
      descricao: form.descricao.trim(),
      categoria: form.categoria,
      valor,
      data_primeira_cobranca: form.data_primeira_cobranca,

      // Mantém compatibilidade com a estrutura atual.
      data_inicio: form.data_primeira_cobranca,
      dia_vencimento: Number(
        form.data_primeira_cobranca.slice(8, 10)
      ),

      data_fim: form.data_fim || null,
      status: form.status,
      observacoes: form.observacoes.trim() || null,
    };

    let response;

    if (editando) {
      response = await supabase
        .from("mensalidades")
        .update(dados)
        .eq("id", editando.id);
    } else {
      response = await supabase
        .from("mensalidades")
        .insert(dados);
    }

    if (response.error) {
      setErro(response.error.message);
      setSalvando(false);
      return;
    }

    setSalvando(false);
    setModalAberto(false);
    setEditando(null);

    await carregar();
  }

  async function excluir(item) {
    const confirmou = window.confirm(
      `Tem certeza que deseja excluir "${item.descricao}"?`
    );

    if (!confirmou) return;

    const { error } = await supabase
      .from("mensalidades")
      .delete()
      .eq("id", item.id);

    if (error) {
      setErro(error.message);
      return;
    }

    await carregar();
  }

 async function marcarComoPago(cobranca) {
  setErro("");

  const { error } = await supabase.rpc(
    "marcar_cobranca_mensal_paga",
    {
      p_cobranca_id: cobranca.id,
    }
  );

  if (error) {
    setErro(error.message);
    return;
  }

  await carregar();
}

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Mensalidades
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Controle das cobranças recorrentes dos clientes.
          </p>
        </div>

        <button
          onClick={abrirNovo}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          <Plus size={18} />
          Nova mensalidade
        </button>
      </div>

      {/* ERRO */}

      {erro && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <span>{erro}</span>

          <button
            onClick={() => setErro("")}
            className="rounded-lg p-1 hover:bg-white/5"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* CARDS */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#111318] p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-400">
              Receita mensal ativa
            </span>

            <CircleDollarSign
              size={20}
              className="text-blue-400"
            />
          </div>

          <p className="text-2xl font-bold text-white">
            {formatarMoeda(totalMensal)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111318] p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-400">
              Recebido em {ano}
            </span>

            <CheckCircle2
              size={20}
              className="text-emerald-400"
            />
          </div>

          <p className="text-2xl font-bold text-white">
            {formatarMoeda(totalPago)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111318] p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-400">
              A receber
            </span>

            <CalendarDays
              size={20}
              className="text-yellow-400"
            />
          </div>

          <p className="text-2xl font-bold text-white">
            {formatarMoeda(totalReceber)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111318] p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-400">
              Em atraso
            </span>

            <CircleDollarSign
              size={20}
              className="text-red-400"
            />
          </div>

          <p className="text-2xl font-bold text-white">
            {formatarMoeda(totalAtrasado)}
          </p>
        </div>
      </div>

      {/* FILTROS */}

      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#111318] p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-lg">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />

          <input
            type="text"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar cliente ou mensalidade..."
            className="w-full rounded-xl border border-white/10 bg-[#0b0d10] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
          />
        </div>

        <select
          value={ano}
          onChange={(e) => setAno(Number(e.target.value))}
          className="rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none"
        >
          {[anoAtual - 2, anoAtual - 1, anoAtual, anoAtual + 1].map(
            (item) => (
              <option key={item} value={item}>
                {item}
              </option>
            )
          )}
        </select>
      </div>

      {/* LISTA DE MENSALIDADES */}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111318]">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="font-semibold text-white">
            Mensalidades cadastradas
          </h2>
        </div>

        {carregando ? (
          <div className="px-5 py-12 text-center text-sm text-gray-500">
            Carregando mensalidades...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-white/10 bg-white/[0.02]">
                <tr className="text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-4">Cliente</th>
                  <th className="px-5 py-4">Descrição</th>
                  <th className="px-5 py-4">Categoria</th>
                  <th className="px-5 py-4">Valor</th>
                  <th className="px-5 py-4">
                    Primeira cobrança
                  </th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {mensalidadesFiltradas.map((item) => (
                  <tr
                    key={item.id}
                    className="text-sm text-gray-300 transition hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium text-white">
                        {item.cliente?.nome ||
                          "Cliente removido"}
                      </div>

                      {item.projeto?.nome && (
                        <div className="mt-1 text-xs text-gray-500">
                          {item.projeto.nome}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-white">
                      {item.descricao}
                    </td>

                    <td className="px-5 py-4 capitalize text-gray-400">
                      {item.categoria}
                    </td>

                    <td className="px-5 py-4 font-semibold text-white">
                      {formatarMoeda(item.valor)}
                    </td>

                    <td className="px-5 py-4">
                      {formatarData(
                        item.data_primeira_cobranca
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          item.status === "ativa"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : item.status === "pausada"
                              ? "bg-yellow-500/10 text-yellow-400"
                              : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => abrirEditar(item)}
                          title="Editar"
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
                        >
                          <Edit3 size={17} />
                        </button>

                        <button
                          onClick={() => excluir(item)}
                          title="Excluir"
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {mensalidadesFiltradas.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-5 py-12 text-center text-sm text-gray-500"
                    >
                      Nenhuma mensalidade cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* COBRANÇAS */}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111318]">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="font-semibold text-white">
            Cobranças de {ano}
          </h2>
        </div>

        {cobrancasAno.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-500">
            Nenhuma cobrança encontrada.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {cobrancasAno.map((cobranca) => {
              const status = obterStatusCobranca(
                cobranca.status,
                cobranca.data_vencimento
              );

              return (
                <div
                  key={cobranca.id}
                  className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium text-white">
                      {cobranca.mensalidade?.cliente?.nome ||
                        "Cliente removido"}
                    </p>

                    <p className="mt-1 text-sm text-gray-400">
                      {cobranca.mensalidade?.descricao ||
                        "Mensalidade"}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Vencimento:{" "}
                      {formatarData(
                        cobranca.data_vencimento
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-white">
                      {formatarMoeda(cobranca.valor)}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        status === "pago"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : status === "atrasado"
                            ? "bg-red-500/10 text-red-400"
                            : status === "cancelado"
                              ? "bg-gray-500/10 text-gray-400"
                              : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {status}
                    </span>

                    {status !== "pago" &&
                      status !== "cancelado" && (
                        <button
                          onClick={() =>
                            marcarComoPago(cobranca)
                          }
                          className="rounded-lg border border-emerald-500/20 px-3 py-2 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/10"
                        >
                          Marcar pago
                        </button>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL */}

      {modalAberto && (
       <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 pb-28 pt-20 backdrop-blur-sm lg:items-center lg:p-4">
          <div className="max-h-[calc(100dvh-120px)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#11151b] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {editando
                    ? "Editar mensalidade"
                    : "Nova mensalidade"}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  A mensalidade é independente do valor de
                  desenvolvimento do site.
                </p>
              </div>

              <button
                onClick={fecharModal}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              {/* CLIENTE */}

              <BuscaCliente
                clientes={clientes}
                value={form.cliente_id}
                onChange={(valor) =>
                  setForm((estado) => ({
                    ...estado,
                    cliente_id: valor,
                    projeto_id: "",
                  }))
                }
              />

              {/* PROJETO */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Projeto
                </label>

                <select
                  value={form.projeto_id}
                  disabled={!form.cliente_id}
                  onChange={(e) =>
                    setForm((estado) => ({
                      ...estado,
                      projeto_id: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    {form.cliente_id
                      ? "Nenhum projeto"
                      : "Selecione um cliente primeiro"}
                  </option>

                  {projetosDoCliente.map((projeto) => (
                    <option
                      key={projeto.id}
                      value={projeto.id}
                    >
                      {projeto.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* DESCRIÇÃO */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Descrição *
                </label>

                <input
                  type="text"
                  value={form.descricao}
                  onChange={(e) =>
                    setForm((estado) => ({
                      ...estado,
                      descricao: e.target.value,
                    }))
                  }
                  placeholder="Ex.: Hospedagem + manutenção"
                  className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
                />
              </div>

              {/* CATEGORIA + STATUS */}

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Categoria
                  </label>

                  <select
                    value={form.categoria}
                    onChange={(e) =>
                      setForm((estado) => ({
                        ...estado,
                        categoria: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                  >
                    <option value="manutencao">
                      Manutenção
                    </option>

                    <option value="hospedagem">
                      Hospedagem
                    </option>

                    <option value="dominio">
                      Domínio
                    </option>

                    <option value="outros">
                      Outros
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((estado) => ({
                        ...estado,
                        status: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                  >
                    <option value="ativa">Ativa</option>
                    <option value="pausada">Pausada</option>
                    <option value="cancelada">
                      Cancelada
                    </option>
                  </select>
                </div>
              </div>

              {/* VALOR */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Valor mensal *
                </label>

                <div className="flex items-center rounded-xl border border-white/10 bg-[#0b0d10] focus-within:border-blue-500">
                  <span className="pl-4 text-sm text-gray-500">
                    R$
                  </span>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.valor}
                    onChange={(e) =>
                      setForm((estado) => ({
                        ...estado,
                        valor: formatarValorInput(
                          e.target.value
                        ),
                      }))
                    }
                    placeholder="0,00"
                    className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-gray-600"
                  />
                </div>
              </div>

              {/* DATAS */}

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Primeira cobrança *
                  </label>

                  <input
                    type="date"
                    value={form.data_primeira_cobranca}
                    onChange={(e) =>
                      setForm((estado) => ({
                        ...estado,
                        data_primeira_cobranca:
                          e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    Exemplo: início em 22/09 → primeira
                    cobrança em 22/10.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Fim da cobrança
                  </label>

                  <input
                    type="date"
                    value={form.data_fim}
                    onChange={(e) =>
                      setForm((estado) => ({
                        ...estado,
                        data_fim: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    Deixe vazio para continuar cobrando.
                  </p>
                </div>
              </div>

              {/* PREVISÃO */}

              {form.data_primeira_cobranca && (
                <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-400">
                    Próximas cobranças
                  </p>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {gerarProximasCobrancas(
                      form.data_primeira_cobranca,
                      6
                    ).map((data, index) => (
                      <div
                        key={data.toISOString()}
                        className="rounded-lg border border-white/5 bg-black/10 px-3 py-3"
                      >
                        <div className="text-[10px] uppercase text-gray-600">
                          {index === 0
                            ? "1ª cobrança"
                            : `${index + 1}ª cobrança`}
                        </div>

                       <div className="md:col-span-2 flex justify-end gap-3 border-t border-white/10 pb-2 pt-5">
                          {data.toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* OBSERVAÇÕES */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Observações
                </label>

                <textarea
                  value={form.observacoes}
                  onChange={(e) =>
                    setForm((estado) => ({
                      ...estado,
                      observacoes: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Informações adicionais..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
                />
              </div>

              {erro && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {erro}
                </div>
              )}
            </div>

            {/* RODAPÉ */}

            <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-5">
              <button
                onClick={fecharModal}
                disabled={salvando}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                onClick={salvar}
                disabled={salvando}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {salvando
                  ? "Salvando..."
                  : editando
                    ? "Salvar alterações"
                    : "Cadastrar mensalidade"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}