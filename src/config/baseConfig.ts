
export interface TokenConfig {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
  coingeckoId?: string;
}

export interface SpenderConfig {
  address: `0x${string}`;
  name: string;
  protocol: string;
  risk: 'low' | 'medium' | 'high';
  category: 'dex' | 'lending' | 'bridge' | 'aggregator' | 'farming' | 'other';
  website?: string;
}

// EXPANDED Base Network Tokens (real verified contracts)
export const BASE_TOKENS: TokenConfig[] = [
  // Stablecoins
  {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    coingeckoId: 'usd-coin'
  },
  {
    address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
    symbol: 'USDbC',
    name: 'USD Base Coin',
    decimals: 6,
    coingeckoId: 'bridged-usdc-base'
  },
  {
    address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    coingeckoId: 'dai'
  },

  // Major Assets
  {
    address: '0x4200000000000000000000000000000000000006',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    coingeckoId: 'weth'
  },
  {
    address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
    symbol: 'cbETH',
    name: 'Coinbase Wrapped Staked ETH',
    decimals: 18,
    coingeckoId: 'coinbase-wrapped-staked-eth'
  },
  {
    address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
    symbol: 'cbBTC',
    name: 'Coinbase Wrapped BTC',
    decimals: 8,
    coingeckoId: 'coinbase-wrapped-btc'
  },

  // DeFi Tokens
  {
    address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
    symbol: 'AERO',
    name: 'Aerodrome Finance',
    decimals: 18,
    coingeckoId: 'aerodrome-finance'
  },
  {
    address: '0xA88594D404727625A9437C3f886C7643872296AE',
    symbol: 'WELL',
    name: 'Moonwell',
    decimals: 18,
    coingeckoId: 'moonwell'
  },
  {
    address: '0x78a087d713Be963Bf307b18F2Ff8122EF9A63ae9',
    symbol: 'BSWAP',
    name: 'BaseSwap Token',
    decimals: 18,
    coingeckoId: 'baseswap'
  },
  {
    address: '0x4621b7A9c75199271F773Ebd9A499dbd165c3191',
    symbol: 'DOLA',
    name: 'Dola USD Stablecoin',
    decimals: 18,
    coingeckoId: 'dola-usd'
  },

  // Popular Meme/Community Tokens
  {
    address: '0x4ed4E862860beD51a9570B96d89aF5E1B0Efefed',
    symbol: 'DEGEN',
    name: 'Degen',
    decimals: 18,
    coingeckoId: 'degen-base'
  },
  {
    address: '0x532f27101965dd16442E59d40670FaF5eBb142E4',
    symbol: 'BRETT',
    name: 'Brett',
    decimals: 18,
    coingeckoId: 'brett'
  },
  {
    address: '0x0578d8A44db98B23BF096A382e016e29a5Ce0ffe',
    symbol: 'HIGHER',
    name: 'Higher',
    decimals: 18,
    coingeckoId: 'higher'
  },
  {
    address: '0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4',
    symbol: 'TOSHI',
    name: 'Toshi',
    decimals: 18,
    coingeckoId: 'toshi-base'
  },

  // Gaming & NFT
  {
    address: '0xfA980cEd6895AC314E7dE34Ef1bFAE90a5AdD21b',
    symbol: 'PRIME',
    name: 'Echelon Prime',
    decimals: 18,
    coingeckoId: 'echelon-prime'
  },
  {
    address: '0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b',
    symbol: 'tBTC',
    name: 'Threshold BTC',
    decimals: 18,
    coingeckoId: 'tbtc'
  },

  // Additional Popular Tokens
  {
    address: '0x1C7a460413dD4e964f96D8dFC56CF7B4d9C42e02',
    symbol: 'SEAM',
    name: 'Seamless',
    decimals: 18,
    coingeckoId: 'seamless-protocol'
  },
  {
    address: '0x417Ac0e078398C154EdFadD9Ef675d30Be60Af93',
    symbol: 'COMP',
    name: 'Compound',
    decimals: 18,
    coingeckoId: 'compound-governance-token'
  },
  {
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    symbol: 'UNI',
    name: 'Uniswap',
    decimals: 18,
    coingeckoId: 'uniswap'
  },
  {
    address: '0x8Ee73c484A26e0A5df2Ee2a4960B789967dd0415',
    symbol: 'OPT',
    name: 'Option Token',
    decimals: 18,
    coingeckoId: 'option-token'
  }
];

// EXPANDED Base Network Spenders/Protocols (real verified contracts)
export const BASE_SPENDERS: SpenderConfig[] = [
  // Uniswap Ecosystem
  {
    address: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
    name: 'Uniswap Universal Router',
    protocol: 'Uniswap V3',
    risk: 'low',
    category: 'dex',
    website: 'https://app.uniswap.org'
  },
  {
    address: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    name: 'Uniswap Router V3',
    protocol: 'Uniswap V3',
    risk: 'low',
    category: 'dex',
    website: 'https://app.uniswap.org'
  },
  {
    address: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    name: 'Uniswap SwapRouter',
    protocol: 'Uniswap V3',
    risk: 'low',
    category: 'dex',
    website: 'https://app.uniswap.org'
  },

  // Aerodrome Finance (Major Base DEX)
  {
    address: '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43',
    name: 'Aerodrome Router',
    protocol: 'Aerodrome Finance',
    risk: 'low',
    category: 'dex',
    website: 'https://aerodrome.finance'
  },
  {
    address: '0x9a202c932453fB3d04003979B121E80e5A14eDF7',
    name: 'Aerodrome Voter',
    protocol: 'Aerodrome Finance',
    risk: 'low',
    category: 'farming',
    website: 'https://aerodrome.finance'
  },

  // Aggregators
  {
    address: '0x1111111254EEB25477B68fb85Ed929f73A960582',
    name: '1inch Aggregation Router V5',
    protocol: '1inch Network',
    risk: 'medium',
    category: 'aggregator',
    website: 'https://1inch.io'
  },
  {
    address: '0xDEF1C0ded9bec7F1a1670819833240f027b25EfF',
    name: '0x Exchange Proxy',
    protocol: '0x Protocol',
    risk: 'medium',
    category: 'aggregator',
    website: 'https://0x.org'
  },
  {
    address: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
    name: 'KyberSwap Meta Aggregation Router',
    protocol: 'KyberSwap',
    risk: 'medium',
    category: 'aggregator',
    website: 'https://kyberswap.com'
  },

  // Lending Protocols
  {
    address: '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761',
    name: 'Compound V3 USDC',
    protocol: 'Compound Finance',
    risk: 'low',
    category: 'lending',
    website: 'https://compound.finance'
  },
  {
    address: '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf',
    name: 'Compound V3 ETH',
    protocol: 'Compound Finance',
    risk: 'low',
    category: 'lending',
    website: 'https://compound.finance'
  },
  {
    address: '0x8793cd0e6f54d728A9E8e1F67B35ffcD0Bbc11e2',
    name: 'Seamless Protocol',
    protocol: 'Seamless',
    risk: 'medium',
    category: 'lending',
    website: 'https://seamlessprotocol.com'
  },
  {
    address: '0xfA3C22C069B9556A4B2f7EcE1Ee3B467909f4864',
    name: 'Moonwell Comptroller',
    protocol: 'Moonwell',
    risk: 'medium',
    category: 'lending',
    website: 'https://moonwell.fi'
  },

  // DEXs and AMMs
  {
    address: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24',
    name: 'BaseSwap Router',
    protocol: 'BaseSwap',
    risk: 'medium',
    category: 'dex',
    website: 'https://baseswap.fi'
  },
  {
    address: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
    name: 'SushiSwap Router',
    protocol: 'SushiSwap',
    risk: 'medium',
    category: 'dex',
    website: 'https://sushi.com'
  },
  {
    address: '0x327Df1E6de05895d2ab08513aaDD9313Fe505d86',
    name: 'Curve Base Pool',
    protocol: 'Curve Finance',
    risk: 'low',
    category: 'dex',
    website: 'https://curve.fi'
  },

  // Bridges
  {
    address: '0x49048044D57e1C92A77f79988d21Fa8fAF74E97e',
    name: 'Base Bridge',
    protocol: 'Base Official Bridge',
    risk: 'low',
    category: 'bridge',
    website: 'https://bridge.base.org'
  },
  {
    address: '0x1a2a1c938CE3eC39b6D47113c7955bAa9DD454F2',
    name: 'Across Protocol Bridge',
    protocol: 'Across Protocol',
    risk: 'medium',
    category: 'bridge',
    website: 'https://across.to'
  },
  {
    address: '0x8731d54E9D02c286767d56ac03e8037C07e01e98',
    name: 'Stargate Finance Router',
    protocol: 'Stargate Finance',
    risk: 'medium',
    category: 'bridge',
    website: 'https://stargate.finance'
  },

  // Yield Farming & Staking
  {
    address: '0x8B05801c1Cdce91660aaB7dfAD3a7F2DFCA18b6e',
    name: 'Extra Finance Lending',
    protocol: 'Extra Finance',
    risk: 'high',
    category: 'farming',
    website: 'https://extrafi.io'
  },
  {
    address: '0xeC3a7Ce3Bdc096DC6A0AEF76DB95A2aCe7C2cE0B',
    name: 'Beefy Finance Vault',
    protocol: 'Beefy Finance',
    risk: 'medium',
    category: 'farming',
    website: 'https://beefy.finance'
  },

  // Unknown/High Risk (Common scam patterns)
  {
    address: '0x0000000000000000000000000000000000000000',
    name: 'Unknown/Suspicious Contract',
    protocol: 'Unknown',
    risk: 'high',
    category: 'other',
    website: undefined
  }
];

// Helper functions
export const getTokenByAddress = (address: string): TokenConfig | undefined => {
  return BASE_TOKENS.find(token => 
    token.address.toLowerCase() === address.toLowerCase()
  );
};

export const getSpenderByAddress = (address: string): SpenderConfig | undefined => {
  return BASE_SPENDERS.find(spender => 
    spender.address.toLowerCase() === address.toLowerCase()
  );
};

export const getTokensByCategory = (category: 'stablecoin' | 'major' | 'defi' | 'meme' | 'gaming'): TokenConfig[] => {
  const stablecoins = ['USDC', 'USDbC', 'DAI', 'DOLA'];
  const majors = ['WETH', 'cbETH', 'cbBTC', 'tBTC'];
  const defi = ['AERO', 'WELL', 'BSWAP', 'SEAM', 'COMP', 'UNI', 'OPT'];
  const memes = ['DEGEN', 'BRETT', 'HIGHER', 'TOSHI'];
  const gaming = ['PRIME'];

  let symbols: string[] = [];
  
  switch (category) {
    case 'stablecoin': symbols = stablecoins; break;
    case 'major': symbols = majors; break;
    case 'defi': symbols = defi; break;
    case 'meme': symbols = memes; break;
    case 'gaming': symbols = gaming; break;
  }

  return BASE_TOKENS.filter(token => symbols.includes(token.symbol));
};

export const getSpendersByRisk = (risk: 'low' | 'medium' | 'high'): SpenderConfig[] => {
  return BASE_SPENDERS.filter(spender => spender.risk === risk);
};

export const getSpendersByCategory = (category: SpenderConfig['category']): SpenderConfig[] => {
  return BASE_SPENDERS.filter(spender => spender.category === category);
};

// Configuration summary
export const CONFIG_SUMMARY = {
  totalTokens: BASE_TOKENS.length,
  totalSpenders: BASE_SPENDERS.length,
  totalCombinations: BASE_TOKENS.length * BASE_SPENDERS.length,
  riskDistribution: {
    low: BASE_SPENDERS.filter(s => s.risk === 'low').length,
    medium: BASE_SPENDERS.filter(s => s.risk === 'medium').length,
    high: BASE_SPENDERS.filter(s => s.risk === 'high').length,
  },
  categoryDistribution: {
    dex: BASE_SPENDERS.filter(s => s.category === 'dex').length,
    lending: BASE_SPENDERS.filter(s => s.category === 'lending').length,
    bridge: BASE_SPENDERS.filter(s => s.category === 'bridge').length,
    aggregator: BASE_SPENDERS.filter(s => s.category === 'aggregator').length,
    farming: BASE_SPENDERS.filter(s => s.category === 'farming').length,
    other: BASE_SPENDERS.filter(s => s.category === 'other').length,
  }
};

console.log('Base Configuration Loaded:', CONFIG_SUMMARY);
