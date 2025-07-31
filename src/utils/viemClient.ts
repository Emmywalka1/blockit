import { createPublicClient, http, Block } from "viem";
import { base } from "viem/chains";

const client = createPublicClient({
  chain: base,
  transport: http("https://base-mainnet.g.alchemy.com/v2/8z1xwjFnWSKEAenTEKZIn"),
});

const block: Block = await client.getBlock({
  blockNumber: 123456n,
});

console.log(block);
