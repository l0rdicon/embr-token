// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EmbrToken is ERC20("EmbrToken", "EMBR"), Ownable {
    uint256 public constant MAX_SUPPLY = 250_000_000e18; // 250 million embr

    /// @notice Creates `_amount` token to `_to`. Must only be called by the owner (MasterChef).
    function mint(address _to, uint256 _amount) public onlyOwner {
        require(
            totalSupply() + _amount <= MAX_SUPPLY,
            "EMBR::mint: cannot exceed max supply"
        );
        _mint(_to, _amount);
    }
}
