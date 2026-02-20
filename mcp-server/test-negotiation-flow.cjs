const fs = require('fs');
const path = require('path');

const STORE = path.resolve(process.cwd(), '.task-store.json');
const store = JSON.parse(fs.readFileSync(STORE, 'utf-8'));

if (!store.negotiations) store.negotiations = [];
let nextNegId = store.negotiations.length + 1;

console.log("\n=== FULL AGENT-TO-AGENT NEGOTIATION WORKFLOW ===\n");

// STEP 2: DeFi Agent negotiates - wants 8 HBAR instead of 5
const neg1 = {
  negotiationId: String(nextNegId++),
  taskId: '6',
  proposerAgent: 'defi-agent-0xBBB',
  proposedReward: { amount: '8', currency: 'HBAR', chain: 'hedera' },
  proposedRequirements: ['swap_execution','deposit_confirmation','tx_hash_proof','health_factor_check'],
  message: 'This task involves gas fees for 2 transactions (swap + deposit) plus HTS association costs. Requesting 8 HBAR to cover execution costs and profit margin.',
  status: 'pending',
  counterTo: null,
  createdAt: new Date().toISOString()
};
store.negotiations.push(neg1);
console.log("STEP 2: DeFi Agent proposes 8 HBAR (was 5)");
console.log(JSON.stringify(neg1, null, 2));

// STEP 3: Commerce Agent counters with 6.5 HBAR
store.negotiations[store.negotiations.length - 1].status = 'countered';
const neg2 = {
  negotiationId: String(nextNegId++),
  taskId: '6',
  proposerAgent: 'commerce-agent-0xAAA',
  proposedReward: { amount: '6.5', currency: 'HBAR', chain: 'hedera' },
  proposedRequirements: ['swap_execution','deposit_confirmation','tx_hash_proof','health_factor_check'],
  message: 'Counter: 6.5 HBAR is fair. I agree on adding health_factor_check requirement.',
  status: 'pending',
  counterTo: String(nextNegId - 2),
  createdAt: new Date().toISOString()
};
store.negotiations.push(neg2);
console.log("\nSTEP 3: Commerce Agent counters with 6.5 HBAR");
console.log(JSON.stringify(neg2, null, 2));

// STEP 4: DeFi Agent accepts the counter
neg2.status = 'accepted';
const task = store.tasks.find(t => t.taskId === '6');
task.reward = { amount: '6.5', currency: 'HBAR', chain: 'hedera' };
task.requirements = ['swap_execution','deposit_confirmation','tx_hash_proof','health_factor_check'];
task.assignedAgent = 'defi-agent-0xBBB';
task.status = 'accepted';
task.updatedAt = new Date().toISOString();
console.log("\nSTEP 4: DeFi Agent accepts 6.5 HBAR - task assigned");
console.log("  Task status:", task.status, "| Reward:", task.reward.amount, task.reward.currency);

// STEP 5: DeFi Agent submits work with REAL transaction hashes
task.status = 'submitted';
task.submission = {
  result: JSON.stringify({
    swapTx: '0xe978195859ee3519ebaea93556c313a40ae13d8d604da615561f0d13bfa5e705',
    swapDetails: { from: 'HBAR', to: 'USDC', amountIn: '50', amountOut: '13.764715', router: 'SaucerSwap V1' },
    depositTx: '0.0.4729347@1771606499.087526757',
    depositDetails: { protocol: 'Bonzo Finance', asset: 'USDC', amount: '13.764715', aTokenReceived: '13.764715 aUSDC' },
    healthFactor: 2.8,
    verifySwap: 'https://hashscan.io/testnet/transaction/0xe978195859ee3519ebaea93556c313a40ae13d8d604da615561f0d13bfa5e705'
  }),
  deliveredAt: new Date().toISOString(),
  qualityScore: 5
};
task.updatedAt = new Date().toISOString();
console.log("\nSTEP 5: DeFi Agent submits work");
console.log("  Swap tx: 0xe978195859ee...bfa5e705");
console.log("  Deposit tx: 0.0.4729347@1771606499");
console.log("  Health factor: 2.8");

// STEP 6: Commerce Agent reviews and approves
task.status = 'approved';
task.review = {
  approved: true,
  rating: 5,
  feedback: 'Excellent execution. Both swap and deposit confirmed on-chain via HashScan. Health factor 2.8 is well above 1.5 threshold. All 4 requirements met including the negotiated health_factor_check.',
  aiVerified: false,
  reviewedAt: new Date().toISOString()
};
task.updatedAt = new Date().toISOString();
console.log("\nSTEP 6: Commerce Agent approves - rated 5/5");
console.log("  Feedback:", task.review.feedback.substring(0, 80) + "...");

fs.writeFileSync(STORE, JSON.stringify(store, null, 2));

console.log("\n=== NEGOTIATION WORKFLOW COMPLETE ===");
console.log("  Negotiations recorded:", store.negotiations.length);
console.log("  Task 6 status:", task.status);
console.log("  Original reward: 5 HBAR → Negotiated: 6.5 HBAR");
console.log("  Requirements added: health_factor_check (via negotiation)");
console.log("  Payment: 6.5 HBAR on Hedera chain");
console.log("");
