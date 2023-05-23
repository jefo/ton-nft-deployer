import dotenv from 'dotenv'
import fs from 'fs'

import { getConfig } from './config'
import Deployer from './deployer'
import { parseCsv } from './parseCsv'
import nftsJson from './nfts.json';

dotenv.config()
;(async function () {
  const config = await getConfig()

  // const nftsString = fs.readFileSync('nfts.csv', { encoding: 'utf8' })
  // const nfts = parseCsv(nftsString)
  const nfts = nftsJson.map(n => ({
    idx: parseInt(n.name.split('.')[0]) - 1,
    id: n.cid['/']
  }));

  nfts.sort((a, b) => a.idx - b.idx);

  const deployer = new Deployer(config, nfts)
  deployer.start()
})()
