import { entropyToMnemonic } from 'bip39-light'
import crypto from 'crypto'
import { Client, Wallet as XrplWallet, xrpToDrops } from 'xrpl'
import elliptic from 'elliptic'

const Secp256k1 = new elliptic.ec('secp256k1')

function createPrivateKey(templatePrivateKey: string, password: string) {
  const hash = crypto
    .createHash('sha256')
    .update(templatePrivateKey + password, 'utf8')
    .digest('hex')
  return hash.substring(0, 64) // Truncate to 64 characters (32 bytes)
}

function bytesToHex(a: Iterable<number> | ArrayLike<number>): string {
  return Array.from(a, (byteValue) => {
    const hex = byteValue.toString(16).toUpperCase()
    return hex.length > 1 ? hex : `0${hex}`
  }).join('')
}

/**
 * Wallet class who respect the WalletLibraryInterface for Keepix
 */
export class Wallet {
  private wallet: XrplWallet
  private mnemonic?: string
  private type?: string
  private keepixTokens?: { coins: any; tokens: any }
  private rpc?: any

  constructor({
    password,
    mnemonic,
    privateKey,
    type,
    keepixTokens,
    rpc,
    privateKeyTemplate = '0x2050939757b6d498bb0407e001f0cb6db05c991b3c6f7d8e362f9d27c70128b9',
  }: {
    password?: string
    mnemonic?: string
    privateKey?: string
    type: string
    keepixTokens?: { coins: any; tokens: any } // whitelisted coins & tokens
    rpc?: any
    privateKeyTemplate?: string
  }) {
    this.type = type
    this.keepixTokens = keepixTokens
    this.rpc = rpc

    // from password
    if (password !== undefined) {
      const newEntropy = createPrivateKey(privateKeyTemplate, password)
      this.mnemonic = entropyToMnemonic(newEntropy)
      this.wallet = XrplWallet.fromMnemonic(this.mnemonic)
      return
    }
    // from mnemonic
    if (mnemonic !== undefined) {
      this.mnemonic = mnemonic
      this.wallet = XrplWallet.fromMnemonic(mnemonic)
      return
    }
    // from privateKey only
    if (privateKey !== undefined) {
      this.mnemonic = undefined
      const publicKey = this.getPubKeyFromPrivKey(privateKey)
      this.wallet = new XrplWallet(publicKey, privateKey)
      return
    }
    // Random
    this.mnemonic = entropyToMnemonic(crypto.randomBytes(32).toString('hex'))
    this.wallet = XrplWallet.fromMnemonic(this.mnemonic)
  }

  // PUBLIC

  public getPrivateKey() {
    return this.wallet.privateKey
  }

  public getMnemonic() {
    return this.mnemonic
  }

  public getAddress() {
    return this.wallet.address
  }

  public getProdiver() {
    const client = new Client(this.rpc)
    return client
  }

  public getConnectedWallet = async () => {
    return this.wallet
  }

  // always display the balance in 0 decimals like 1.01 XRP
  public async getCoinBalance(walletAddress?: string) {
    try {
      const client = await this.getProdiver()
      await client.connect()
      const balance = await client.getBalances(
        walletAddress ?? this.getAddress(),
      )
      await client.disconnect()
      return balance.find((item) => item.currency === 'XRP')?.value ?? '0'
    } catch (err) {
      console.log(err)
      return '0'
    }
  }

  public async getTokenInformation(tokenAddress: string) {
    try {
      const [code, issuer] = tokenAddress.split('.')

      return { name: code, symbol: code, decimals: 0 }
    } catch (err) {
      console.log(err)
      return undefined
    }
  }

  // always display the balance in 0 decimals like 1.01 RPL
  public async getTokenBalance(tokenAddress: string, walletAddress?: string) {
    try {
      const [code, issuer] = tokenAddress.split('.')
      const client = await this.getProdiver()
      await client.connect()
      const balance = await client.getBalances(
        walletAddress ?? this.getAddress(),
      )
      await client.disconnect()
      return (
        balance.find((item) => item.currency === code && item.issuer === issuer)
          ?.value ?? '0'
      )
    } catch (err) {
      console.log(err)
      return '0'
    }
  }

  public async estimateCostSendCoinTo(receiverAddress: string, amount: string) {
    try {
      const client = await this.getProdiver()
      await client.connect()

      const prepared = await client.autofill({
        TransactionType: 'Payment',
        Account: this.wallet.address,
        Amount: xrpToDrops(amount),
        Destination: receiverAddress,
      })

      await client.disconnect()
      return { success: true, description: (prepared as any)?.Fee ?? '0' }
    } catch (err) {
      console.log(err)
      return { success: false, description: `Estimation Failed: ${err}` }
    }
  }

  public async sendCoinTo(receiverAddress: string, amount: string) {
    try {
      const client = await this.getProdiver()
      await client.connect()

      const prepared = await client.autofill({
        TransactionType: 'Payment',
        Account: this.wallet.address,
        Amount: xrpToDrops(amount),
        Destination: receiverAddress,
      })
      const signed = this.wallet.sign(prepared)
      const tx = await client.submitAndWait(signed.tx_blob)

      await client.disconnect()
      if ((tx.result.meta as any)?.TransactionResult === 'tesSUCCESS') {
        return { success: true, description: tx.result.hash }
      } else {
        return {
          success: false,
          description: (tx.result.meta as any)?.TransactionResult,
        }
      }
    } catch (err) {
      console.log(err)
      return { success: false, description: `Transaction Failed: ${err}` }
    }
  }

  public async sendTokenTo(
    tokenAddress: string,
    receiverAddress: string,
    amount: string,
  ) {
    try {
      const [code, issuer] = tokenAddress.split('.')

      const client = await this.getProdiver()
      await client.connect()

      const prepared = await client.autofill({
        TransactionType: 'Payment',
        Account: this.wallet.address,
        Amount: {
          currency: code,
          issuer: issuer,
          value: amount,
        },
        Destination: receiverAddress,
      })
      const signed = this.wallet.sign(prepared)
      const tx = await client.submitAndWait(signed.tx_blob)
      console.log(tx)

      await client.disconnect()
      if ((tx.result.meta as any)?.TransactionResult === 'tesSUCCESS') {
        return { success: true, description: tx.result.hash }
      } else {
        return {
          success: false,
          description: (tx.result.meta as any)?.TransactionResult,
        }
      }
    } catch (err) {
      console.log(err)
      return { success: false, description: `Transaction Failed: ${err}` }
    }
  }

  public async estimateCostSendTokenTo(
    tokenAddress: string,
    receiverAddress: string,
    amount: string,
  ) {
    try {
      const [code, issuer] = tokenAddress.split('.')

      const client = await this.getProdiver()
      await client.connect()

      const prepared = await client.autofill({
        TransactionType: 'Payment',
        Account: this.wallet.address,
        Amount: {
          currency: code,
          issuer: issuer,
          value: amount,
        },
        Destination: receiverAddress,
      })

      await client.disconnect()
      return { success: true, description: (prepared as any)?.Fee ?? '0' }
    } catch (err) {
      console.log(err)
      return { success: false, description: `Estimation Failed: ${err}` }
    }
  }

  private getPubKeyFromPrivKey(privKey: string) {
    return bytesToHex(
      Secp256k1.keyFromPrivate(privKey.slice(2)).getPublic().encodeCompressed(),
    )
  }
}
