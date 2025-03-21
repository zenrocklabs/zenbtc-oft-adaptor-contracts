// Get the environment configuration from .env file
//
// To make use of automatic environment setup:
// - Duplicate .env.example file and name it .env
// - Fill in the environment variables
import 'dotenv/config'

import 'hardhat-deploy'
import 'hardhat-contract-sizer'
import '@nomiclabs/hardhat-ethers'
import '@layerzerolabs/toolbox-hardhat'
import { HardhatUserConfig, HttpNetworkAccountsUserConfig } from 'hardhat/types'

import { EndpointId } from '@layerzerolabs/lz-definitions'

import './type-extensions'

import './tasks/index'
import './tasks/send'
// Set your preferred authentication method
//
// If you prefer using a mnemonic, set a MNEMONIC environment variable
// to a valid mnemonic
const MNEMONIC = process.env.MNEMONIC

// If you prefer to be authenticated using a private key, set a PRIVATE_KEY environment variable
const PRIVATE_KEY = process.env.PRIVATE_KEY

const accounts: HttpNetworkAccountsUserConfig | undefined = MNEMONIC
    ? { mnemonic: MNEMONIC }
    : PRIVATE_KEY
      ? [PRIVATE_KEY]
      : undefined

if (accounts == null) {
    console.warn(
        'Could not find MNEMONIC or PRIVATE_KEY environment variables. It will not be possible to execute transactions in your example.'
    )
}

const config: HardhatUserConfig = {
    paths: {
        cache: 'cache/hardhat',
    },
    solidity: {
        compilers: [
            {
                version: '0.8.22',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    networks: {
        'holesky-testnet': {
            eid: EndpointId.HOLESKY_V2_TESTNET,
            url: process.env.ETHEREUM_HOLESKY_TESTNET_RPC || '',
            accounts,
            oftAdapter: {
                tokenAddress: '0x7692E9a796001FeE9023853f490A692bAB2E4834', // Set the token address for the OFT adapter
            },
        },
        'base-testnet': {
            eid: EndpointId.BASESEP_V2_TESTNET,
            url: process.env.BASE_SEPOLIA_RPC_KEY || '',
            accounts,
            oftAdapter: {
                tokenAddress: '0xADE6404D6B49439d2F17106093184fC5B4BeC294', // Set the token address for the OFT adapter
            },
        },
        'arb-testnet': {
            eid: EndpointId.ARBSEP_V2_TESTNET,
            url: process.env.ARBITRUM_SEPOLIA_RPC || '',
            accounts,
            oftAdapter: {
                tokenAddress: '0xB2869FfE7c6689116b782024FB6eEa4Ea1236768', // Set the token address for the OFT adapter
            },
        },
        hardhat: {
            // Need this for testing because TestHelperOz5.sol is exceeding the compiled contract size limit
            allowUnlimitedContractSize: true,
        },
    },
    namedAccounts: {
        deployer: {
            default: 0, // wallet address of index[0], of the mnemonic in .env
        },
    },
}

export default config
