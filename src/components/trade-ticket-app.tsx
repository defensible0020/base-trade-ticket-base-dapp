"use client";

import {
  ArrowLeftRight,
  CheckCheck,
  Loader2,
  ReceiptText,
  ShieldCheck,
  Ticket,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Address } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  MAX_TRADE_NOTE_LENGTH,
  MAX_TRADE_TEXT_LENGTH,
  tradeTicketAbi,
  tradeTicketContractAddress,
} from "@/lib/trade-ticket";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function shortAddress(address?: Address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function TradeTicketApp() {
  const [tradeIdInput, setTradeIdInput] = useState("1");
  const [offerText, setOfferText] = useState("1x Base launch tee");
  const [wantText, setWantText] = useState("1x event poster");
  const [note, setNote] = useState(
    "Straight swap, local meetup handoff, and clear onchain acceptance.",
  );
  const [status, setStatus] = useState(
    "Post a swap request, let one wallet respond, and mark the trade accepted on Base.",
  );
  const [walletStatus, setWalletStatus] = useState("");

  const { address, chainId, connector, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync, isPending: disconnecting } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const {
    data: hash,
    writeContract,
    isPending: writing,
    error: writeError,
  } = useWriteContract();

  const { isLoading: confirming, isSuccess: confirmed } =
    useWaitForTransactionReceipt({ hash });

  const availableConnectors = useMemo(
    () =>
      connectors
        .filter((item) => item.type !== "mock")
        .sort((a, b) => {
          const score = (item: (typeof connectors)[number]) => {
            if (item.id === "baseAccount" || item.name === "Base Account") {
              return 0;
            }
            if (item.type === "injected") return 1;
            return 2;
          };

          return score(a) - score(b);
        }),
    [connectors],
  );

  async function connectWallet() {
    const errors: string[] = [];
    setWalletStatus("Opening wallet...");

    for (const item of availableConnectors) {
      try {
        await connectAsync({ connector: item, chainId: base.id });
        setWalletStatus("");
        return;
      } catch (error) {
        errors.push(
          error instanceof Error
            ? `${item.name}: ${error.message}`
            : `${item.name}: connection failed`,
        );
      }
    }

    setWalletStatus(
      errors[0] ??
        "No wallet connector is available. Open this app inside Base App or install a wallet.",
    );
  }

  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
      setWalletStatus("Wallet disconnected. Tap Connect to reconnect.");
    } catch (error) {
      setWalletStatus(
        error instanceof Error ? error.message : "Could not disconnect wallet.",
      );
    }
  }
  const parsedTradeId = BigInt(Math.max(1, Number(tradeIdInput || "1")));

  const tradeQuery = useReadContract({
    abi: tradeTicketAbi,
    address: tradeTicketContractAddress,
    functionName: "getTrade",
    args: [parsedTradeId],
    query: {
      enabled: Boolean(tradeTicketContractAddress),
      refetchInterval: 12000,
    },
  });

  const tradeTuple = tradeQuery.data as
    | readonly [Address, Address, boolean, string, string, string]
    | undefined;

  const trade = useMemo(
    () =>
      tradeTuple
        ? {
            maker: tradeTuple[0],
            taker: tradeTuple[1],
            accepted: tradeTuple[2],
            offerText: tradeTuple[3],
            wantText: tradeTuple[4],
            note: tradeTuple[5],
          }
        : undefined,
    [tradeTuple],
  );

  const canCreate =
    Boolean(tradeTicketContractAddress) &&
    isConnected &&
    chainId === base.id &&
    offerText.trim().length > 0 &&
    offerText.trim().length <= MAX_TRADE_TEXT_LENGTH &&
    wantText.trim().length > 0 &&
    wantText.trim().length <= MAX_TRADE_TEXT_LENGTH &&
    note.trim().length <= MAX_TRADE_NOTE_LENGTH;

  const canRespond =
    Boolean(tradeTicketContractAddress) &&
    isConnected &&
    chainId === base.id &&
    Boolean(trade?.maker && trade.maker !== ZERO_ADDRESS) &&
    trade?.taker === ZERO_ADDRESS &&
    address !== trade?.maker;

  const canAccept =
    Boolean(tradeTicketContractAddress) &&
    isConnected &&
    chainId === base.id &&
    Boolean(trade?.maker && trade.maker !== ZERO_ADDRESS) &&
    Boolean(trade?.taker && trade.taker !== ZERO_ADDRESS) &&
    !trade?.accepted &&
    address === trade?.maker;

  const statusText = confirmed
    ? "Transaction confirmed on Base."
    : writeError
      ? writeError.message
      : status;

  function createTrade() {
    if (!tradeTicketContractAddress) return;

    setStatus("Confirm the trade ticket creation in your wallet.");
    writeContract({
      address: tradeTicketContractAddress,
      abi: tradeTicketAbi,
      functionName: "createTrade",
      args: [offerText.trim(), wantText.trim(), note.trim()],
      chainId: base.id,
    });
  }

  function respondToTrade() {
    if (!tradeTicketContractAddress) return;

    setStatus("Confirm your response to this trade ticket.");
    writeContract({
      address: tradeTicketContractAddress,
      abi: tradeTicketAbi,
      functionName: "respondToTrade",
      args: [parsedTradeId],
      chainId: base.id,
    });
  }

  function acceptTrade() {
    if (!tradeTicketContractAddress) return;

    setStatus("Confirm the acceptance of this trade ticket.");
    writeContract({
      address: tradeTicketContractAddress,
      abi: tradeTicketAbi,
      functionName: "acceptTrade",
      args: [parsedTradeId],
      chainId: base.id,
    });
  }

  return (
    <main className="min-h-screen bg-[#f4efe8] text-[#241b14]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between border-b border-[#241b14]/15 pb-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-[16px] border border-[#241b14] bg-[#f2d0aa] shadow-[0_10px_30px_rgba(116,79,39,0.14)]">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8f5b2a]">
                Base Trade Ticket
              </p>
              <h1 className="text-xl font-black sm:text-2xl">
                Post one swap. Match one responder.
              </h1>
            </div>
          </div>

          {isConnected ? (
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[#241b14]/15 bg-white px-3 py-2 text-sm font-semibold">
                {shortAddress(address)}
              </span>
              <button
                className="rounded-full border border-[#241b14] bg-[#241b14] px-4 py-2 text-sm font-semibold text-white"
                onClick={disconnectWallet}
              >{disconnecting ? "Disconnecting" : "Disconnect"}</button>
            </div>
          ) : (
            <button
              className="inline-flex items-center gap-2 rounded-full border border-[#241b14] bg-[#241b14] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              disabled={availableConnectors.length === 0 || connecting}
              onClick={connectWallet}
            >
              {connecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              Connect
            </button>
          )}
        {walletStatus ? (
            <p className="w-full text-right text-xs font-semibold opacity-75">
              {walletStatus}
            </p>
          ) : null}
        </header>

        <div className="grid flex-1 gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-[30px] border border-[#241b14] bg-[linear-gradient(180deg,#fffdf9_0%,#eadcc8_100%)] p-5 shadow-[0_22px_60px_rgba(68,44,22,0.10)]">
            <div className="max-w-3xl">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#241b14] bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.18em]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Onchain trade matching
              </p>
              <h2 className="text-4xl font-black leading-tight sm:text-6xl">
                A trade receipt board built for simple swaps on Base.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#6f5642] sm:text-lg">
                Post what you offer, say what you want back, let one wallet
                respond, and accept the match with a clear onchain record.
              </p>
            </div>

            <div className="mt-8 rounded-[30px] border border-[#241b14] bg-[#241b14] p-5 text-white">
              <div className="flex items-start justify-between gap-4 border-b border-white/15 pb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e8c39c]">
                    Trade ticket
                  </p>
                  <h3 className="mt-2 text-3xl font-black">
                    {trade?.offerText || "1x Base launch tee"}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#f1dcc4]">
                    Wants: {trade?.wantText || "1x event poster"}
                  </p>
                </div>
                <div className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold">
                  {trade?.accepted ? "Accepted" : "Open ticket"}
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[22px] border border-white/15 bg-white/10 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e8c39c]">
                    Maker
                  </p>
                  <p className="mt-3 text-lg font-black">
                    {trade?.maker && trade.maker !== ZERO_ADDRESS
                      ? shortAddress(trade.maker)
                      : "--"}
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/15 bg-white/10 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e8c39c]">
                    Responder
                  </p>
                  <p className="mt-3 text-lg font-black">
                    {trade?.taker && trade.taker !== ZERO_ADDRESS
                      ? shortAddress(trade.taker)
                      : "No responder"}
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/15 bg-white/10 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e8c39c]">
                    State
                  </p>
                  <p className="mt-3 text-lg font-black">
                    {trade?.accepted ? "Matched" : trade?.taker !== ZERO_ADDRESS ? "Waiting on maker" : "Seeking match"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-[#241b14] bg-white/80 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8f5b2a]">
                  Step 1
                </p>
                <p className="mt-2 text-lg font-semibold">Post offer</p>
              </div>
              <div className="rounded-[24px] border border-[#241b14] bg-white/80 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8f5b2a]">
                  Step 2
                </p>
                <p className="mt-2 text-lg font-semibold">Respond once</p>
              </div>
              <div className="rounded-[24px] border border-[#241b14] bg-white/80 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8f5b2a]">
                  Step 3
                </p>
                <p className="mt-2 text-lg font-semibold">Accept match</p>
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-4">
            <section className="rounded-[30px] border border-[#241b14] bg-white p-5 shadow-[0_22px_60px_rgba(68,44,22,0.10)]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#f3e4d3]">
                  <Ticket className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">Create ticket</h3>
                  <p className="text-sm text-[#6f5642]">
                    Post one simple trade request.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-[#8f5b2a]">
                    You offer
                  </span>
                  <input
                    className="rounded-2xl border border-[#241b14]/15 bg-[#fffaf4] px-4 py-3 outline-none"
                    maxLength={MAX_TRADE_TEXT_LENGTH}
                    value={offerText}
                    onChange={(event) => setOfferText(event.target.value)}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-[#8f5b2a]">
                    You want
                  </span>
                  <input
                    className="rounded-2xl border border-[#241b14]/15 bg-[#fffaf4] px-4 py-3 outline-none"
                    maxLength={MAX_TRADE_TEXT_LENGTH}
                    value={wantText}
                    onChange={(event) => setWantText(event.target.value)}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-[#8f5b2a]">
                    Note
                  </span>
                  <textarea
                    className="min-h-24 rounded-2xl border border-[#241b14]/15 bg-[#fffaf4] px-4 py-3 outline-none"
                    maxLength={MAX_TRADE_NOTE_LENGTH}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </label>
              </div>

              {chainId !== base.id && isConnected ? (
                <button
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#241b14] px-4 py-3 font-semibold text-white disabled:opacity-60"
                  disabled={switching}
                  onClick={() => switchChain({ chainId: base.id })}
                >
                  {switching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wallet className="h-4 w-4" />
                  )}
                  Switch to Base
                </button>
              ) : (
                <button
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#241b14] px-4 py-3 font-semibold text-white disabled:opacity-50"
                  disabled={!canCreate || writing || confirming}
                  onClick={createTrade}
                >
                  {writing || confirming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ReceiptText className="h-4 w-4" />
                  )}
                  Create on Base
                </button>
              )}
            </section>

            <section className="rounded-[30px] border border-[#241b14] bg-white p-5 shadow-[0_22px_60px_rgba(68,44,22,0.10)]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#f3e4d3]">
                  <ArrowLeftRight className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">Match panel</h3>
                  <p className="text-sm text-[#6f5642]">
                    Load a ticket and respond or accept.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-[#8f5b2a]">
                    Trade ID
                  </span>
                  <input
                    className="rounded-2xl border border-[#241b14]/15 bg-[#fffaf4] px-4 py-3 outline-none"
                    value={tradeIdInput}
                    onChange={(event) => setTradeIdInput(event.target.value)}
                  />
                </label>
              </div>

              <button
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#d7b18a] px-4 py-3 font-semibold text-[#241b14] disabled:opacity-50"
                disabled={!canRespond || writing || confirming}
                onClick={respondToTrade}
              >
                {writing || confirming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowLeftRight className="h-4 w-4" />
                )}
                Respond to trade
              </button>

              <button
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#241b14]/20 bg-[#fffaf4] px-4 py-3 font-semibold text-[#241b14] disabled:opacity-50"
                disabled={!canAccept || writing || confirming}
                onClick={acceptTrade}
              >
                {writing || confirming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}
                Accept match
              </button>
            </section>

            <section className="rounded-[30px] border border-[#241b14] bg-[#241b14] p-5 text-white shadow-[0_22px_60px_rgba(68,44,22,0.10)]">
              <h3 className="text-2xl font-black">Receipt feed</h3>
              <p className="mt-4 min-h-16 text-sm leading-6 text-[#f1dcc4]">
                {statusText}
              </p>

              {!tradeTicketContractAddress ? (
                <p className="rounded-[18px] border border-white/15 bg-white/10 p-3 text-xs leading-6 text-[#f1dcc4]">
                  Add `NEXT_PUBLIC_TRADE_TICKET_CONTRACT_ADDRESS` after
                  deploying the trade ticket contract, then redeploy Vercel.
                </p>
              ) : null}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
