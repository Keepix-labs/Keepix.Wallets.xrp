import { Wallet } from './Wallet'

describe('basic wallet', () => {
  const mnemonic =
    'celery net original hire stand seminar cricket reject draft hundred hybrid dry three chair sea enable perfect this good race tooth junior beyond since'
  const privateKey =
    '00C39B242464E13A05D27444513BC1A516419777714EE44E3C21A3D7C4B86BAE56'
  const address = 'rEg1y1RXRYgsRnQK1MhcEZ45A6sq8GzpwJ'

  const rpc = { url: 'wss://testnet.xrpl-labs.com/' }

  it('can generate same wallet', async () => {
    const wallet = new Wallet({ password: 'toto', type: 'xrpl' })
    expect(wallet.getAddress()).toEqual(address)
    expect(wallet.getPrivateKey()).toEqual(privateKey)
    expect(wallet.getMnemonic()).toEqual(mnemonic)
  })

  it('can generate with Mnemonic', async () => {
    const wallet = new Wallet({ mnemonic: mnemonic, type: 'xrpl' })

    expect(wallet.getAddress()).toEqual(address)
    expect(wallet.getPrivateKey()).toEqual(privateKey)
    expect(wallet.getMnemonic()).toEqual(mnemonic)
  })

  it('can generate with PrivateKey', async () => {
    const wallet = new Wallet({ privateKey: privateKey, type: 'xrpl' })

    expect(wallet.getAddress()).toEqual(address)
    expect(wallet.getPrivateKey()).toEqual(privateKey)
    expect(wallet.getMnemonic()).toBe(undefined)
  })

  it('can generate with random', async () => {
    const wallet = new Wallet({ type: 'xrpl' })

    expect(wallet.getAddress()).toBeDefined()
    expect(wallet.getPrivateKey()).toBeDefined()
    expect(wallet.getMnemonic()).toBeDefined()
  })

  it('can getBalance', async () => {
    const wallet = new Wallet({
      password: 'toto',
      type: 'xrpl',
      rpc: rpc,
    })
    expect(
      await wallet.getCoinBalance('rKzZivQ8yM5gVG5qRvw44bqFada1gcSX2W'),
    ).toEqual('10999.999976')
  }, 1000000)

  it('can getTokenBalance', async () => {
    const wallet = new Wallet({
      password: 'toto',
      type: 'xrpl',
      rpc: rpc,
    })
    expect(
      await wallet.getTokenBalance(
        'AAA.rNYuQ1Bf972uuMMnAXozesZ5MZo4TCs29b',
        'rKzZivQ8yM5gVG5qRvw44bqFada1gcSX2W',
      ),
    ).toEqual('1000')
  })

  it('can getTokenInformation', async () => {
    const wallet = new Wallet({
      password: 'toto',
      type: 'xrpl',
      rpc: rpc,
    })

    expect(
      await wallet.getTokenInformation(
        'CNY.razqQKzJRdB4UxFPWf5NEpEG3WMkmwgcXA',
      ),
    ).toEqual({ name: 'RippleChina', symbol: 'CNY', decimals: 0 })
  })

  it('can estimate sendCoin', async () => {
    const wallet = new Wallet({
      password: 'toto',
      type: 'xrpl',
      rpc: rpc,
    })
    const estimationResult = await wallet.sendCoinTo(
      'rUeSqbu6wmJc6fkYzgkyBuqywr6pRTYhuZ',
      '1',
    )
    expect(estimationResult.success).toBe(true)
  }, 100000)

  it('can estimate sendToken', async () => {
    const wallet = new Wallet({
      password: 'toto',
      type: 'xrpl',
      rpc: rpc,
    })
    const estimationResult = await wallet.sendTokenTo(
      'AAA.rNYuQ1Bf972uuMMnAXozesZ5MZo4TCs29b',
      'rUeSqbu6wmJc6fkYzgkyBuqywr6pRTYhuZ',
      '10',
    )
    expect(estimationResult.success).toBe(true)
  }, 100000)
})
