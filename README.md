# Keepix.Wallets.Xrpl

Library that respects the WalletLibraryInterface.  
This library is used to create wallets, hold coin and token balances and carry out transactions.

XRPL tokens explorer:

```https://xrpl.to/token/sologenic```  

```js
class Wallet {
    constructor({}: {
        password?: string,
        mnemonic?: string,
        privateKey?: string,
        type: string,
        keepixTokens?: { coins: any, tokens: any } // whitelisted coins & tokens
        rpc?: any,
        privateKeyTemplate?: string
    }) {}

    getPrivateKey: () => string;
    getMnemonic: () => string | undefined;
    getAddress: () => string;
    getProdiver: () => Promise<any>;

    // returns like 1.01 (Always in readable value)
    getCoinBalance: (walletAddress?: string) => Promise<string>;
    // returns like 1.01 (Always in readable value)
    getTokenBalance: (tokenAddress: string, walletAddress?: string) => Promise<string>;

    getTokenInformation: (tokenAddress: string) => Promise<{ symbol: string, decimals: number, name: string } | undefined>;

    // amount is always like 1.20 XRPL
    estimateCostSendCoinTo: (receiverAddress: string, amount: string) => Promise<{ success: boolean, description: string }>;
    estimateCostSendTokenTo: (tokenAddress: string, receiverAddress: string, amount: string) => Promise<{ success: boolean, description: string }>;
    sendCoinTo: (receiverAddress: string, amount: string) => Promise<{ success: boolean, description: string }>;
    sendTokenTo: (tokenAddress: string, receiverAddress: string, amount: string) => Promise<{ success: boolean, description: string }>;
}

export interface WalletLibraryInterface {
    Wallet: typeof Wallet;
};
```
