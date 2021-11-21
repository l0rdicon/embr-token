// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IRewarder {
    function onEmbrReward(
        uint256 pid,
        address user,
        address recipient,
        uint256 embrAmount,
        uint256 newLpAmount
    ) external;

    function pendingTokens(
        uint256 pid,
        address user,
        uint256 embrAmount
    ) external view returns (IERC20[] memory, uint256[] memory);
}
