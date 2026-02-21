Think of it like Netflix vs buying a DVD.

Without authorizeUsage (traditional NFT):
  - You build an amazing AI agent (say a DeFi strategist that makes great trades)                                                                                                                               
  - Someone wants to use your agent                        
  - Only option: you sell them the NFT → you lose the agent entirely                                         
  - You made money once, but now you can't use your own agent                                                                                                                                                   

With authorizeUsage (ERC-7857 iNFT):
- You build the same amazing DeFi strategist agent                                                                                                                                                            
- Someone wants to use it                                                                                                                                                                                     
- You call authorizeUsage(tokenId, theirAddress) → they can now hire your agent                                                                                                                               
- You still own it. They get temporary access to its intelligence                                                                                                                                             
- You can authorize 10, 100, 1000 users → recurring revenue from one agent
- You can revoke access anytime

Why encryption matters here:
The agent's brain (model config, system prompt, strategies) is encrypted on 0G Storage. The encryption key is sealed for YOUR public key. When you authorizeUsage, the TEE oracle re-encrypts a scoped access
key for the hirer — they can run the agent but can't extract its secrets or copy it.

Real world flow:
1. You mint iNFT → agent intelligence encrypted → stored at 0g://storage/enc/agent-1-defi-strategist
2. A user pays you 5 HBAR to use your agent
3. You call authorizeUsage(tokenId=1, userAddress=0xBuyer...) → on-chain tx
4. The TEE oracle gives the buyer a scoped decryption key
5. Buyer can now send tasks to your agent and get results
6. You still own the iNFT, you still control access

It's basically agent-as-a-service on-chain — own once, rent forever.
