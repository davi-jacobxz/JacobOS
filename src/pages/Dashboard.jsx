import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarClock,
  CircleDollarSign,
  Clock3,
  FolderKanban,
  TrendingUp,
  Users,
} from "lucide-react";
import { supabase } from "../lib/supabase";

function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dataBR(valor) {
  if (!valor) return "—";

  return new Date(`${valor}T00:00:00`).toLocaleDateString("pt-BR");
}


export default function Dashboard() {
  const [clientes, setClientes] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [cobrancas, setCobrancas] = useState([]);

  const [carregando, setCarregando] = useState(true);

 const hoje = useMemo(() => new Date(), []);
const anoAtual = hoje.getFullYear();
const mesAtual = hoje.getMonth() + 1;

  async function carregarDashboard() {
    setCarregando(true);

    const [
      clientesResponse,
      projetosResponse,
      movimentacoesResponse,
      cobrancasResponse,
    ] = await Promise.all([
      supabase
        .from("clientes")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("projetos")
        .select(`
          *,
          cliente:clientes (
            id,
            nome
          )
        `)
        .order("created_at", { ascending: false }),

      supabase
        .from("movimentacoes")
        .select(`
          *,
          cliente:clientes (
            id,
            nome
          ),
          projeto:projetos (
            id,
            nome
          )
        `)
        .order("data_lancamento", { ascending: false }),

      supabase
        .from("cobrancas_mensais")
        .select(`
          *,
          mensalidade:mensalidades (
            id,
            descricao,
            cliente_id,
            cliente:clientes (
              id,
              nome
            )
          )
        `)
        .order("data_vencimento", { ascending: true }),
    ]);

    if (!clientesResponse.error) {
      setClientes(clientesResponse.data || []);
    }

    if (!projetosResponse.error) {
      setProjetos(projetosResponse.data || []);
    }

    if (!movimentacoesResponse.error) {
      setMovimentacoes(movimentacoesResponse.data || []);
    }

    if (!cobrancasResponse.error) {
      setCobrancas(cobrancasResponse.data || []);
    }

    setCarregando(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarDashboard();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const movimentacoesMes = useMemo(() => {
    return movimentacoes.filter((item) => {
      if (!item.data_lancamento) return false;

      const data = new Date(`${item.data_lancamento}T00:00:00`);

      return (
        data.getFullYear() === anoAtual &&
        data.getMonth() + 1 === mesAtual
      );
    });
  }, [movimentacoes, anoAtual, mesAtual]);

  const entradasProjetos = useMemo(() => {
    return movimentacoesMes
      .filter(
        (item) =>
          item.tipo === "entrada" &&
          item.status === "pago"
      )
      .reduce((total, item) => total + Number(item.valor || 0), 0);
  }, [movimentacoesMes]);

  const despesas = useMemo(() => {
    return movimentacoesMes
      .filter(
        (item) =>
          item.tipo === "saida" &&
          item.status === "pago"
      )
      .reduce((total, item) => total + Number(item.valor || 0), 0);
  }, [movimentacoesMes]);

  const cobrancasPagasMes = useMemo(() => {
    return cobrancas
      .filter((item) => {
        if (item.status !== "pago") return false;

        const data = item.data_pagamento
          ? new Date(item.data_pagamento)
          : new Date(`${item.data_vencimento}T00:00:00`);

        return (
          data.getFullYear() === anoAtual &&
          data.getMonth() + 1 === mesAtual
        );
      })
      .reduce((total, item) => total + Number(item.valor || 0), 0);
  }, [cobrancas, anoAtual, mesAtual]);

  const receitaTotal = entradasProjetos + cobrancasPagasMes;

  const lucro = receitaTotal - despesas;

  const aReceber = useMemo(() => {
    const financeiro = movimentacoes
      .filter(
        (item) =>
          item.tipo === "entrada" &&
          item.status === "pendente"
      )
      .reduce((total, item) => total + Number(item.valor || 0), 0);

    const mensalidades = cobrancas
      .filter((item) => item.status === "pendente")
      .reduce((total, item) => total + Number(item.valor || 0), 0);

    return financeiro + mensalidades;
  }, [movimentacoes, cobrancas]);

  const emAtraso = useMemo(() => {
    const hojeString = hoje.toISOString().slice(0, 10);

    const financeiro = movimentacoes
      .filter(
        (item) =>
          item.tipo === "entrada" &&
          item.status === "pendente" &&
          item.data_vencimento &&
          item.data_vencimento < hojeString
      )
      .reduce((total, item) => total + Number(item.valor || 0), 0);

    const mensalidades = cobrancas
      .filter(
        (item) =>
          item.status === "pendente" &&
          item.data_vencimento &&
          item.data_vencimento < hojeString
      )
      .reduce((total, item) => total + Number(item.valor || 0), 0);

    return financeiro + mensalidades;
  }, [movimentacoes, cobrancas, hoje]);

  const clientesAtivos = clientes.filter(
    (cliente) => cliente.status === "ativo"
  ).length;

  const projetosAtivos = projetos.filter(
    (projeto) =>
      projeto.status === "em_andamento" ||
      projeto.status === "planejamento"
  ).length;

  const proximasCobrancas = useMemo(() => {
    const hojeString = hoje.toISOString().slice(0, 10);

    return cobrancas
      .filter(
        (item) =>
          item.status === "pendente" &&
          item.data_vencimento >= hojeString
      )
      .slice(0, 5);
  }, [cobrancas, hoje]);

  const ultimasMovimentacoes = movimentacoes.slice(0, 6);

  const meses = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const data = new Date(
        anoAtual,
        mesAtual - 1 - (5 - index),
        1
      );

      return {
        chave: `${data.getFullYear()}-${String(
          data.getMonth() + 1
        ).padStart(2, "0")}`,
        nome: data.toLocaleDateString("pt-BR", {
          month: "short",
        }),
        ano: data.getFullYear(),
        mes: data.getMonth() + 1,
      };
    });
  }, [anoAtual, mesAtual]);

  const fluxoMensal = useMemo(() => {
    return meses.map((mes) => {
      const projetosMes = movimentacoes
        .filter((item) => {
          if (
            item.tipo !== "entrada" ||
            item.status !== "pago" ||
            !item.data_lancamento
          ) {
            return false;
          }

          const data = new Date(
            `${item.data_lancamento}T00:00:00`
          );

          return (
            data.getFullYear() === mes.ano &&
            data.getMonth() + 1 === mes.mes
          );
        })
        .reduce(
          (total, item) => total + Number(item.valor || 0),
          0
        );

      const recorrenteMes = cobrancas
        .filter((item) => {
          if (
            item.status !== "pago" ||
            !item.data_vencimento
          ) {
            return false;
          }

          const data = new Date(
            `${item.data_vencimento}T00:00:00`
          );

          return (
            data.getFullYear() === mes.ano &&
            data.getMonth() + 1 === mes.mes
          );
        })
        .reduce(
          (total, item) => total + Number(item.valor || 0),
          0
        );

      const despesasMes = movimentacoes
        .filter((item) => {
          if (
            item.tipo !== "saida" ||
            item.status !== "pago" ||
            !item.data_lancamento
          ) {
            return false;
          }

          const data = new Date(
            `${item.data_lancamento}T00:00:00`
          );

          return (
            data.getFullYear() === mes.ano &&
            data.getMonth() + 1 === mes.mes
          );
        })
        .reduce(
          (total, item) => total + Number(item.valor || 0),
          0
        );

      return {
        ...mes,
        projetos: projetosMes,
        recorrente: recorrenteMes,
        despesas: despesasMes,
      };
    });
  }, [meses, movimentacoes, cobrancas]);

  if (carregando) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-sm text-gray-500">
          Carregando dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <p className="text-sm text-gray-500">
          Visão geral do negócio
        </p>

        <h1 className="mt-1 text-2xl font-bold text-white">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          {new Date().toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#111318] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Receita de projetos
              </p>

              <p className="mt-2 text-2xl font-bold text-white">
                {moeda(entradasProjetos)}
              </p>
            </div>

            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
              <BriefcaseBusiness size={21} />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
            <ArrowUpRight size={14} />
            pagamentos de projetos
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111318] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Receita recorrente
              </p>

              <p className="mt-2 text-2xl font-bold text-white">
                {moeda(cobrancasPagasMes)}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
              <CircleDollarSign size={21} />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
            <TrendingUp size={14} />
            mensalidades pagas
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111318] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Despesas
              </p>

              <p className="mt-2 text-2xl font-bold text-white">
                {moeda(despesas)}
              </p>
            </div>

            <div className="rounded-xl bg-red-500/10 p-3 text-red-400">
              <ArrowDownRight size={21} />
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            despesas pagas no mês
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111318] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Lucro
              </p>

              <p className="mt-2 text-2xl font-bold text-white">
                {moeda(lucro)}
              </p>
            </div>

            <div className="rounded-xl bg-violet-500/10 p-3 text-violet-400">
              <TrendingUp size={21} />
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            receitas menos despesas
          </div>
        </div>
      </div>

      {/* RESUMO */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#111318] p-5">
          <div className="flex items-center gap-3">
            <Users className="text-blue-400" size={20} />
            <div>
              <p className="text-xs text-gray-500">
                Clientes ativos
              </p>
              <p className="text-xl font-bold text-white">
                {clientesAtivos}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111318] p-5">
          <div className="flex items-center gap-3">
            <FolderKanban className="text-emerald-400" size={20} />
            <div>
              <p className="text-xs text-gray-500">
                Projetos ativos
              </p>
              <p className="text-xl font-bold text-white">
                {projetosAtivos}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111318] p-5">
          <div className="flex items-center gap-3">
            <Clock3 className="text-yellow-400" size={20} />
            <div>
              <p className="text-xs text-gray-500">
                A receber
              </p>
              <p className="text-xl font-bold text-white">
                {moeda(aReceber)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111318] p-5">
          <div className="flex items-center gap-3">
            <CalendarClock className="text-red-400" size={20} />
            <div>
              <p className="text-xs text-gray-500">
                Em atraso
              </p>
              <p className="text-xl font-bold text-white">
                {moeda(emAtraso)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FLUXO */}
      <div className="rounded-2xl border border-white/10 bg-[#111318] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">
              Fluxo financeiro
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Últimos 6 meses
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {fluxoMensal.map((mes) => {
            const maior = Math.max(
              mes.projetos,
              mes.recorrente,
              mes.despesas,
              1
            );

            return (
              <div key={mes.chave}>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="capitalize text-gray-400">
                    {mes.nome}
                  </span>

                  <span className="text-gray-500">
                    {moeda(
                      mes.projetos +
                        mes.recorrente -
                        mes.despesas
                    )}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-[10px] text-gray-600">
                      Projetos
                    </span>

                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{
                          width: `${Math.min(
                            (mes.projetos / maior) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-20 text-[10px] text-gray-600">
                      Recorrente
                    </span>

                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{
                          width: `${Math.min(
                            (mes.recorrente / maior) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-20 text-[10px] text-gray-600">
                      Despesas
                    </span>

                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-red-500"
                        style={{
                          width: `${Math.min(
                            (mes.despesas / maior) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PARTE INFERIOR */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* PRÓXIMAS COBRANÇAS */}
        <div className="rounded-2xl border border-white/10 bg-[#111318] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">
                Próximas cobranças
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Mensalidades pendentes
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {proximasCobrancas.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-600">
                Nenhuma cobrança pendente.
              </p>
            ) : (
              proximasCobrancas.map((cobranca) => (
                <div
                  key={cobranca.id}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {cobranca.mensalidade?.cliente?.nome ||
                        "Cliente"}
                    </p>

                    <p className="mt-1 truncate text-xs text-gray-500">
                      {cobranca.mensalidade?.descricao ||
                        "Mensalidade"}
                    </p>
                  </div>

                  <div className="ml-4 text-right">
                    <p className="text-sm font-semibold text-white">
                      {moeda(cobranca.valor)}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {dataBR(cobranca.data_vencimento)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ÚLTIMAS MOVIMENTAÇÕES */}
        <div className="rounded-2xl border border-white/10 bg-[#111318] p-6">
          <div>
            <h2 className="font-semibold text-white">
              Últimas movimentações
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Registros financeiros recentes
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {ultimasMovimentacoes.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-600">
                Nenhuma movimentação registrada.
              </p>
            ) : (
              ultimasMovimentacoes.map((item) => {
                const entrada = item.tipo === "entrada";

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {item.descricao}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {dataBR(item.data_lancamento)}
                      </p>
                    </div>

                    <div className="ml-4 text-right">
                      <p
                        className={`text-sm font-semibold ${
                          entrada
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {entrada ? "+" : "-"}
                        {moeda(item.valor)}
                      </p>

                      <p className="mt-1 text-xs text-gray-600">
                        {item.status}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}