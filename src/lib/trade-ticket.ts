import type { Address } from "viem";

export const MAX_TRADE_TEXT_LENGTH = 60;
export const MAX_TRADE_NOTE_LENGTH = 120;

export const tradeTicketAbi = [
  {
    type: "function",
    name: "createTrade",
    stateMutability: "nonpayable",
    inputs: [
      { name: "offerText", type: "string" },
      { name: "wantText", type: "string" },
      { name: "note", type: "string" },
    ],
    outputs: [{ name: "tradeId", type: "uint256" }],
  },
  {
    type: "function",
    name: "respondToTrade",
    stateMutability: "nonpayable",
    inputs: [{ name: "tradeId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "acceptTrade",
    stateMutability: "nonpayable",
    inputs: [{ name: "tradeId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getTrade",
    stateMutability: "view",
    inputs: [{ name: "tradeId", type: "uint256" }],
    outputs: [
      { name: "maker", type: "address" },
      { name: "taker", type: "address" },
      { name: "accepted", type: "bool" },
      { name: "offerText", type: "string" },
      { name: "wantText", type: "string" },
      { name: "note", type: "string" },
    ],
  },
] as const;

export type TradeTicketData = {
  maker: Address;
  taker: Address;
  accepted: boolean;
  offerText: string;
  wantText: string;
  note: string;
};

export const tradeTicketContractAddress = process.env
  .NEXT_PUBLIC_TRADE_TICKET_CONTRACT_ADDRESS as Address | undefined;
