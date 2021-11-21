import { HardhatRuntimeEnvironment } from "hardhat/types"
import { EmbrToken } from "../types"
import { bn } from "../test/utilities"

export default async function ({ ethers, getNamedAccounts, deployments }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  const { address } = await deploy("EmbrToken", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
    contract: "contracts/EmbrToken.sol:EmbrToken",
  })

  const embr = (await ethers.getContractAt("contracts/EmbrToken.sol:EmbrToken", address)) as EmbrToken

  const partnershipFundAddress = process.env.PARTNERSHIP_FUND_ADDRESS!
  // 5% of total supply
  const strategicPartnershipFunds = bn(1_250_000)

  const teamFundVestingAddress = process.env.TEAM_FUND_VESTING_ADDRESS!

  // 15% of total supply
  const vestedTeamFunds = bn(2_750_000)

  const teamFundAddress = process.env.TEAM_FUND_ADDRESS!
  const unvestedTeamFund = bn(1_000_000)

  // 2% of total supply
  const lbpFunds = bn(500_000)
  const lbpFundAddress = process.env.LBP_FUND_ADDRESS!

  if ((await embr.balanceOf(partnershipFundAddress)).eq(0)) {
    console.log(
      `minting strategic partnership funds '${strategicPartnershipFunds}' to strategic partnership address '${partnershipFundAddress}'`
    )
    await embr.mint(partnershipFundAddress, strategicPartnershipFunds)
  }

  if ((await embr.balanceOf(teamFundVestingAddress)).eq(0)) {
    console.log(`minting vested team funds '${vestedTeamFunds}' to team vesting contract address '${teamFundVestingAddress}'`)
    await embr.mint(teamFundVestingAddress, vestedTeamFunds)
  }

  if ((await embr.balanceOf(teamFundAddress)).eq(0)) {
    console.log(`minting unvested team funds '${unvestedTeamFund}' to team contract address '${teamFundAddress}'`)
    await embr.mint(teamFundAddress, unvestedTeamFund)
  }
  if ((await embr.balanceOf(lbpFundAddress)).eq(0)) {
    console.log(`minting lbp funds '${lbpFunds}' to lbp address '${lbpFundAddress}'`)
    await embr.mint(lbpFundAddress, lbpFunds)
  }
}
