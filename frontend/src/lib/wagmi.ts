import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { adiTestnet, hederaTestnet, kiteAiTestnet } from "./chains";

export const config = getDefaultConfig({
  appName: "AgentMarket",
  projectId: "4e369f76c7583892f36707d593fd3a2b",
  chains: [adiTestnet, hederaTestnet, kiteAiTestnet],
  ssr: true,
});
