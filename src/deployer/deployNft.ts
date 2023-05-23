import TonWeb from 'tonweb' // should be on top
import { callTonApi, delay, isNftExists } from '../utils'

import Deployer from './index'
import { NftCollectionEditable } from '../NftCollectionEditable'
import readEditableCell, { createNftEditContentCell } from './nftEditableCode'

const { NftItem } = TonWeb.token.nft

const nftCode = readEditableCell();

// deployNft - Finds first nft with status 0, checks if it exists, if not deploys.
export async function deployNft(this: Deployer, nftCollection: NftCollectionEditable) {
  if (!nftCollection.address) {
    throw new Error('[Deployer] Corrupt nft collection')
  }

  const toDeploy = this.nfts[this.deployIndex]

  // Address that deploys everything should have tons
  await this.ensureDeployerBalance()
  // We need to make sure that nft collection has enough balance to create nft
  await this.ensureCollectionBalance(nftCollection)
  // Previous nft should be deployed, otherwise nft will not be created and we will get stuck seqno
  await this.ensurePreviousNftExists(nftCollection, toDeploy.idx)

  this.log(`[Deployer] NFT deploy started ${toDeploy.idx} ${toDeploy.owner_address || ''}`)

  // Check if nft exists
  const nftItemAddress = await callTonApi<
    ReturnType<typeof nftCollection.getNftItemAddressByIndex>
  >(() => nftCollection.getNftItemAddressByIndex(toDeploy.idx))
  const nftItem = new NftItem(this.tonweb.provider, {
    address: nftItemAddress,
    code: nftCode,
  });

    // 0.05 should be enough to deploy nft
  // eslint-disable-next-line prettier/prettier
  const amount = TonWeb.utils.toNano("0.05")
  const walletAddress = await this.wallet.getAddress()

  // If we have seqno in db, use it to rebroadcast tx
  const seqno: number = toDeploy.seqno ? toDeploy.seqno : await callTonApi(this.wallet.methods.seqno().call)

  const exists = await isNftExists(this.tonweb, nftCollection, toDeploy.idx)
  if (exists) {
    this.log(`[Deployer] Deploy skipped. Updating metadata ${toDeploy.idx}`)
    await callTonApi(
      this.wallet.methods.transfer({
        seqno,
        secretKey: this.key.secretKey,
        toAddress: nftItemAddress,
        amount: TonWeb.utils.toNano("0.1"),
        payload: createNftEditContentCell({
          itemOwnerAddress: walletAddress,
          itemContentUri: 'https://ipfs.io/ipfs/bafkreigh3qxsnkeauan2rzw7uk5z44pjqwied32qux2k3d6ygjpvljphoq',
        }),
        sendMode: 3,
      }).send
    );
    if (!toDeploy.seqno) {
      toDeploy.seqno = seqno
    }
  
    // Make sure that seqno increased from one we used
    await this.ensureSeqnoInc(seqno)
  
    // Wait to make sure blockchain updated and includes our nft
    await delay(18000)
  
    // Get new nft from blockchain
    const itemInfo = await callTonApi<ReturnType<typeof nftCollection.getNftItemContent>>(() =>
      nftCollection.getNftItemContent(nftItem)
    )
  
    console.log('NFT contentUri', itemInfo.contentUri)
  
    this.deployIndex++;
    return
  }

  // If we have no seqno from db and api - throw.
  // It can't be 0 since we already should've deployed collection
  if (typeof seqno !== 'number' || seqno === 0) {
    throw new Error('[Deployer] No seqno found')
  }

  // deploy nft
  const nftBody = {
    amount,
    itemIndex: toDeploy.idx,
    itemOwnerAddress: toDeploy.owner_address
      ? new TonWeb.utils.Address(toDeploy.owner_address)
      : walletAddress,
    itemContentUri: toDeploy.id,
  };
  await callTonApi(
    this.wallet.methods.transfer({
      secretKey: this.key.secretKey,
      toAddress: nftCollection.address,
      amount,
      seqno,
      payload: nftCollection.createMintBody(nftBody),
      sendMode: 3,
    }).send
  );

  // If nft in db didn't have seqno - set it and retry deploy loop
  if (!toDeploy.seqno) {
    toDeploy.seqno = seqno
  }

  // Make sure that seqno increased from one we used
  await this.ensureSeqnoInc(seqno)

  // Wait to make sure blockchain updated and includes our nft
  await delay(8000)

  // Get new nft from blockchain
  const itemInfo = await callTonApi<ReturnType<typeof nftCollection.getNftItemContent>>(() =>
    nftCollection.getNftItemContent(nftItem)
  )

  console.log('NFT contentUri', itemInfo.contentUri)

  if (!itemInfo) {
    throw new Error(`[Deployer] no nft item info ${toDeploy.idx}`)
  }
  if (!itemInfo.ownerAddress) {
    throw itemInfo
  }

  this.deployIndex++
  this.log(`[Deployer] NFT deployed ${toDeploy.idx}`)
}
