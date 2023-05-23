import fs from 'fs';
import path from 'path';
import Tonweb from 'tonweb';

const Cell = Tonweb.boc.Cell;

export default function readEditableCell() {
  const boc = fs.readFileSync(path.join(__dirname, './nft-item-editable.boc'), { encoding: 'utf8' });
  const t = Buffer.from(boc, "base64");
  return Cell.oneFromBoc(t);
}

const serializeUri = (uri: string) => {
  return new TextEncoder().encode(encodeURI(uri));
};

export function createNftEditContentCell(params: any) {
  const body = new Cell();
  body.bits.writeUint(0x1a0b9d51, 32); // OP deploy new nft
  body.bits.writeUint(params.queryId || 0, 64); // query_id
  const uriContent = new Cell();
  uriContent.bits.writeBytes(serializeUri(params.itemContentUri));

  body.refs[0] = uriContent;

  // const nftItemContent = new Cell();
  // nftItemContent.bits.writeAddress(params.itemOwnerAddress);

  // const uriContent = new Cell();
  // uriContent.bits.writeBytes(serializeUri(params.itemContentUri));
  // nftItemContent.refs[0] = uriContent;

  // body.refs[0] = nftItemContent;

  return body;
}
