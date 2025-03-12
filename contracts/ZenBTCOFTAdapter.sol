// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { MintBurnOFTAdapter } from "./MintBurnOFTAdapter.sol";
import { IMintableBurnable } from "./interfaces/IMintableBurnable.sol";

contract ZenBTCOFTAdapter is MintBurnOFTAdapter {
    constructor(
        address _token,
        IMintableBurnable _minterBurner,
        address _lzEndpoint,
        address _delegate
    ) MintBurnOFTAdapter(_token, _minterBurner, _lzEndpoint, _delegate) Ownable(_delegate) {}

    function approvalRequired() external pure virtual override returns (bool) {
        return true;
    }
}
