import Tonweb from 'tonweb';
// import { serializeUri } from 'tonweb/dist/types/contract/token/nft/utils';
// import { NftCollection } from 'tonweb/dist/types/contract/token/nft/nft-collection'

const Cell = Tonweb.boc.Cell;
const NftCollection = Tonweb.token.nft.NftCollection;

const serializeUri = (uri: string) => {
  return new TextEncoder().encode(encodeURI(uri));
};

export class NftCollectionEditable extends NftCollection {
  /**
   * TODO: нужно понять как передать параметры в OP 4
   * единственный входной параметр in_msg_body~load_ref()
   */
  
}