import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

export default function BuscaCliente({
  clientes,
  value,
  onChange,
  label = "Cliente *",
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    function fechar(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", fechar);

    return () => {
      document.removeEventListener("mousedown", fechar);
    };
  }, []);

  const clienteSelecionado = clientes.find(
    (cliente) => cliente.id === value
  );

  const clientesFiltrados = clientes.filter((cliente) =>
    cliente.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <label className="mb-2 block text-sm font-medium text-gray-300">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setAberto((estado) => !estado)}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-left text-sm text-white outline-none transition hover:border-white/20 focus:border-blue-500"
      >
        <span
          className={
            clienteSelecionado ? "text-white" : "text-gray-500"
          }
        >
          {clienteSelecionado?.nome || "Pesquisar cliente..."}
        </span>

        <ChevronDown
          size={17}
          className="shrink-0 text-gray-500"
        />
      </button>

      {aberto && (
        <div className="absolute left-0 right-0 top-full z-[80] mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#15181e] shadow-2xl">
          <div className="flex items-center gap-2 border-b border-white/10 p-3">
            <Search size={16} className="shrink-0 text-gray-500" />

            <input
              autoFocus
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar cliente..."
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
            {clientesFiltrados.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-500">
                Nenhum cliente encontrado.
              </div>
            ) : (
              clientesFiltrados.map((cliente) => {
                const selecionado = cliente.id === value;

                return (
                  <button
                    key={cliente.id}
                    type="button"
                    onClick={() => {
                      onChange(cliente.id);
                      setBusca("");
                      setAberto(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm transition hover:bg-white/5"
                  >
                    <span className="truncate text-gray-200">
                      {cliente.nome}
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