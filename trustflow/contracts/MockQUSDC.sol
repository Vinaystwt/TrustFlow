// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockQUSDC is ERC20 {
    /// @notice Deploys the mock QUSDC token.
    constructor() ERC20("Mock QUSDC", "QUSDC") {}

    /// @notice Returns the QUSDC decimal precision.
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Mints mock QUSDC to an address.
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
