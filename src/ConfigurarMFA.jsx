import { useEffect, useState } from "react";

import {
  ShieldCheck,
  Smartphone,
  Loader2,
} from "lucide-react";

import { supabase } from "./lib/supabase";

export default function ConfigurarMFA({ onConcluido }) {
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [codigo, setCodigo] = useState("");

  const [carregando, setCarregando] =
    useState(true);

  const [ativando, setAtivando] =
    useState(false);

  const [erro, setErro] = useState("");

  useEffect(() => {
    async function iniciarCadastro() {
      setErro("");

      const { data, error } =
        await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: "JacobOS",
        });

      if (error) {
        console.error(
          "Erro ao cadastrar MFA:",
          error
        );

        setErro(error.message);
        setCarregando(false);
        return;
      }

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setCarregando(false);
    }

    iniciarCadastro();
  }, []);

  async function ativarMFA() {
    if (codigo.length !== 6) {
      setErro(
        "Digite o código de 6 dígitos."
      );
      return;
    }

    if (!factorId) {
      setErro(
        "O autenticador ainda não foi carregado."
      );
      return;
    }

    setAtivando(true);
    setErro("");

    const {
      data: challengeData,
      error: challengeError,
    } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError) {
      console.error(
        "Erro ao criar desafio MFA:",
        challengeError
      );

      setErro(challengeError.message);
      setAtivando(false);
      return;
    }

    const { error: verifyError } =
      await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: codigo,
      });

    if (verifyError) {
      console.error(
        "Erro ao verificar MFA:",
        verifyError
      );

      setErro(
        "Código inválido. Confira o aplicativo autenticador e tente novamente."
      );

      setAtivando(false);
      return;
    }

    setAtivando(false);

    if (onConcluido) {
      await onConcluido();
    }
  }

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080a0d] px-4 text-white">
        <div className="text-center">
          <Loader2
            className="mx-auto mb-4 animate-spin text-cyan-400"
            size={32}
          />

          <p className="text-sm text-zinc-500">
            Preparando autenticação segura...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080a0d] px-4 py-8 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.12),transparent_35%)]" />

      <div className="relative w-full max-w-lg">
        <div className="mb-6 flex justify-center">
          <div className="flex items-center gap-3">
            <img
              src="/dev.jacob.jpg"
              alt="Dev Jacob"
              className="h-10 w-10 rounded-xl object-cover"
            />

            <div>
              <p className="text-sm font-bold text-white">
                JacobOS
              </p>

              <p className="text-[11px] text-gray-500">
                Sistema de gestão
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#101318] p-6 shadow-2xl sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-500/10 p-3">
              <ShieldCheck
                className="text-cyan-400"
                size={28}
              />
            </div>

            <div>
              <h2 className="text-xl font-bold">
                Ativar autenticação em duas etapas
              </h2>

              <p className="text-sm text-zinc-400">
                Proteja sua conta do JacobOS.
              </p>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Smartphone
                size={18}
                className="text-cyan-400"
              />

              1. Escaneie o QR Code
            </div>

            {qrCode && (
              <div className="flex justify-center rounded-2xl bg-white p-4">
                <img
                  src={qrCode}
                  alt="QR Code para configurar o MFA"
                  className="h-56 w-56"
                />
              </div>
            )}
          </div>

          <div className="mb-6">
            <p className="mb-3 text-sm leading-6 text-zinc-400">
              2. Abra seu aplicativo autenticador,
              como Google Authenticator ou Microsoft
              Authenticator, e escaneie o QR Code.
            </p>

            <p className="mb-2 text-sm text-zinc-400">
              3. Digite o código de 6 dígitos mostrado
              no aplicativo.
            </p>

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
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] outline-none transition focus:border-cyan-400"
            />
          </div>

          {erro && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm leading-5 text-red-400">
              {erro}
            </div>
          )}

          <button
            type="button"
            onClick={ativarMFA}
            disabled={
              ativando ||
              codigo.length !== 6
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-4 font-bold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ativando ? (
              <>
                <Loader2
                  size={20}
                  className="animate-spin"
                />

                Verificando...
              </>
            ) : (
              <>
                <ShieldCheck size={20} />

                Ativar MFA
              </>
            )}
          </button>

          <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <p className="text-xs text-zinc-500">
              Chave manual
            </p>

            <p className="mt-1 break-all text-xs text-zinc-400">
              {secret}
            </p>
          </div>

          <p className="mt-5 text-center text-xs leading-5 text-zinc-600">
            Depois de ativar, o JacobOS solicitará
            um código do seu aplicativo autenticador
            sempre que sua conta precisar de uma
            nova verificação.
          </p>
        </div>
      </div>
    </div>
  );
}