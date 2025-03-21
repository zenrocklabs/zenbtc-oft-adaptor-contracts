import { ExecutorOptionType } from '@layerzerolabs/lz-v2-utilities'
import { OAppEnforcedOption, OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'
import { generateConnectionsConfig } from '@layerzerolabs/metadata-tools'

const holeskyContract: OmniPointHardhat = {
    eid: EndpointId.HOLESKY_V2_TESTNET,
    contractName: 'ZenBTCOFTAdapter',
}

const solanaContract: OmniPointHardhat = {
    eid: EndpointId.SOLANA_V2_TESTNET,
    address: 'Ce6T9Jhj1v6pVGQBmkGtHdjURKWfQPxjbWN7vXqKCCwy', // NOTE: update this with the OFTStore address.
}

const EVM_ENFORCED_OPTIONS: OAppEnforcedOption[] = [
    {
        msgType: 1,
        optionType: ExecutorOptionType.LZ_RECEIVE,
        gas: 80000,
        value: 0,
    },
    {
        msgType: 2,
        optionType: ExecutorOptionType.LZ_RECEIVE,
        gas: 80000,
        value: 0,
    },
    {
        msgType: 2,
        optionType: ExecutorOptionType.COMPOSE,
        index: 0,
        gas: 80000,
        value: 0,
    },
]

const SOLANA_ENFORCED_OPTIONS: OAppEnforcedOption[] = [
    {
        msgType: 1,
        optionType: ExecutorOptionType.LZ_RECEIVE,
        gas: 200000,
        value: 2500000,
    },
    {
        msgType: 2,
        optionType: ExecutorOptionType.LZ_RECEIVE,
        gas: 200000,
        value: 2500000,
    },
    {
        // Solana options use (gas == compute units, value == lamports)
        msgType: 2,
        optionType: ExecutorOptionType.COMPOSE,
        index: 0,
        gas: 0,
        value: 0,
    },
]

export default async function () {
    // note: pathways declared here are automatically bidirectional
    // if you declare A,B there's no need to declare B,A
    const connections = await generateConnectionsConfig([
        [
            solanaContract, // Chain A contract
            holeskyContract, // Chain B contract
            [['LayerZero Labs'], []], // [ requiredDVN[], [ optionalDVN[], threshold ] ]
            [32, 15], // [A to B confirmations, B to A confirmations]
            [EVM_ENFORCED_OPTIONS, SOLANA_ENFORCED_OPTIONS], // Chain B enforcedOptions, Chain A enforcedOptions
        ],
        [
            solanaContract, // Chain A contract
            holeskyContract, // Chain B contract
            [['LayerZero Labs'], []], // [ requiredDVN[], [ optionalDVN[], threshold ] ]
            [32, 15], // [A to B confirmations, B to A confirmations]
            [EVM_ENFORCED_OPTIONS, SOLANA_ENFORCED_OPTIONS], // Chain B enforcedOptions, Chain A enforcedOptions
        ],
    ])

    return {
        contracts: [{ contract: holeskyContract }, {contract: solanaContract}],
        connections,
    }
}
