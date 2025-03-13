import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Contract, ContractFactory } from 'ethers'
import { deployments, ethers } from 'hardhat'

import { Options } from '@layerzerolabs/lz-v2-utilities'

describe('ZenBTCOFTAdapter Test', function () {
    // Constant representing a mock Endpoint ID for testing purposes
    const eidA = 1
    const eidB = 2
    // Declaration of variables to be used in the test suite
    let ZenBTCOFTAdapter: ContractFactory
    let ERC20Mock: ContractFactory
    let EndpointV2Mock: ContractFactory
    let ownerA: SignerWithAddress
    let ownerB: SignerWithAddress
    let endpointOwner: SignerWithAddress
    let token: Contract
    let zenBTCOFTAdapterA: Contract
    let zenBTCOFTAdapterB: Contract
    let mockEndpointV2A: Contract
    let mockEndpointV2B: Contract

    // Before hook for setup that runs once before all tests in the block
    before(async function () {
        // Contract factory for our tested contract
        //
        // We are using a derived contract that exposes a mint() function for testing purposes
        ZenBTCOFTAdapter = await ethers.getContractFactory('ZenBTCOFTAdapter')

        ERC20Mock = await ethers.getContractFactory('MyERC20Mock')

        // Fetching the first three signers (accounts) from Hardhat's local Ethereum network
        const signers = await ethers.getSigners()

        ;[ownerA, ownerB, endpointOwner] = signers

        // The EndpointV2Mock contract comes from @layerzerolabs/test-devtools-evm-hardhat package
        // and its artifacts are connected as external artifacts to this project
        //
        // Unfortunately, hardhat itself does not yet provide a way of connecting external artifacts,
        // so we rely on hardhat-deploy to create a ContractFactory for EndpointV2Mock
        //
        // See https://github.com/NomicFoundation/hardhat/issues/1040
        const EndpointV2MockArtifact = await deployments.getArtifact('EndpointV2Mock')
        EndpointV2Mock = new ContractFactory(EndpointV2MockArtifact.abi, EndpointV2MockArtifact.bytecode, endpointOwner)
    })

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async function () {
        // Deploying a mock LZEndpoint with the given Endpoint ID
        mockEndpointV2A = await EndpointV2Mock.deploy(eidA)
        mockEndpointV2B = await EndpointV2Mock.deploy(eidB)
        console.log("Mock has been deployed")
        token = await ERC20Mock.deploy('Token', 'TOKEN')
        console.log("Token has been deployed")

        // Deploying two instances of MyOFT contract with different identifiers and linking them to the mock LZEndpoint
        zenBTCOFTAdapterA = await ZenBTCOFTAdapter.deploy(
            token.address,
            token.address,
            mockEndpointV2A.address,
            ownerA.address
        )
        zenBTCOFTAdapterB = await ZenBTCOFTAdapter.deploy(
            token.address,
            token.address,
            mockEndpointV2B.address,
            ownerB.address
        )
        console.log("Adaptor")

        // Setting destination endpoints in the LZEndpoint mock for each MyOFT instance
        await mockEndpointV2A.setDestLzEndpoint(zenBTCOFTAdapterA.address, mockEndpointV2B.address)
        await mockEndpointV2B.setDestLzEndpoint(zenBTCOFTAdapterB.address, mockEndpointV2A.address)
        console.log("Set Endpoint succeeded")

        // Setting each MyOFT instance as a peer of the other in the mock LZEndpoint
        await zenBTCOFTAdapterA.connect(ownerA).setPeer(eidB, ethers.utils.zeroPad(zenBTCOFTAdapterB.address, 32))
        console.log("Set Peer A succeeded")

        await zenBTCOFTAdapterB.connect(ownerB).setPeer(eidA, ethers.utils.zeroPad(zenBTCOFTAdapterA.address, 32))
        console.log("Set Peer B succeeded")

    })

    // A test case to verify token transfer functionality
    it('should send a token from A address to B address via ZenBTCOFTAdapter/MockERC', async function () {
        // Minting an initial amount of tokens to ownerA's address in the myOFTA contract
        const initialAmount = ethers.utils.parseUnits('10', 'gwei')
        await token.mint(ownerA.address, initialAmount)
        console.log('Initial Amount')

        // Defining the amount of tokens to send and constructing the parameters for the send operation
        const tokensToSend = ethers.utils.parseUnits('1', 'gwei')

        // Defining extra message execution options for the send operation
        const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString()

        const sendParam = [
            eidB,
            ethers.utils.zeroPad(ownerB.address, 32),
            tokensToSend,
            tokensToSend,
            options,
            '0x',
            '0x',
        ]
        console.log('Send params', sendParam)

        // Fetching the native fee for the token send operation
        const [nativeFee] = await zenBTCOFTAdapterA.quoteSend(sendParam, false)

        // Approving the native fee to be spent by the myOFTA contract
        await token.connect(ownerA).approve(zenBTCOFTAdapterA.address, tokensToSend)
        console.log('Approval succeeded')
        // Executing the send operation from myOFTA contract
        await zenBTCOFTAdapterA.send(sendParam, [nativeFee, 0], ownerA.address, { value: nativeFee })

        // Fetching the final token balances of ownerA and ownerB
        const finalBalanceA = await token.balanceOf(ownerA.address)
        const finalBalanceAdapter = await token.balanceOf(zenBTCOFTAdapterA.address)
        const finalBalanceB = await token.balanceOf(ownerB.address)

        // Asserting that the final balances are as expected after the send operation
        expect(finalBalanceA).eql(initialAmount.sub(tokensToSend))
        expect(finalBalanceAdapter).eql(tokensToSend)
        expect(finalBalanceB).eql(tokensToSend)
    })
})
