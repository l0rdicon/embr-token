// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract EmbrPit is ERC20("CharredEmbr", "cEMBR") {
    using SafeERC20 for IERC20;

    IERC20 public vestingToken;

    event Enter(
        address indexed user,
        uint256 vestingInAmount,
        uint256 mintedAmount
    );
    event Leave(
        address indexed user,
        uint256 vestingOutAmount,
        uint256 burnedAmount
    );
    event ShareRevenue(uint256 amount);

    constructor(IERC20 _vestingToken) {
        vestingToken = _vestingToken;
    }

    function enter(uint256 _amount) external {
        if (_amount > 0) {
            uint256 totalLockedTokenSupply = vestingToken.balanceOf(
                address(this)
            );

            uint256 totalCharredEmbr = totalSupply();

            vestingToken.transferFrom(msg.sender, address(this), _amount);
            uint256 mintAmount;
            // If no fEmbr exists, mint it 1:1 to the amount put in
            if (totalCharredEmbr == 0 || totalLockedTokenSupply == 0) {
                mintAmount = _amount;
            }
            // Calculate and mint the amount of fEmbr the blp is worth. The ratio will change overtime
            else {
                uint256 shareOfCharredEmbr = (_amount * totalCharredEmbr) /
                    totalLockedTokenSupply;

                mintAmount = shareOfCharredEmbr;
            }
            _mint(msg.sender, mintAmount);
            emit Enter(msg.sender, _amount, mintAmount);
        }
    }

    function leave(uint256 _shareOfCharredEmbr) external {
        if (_shareOfCharredEmbr > 0) {
            uint256 totalVestedTokenSupply = vestingToken.balanceOf(
                address(this)
            );
            uint256 totalCharredEmbr = totalSupply();
            // Calculates the amount of vestingToken the fEmbr are worth
            uint256 amount = (_shareOfCharredEmbr * totalVestedTokenSupply) /
                totalCharredEmbr;
            _burn(msg.sender, _shareOfCharredEmbr);
            vestingToken.transfer(msg.sender, amount);

            emit Leave(msg.sender, amount, _shareOfCharredEmbr);
        }
    }

    function shareRevenue(uint256 _amount) external {
        vestingToken.transferFrom(msg.sender, address(this), _amount);
        emit ShareRevenue(_amount);
    }
}
