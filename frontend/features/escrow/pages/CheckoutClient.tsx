"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchCheckoutSession } from "../api/payments.api";
import { formatMoney } from "../utils/formatMoney";

declare global {
  interface Window {
    fawaterkCheckout: (config: FawaterkPluginConfig) => void;
  }
}

interface FawaterkPluginConfig {
  envType: "test" | "live";
  hashKey: string;
  style?: { listing?: "vertical" | "horizontal" };
  version?: string | number;
  requestBody: {
    cartTotal: string;
    currency: string;
    customer: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      address: string;
    };
    redirectionUrls: {
      successUrl: string;
      failUrl: string;
      pendingUrl: string;
    };
    cartItems: Array<{ name: string; price: string; quantity: string }>;
    payLoad?: Record<string, unknown>;
  };
}

type Status = "loading" | "ready" | "error";

const PLUGIN_SCRIPT =
  "https://app.fawaterk.com/fawaterkPlugin/fawaterkPlugin.min.js";

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = Number(searchParams.get("projectId"));
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    if (!projectId || Number.isNaN(projectId)) {
      setErrorMsg("Invalid project");
      setStatus("error");
      return;
    }

    let cancelled = false;

    async function boot() {
      try {
        const session = await fetchCheckoutSession(projectId);
        if (cancelled) return;

        setTitle(session.projectTitle);
        setAmount(session.amount);

        await loadScript(PLUGIN_SCRIPT);
        if (cancelled) return;

        const pluginConfig: FawaterkPluginConfig = {
          envType: session.envType,
          hashKey: session.hashKey,
          style: { listing: "vertical" },
          version: "0",
          requestBody: session.pluginRequest,
        };

        setStatus("ready");

        requestAnimationFrame(() => {
          if (typeof window.fawaterkCheckout === "function") {
            window.fawaterkCheckout(pluginConfig);
          } else {
            throw new Error("Fawaterak checkout plugin failed to load");
          }
        });
      } catch (err) {
        if (!cancelled) {
          const e = err as { response?: { data?: { message?: string } }; message?: string };
          setErrorMsg(
            e?.response?.data?.message ?? e?.message ?? "Failed to load payment",
          );
          setStatus("error");
        }
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-navy-950 via-navy-900 to-slate-950">
      <div className="w-full max-w-lg rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/80 dark:border-slate-700">
        <div className="flex items-center justify-between px-5 py-4 bg-navy-950 text-white">
          <Link href="/escrow" className="text-sm font-bold tracking-widest text-electric-400">
            CLINKA
          </Link>
          <div className="text-end">
            <p className="text-[10px] uppercase tracking-wider text-white/50">
              Secure checkout
            </p>
            {amount > 0 && (
              <p className="text-lg font-bold">{formatMoney(amount)}</p>
            )}
          </div>
        </div>

        {title && (
          <p className="px-5 py-3 text-sm text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
            {title}
          </p>
        )}

        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 py-16 px-6">
            <div className="h-10 w-10 rounded-full border-2 border-electric-500 border-t-transparent animate-spin" />
            <p className="text-sm text-slate-500">Loading Fawaterak payment…</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
            <p className="text-base font-semibold text-slate-900 dark:text-white">
              Payment unavailable
            </p>
            <p className="text-sm text-slate-500">{errorMsg}</p>
            <button
              type="button"
              onClick={() => router.push("/escrow")}
              className="mt-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Back to escrow
            </button>
          </div>
        )}

        <div
          id="fawaterkDivId"
          className={status === "ready" ? "min-h-[280px] p-2" : "hidden"}
        />

        <div className="px-5 py-3 text-center text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800">
          Payments secured by Fawaterak
        </div>
      </div>
    </div>
  );
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Script failed to load: ${src}`));
    document.head.appendChild(s);
  });
}
