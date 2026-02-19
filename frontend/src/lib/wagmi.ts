import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { adiTestnet, hederaTestnet, kiteAiTestnet } from "./chains";

export const config = getDefaultConfig({
  appName: "AgentMarket",
  projectId: "ethdenver2026-agentmarket",
  chains: [adiTestnet, hederaTestnet, kiteAiTestnet],
  ssr: true,
});
