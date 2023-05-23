import fs from 'fs';
import {Cell} from 'ton';

function main() {
  const boc = fs.readFileSync('./contracts/nft-collection-editable.boc', { encoding: 'utf8' });
  const t = Buffer.from(boc, "base64");
  let codeCell = Cell.fromBoc(t)[0];
  console.log(t);
  console.log(codeCell);
}

main();
