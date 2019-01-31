import baseConfig from './default'
import config from './mainnet'


const newERC20 = config.erc20
newERC20[process.argv[3]] = {
  address: process.argv[2],
  decimals: Number.parseInt(process.argv[4], 10),
  fullName: process.argv[5].split('_').join(' '),
}

export default {
  env: 'development',
  entry: 'mainnet',
  local: 'local',

  base: `http://localhost:${baseConfig.http.port}/`,
  publicPath: `http://localhost:${baseConfig.http.port}${baseConfig.publicPath}`,

  isWidget: true,
  ...config,
  erc20: newERC20,
  erc20token: process.argv[3],
}
