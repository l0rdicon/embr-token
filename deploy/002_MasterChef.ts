import { bn } from "../test/utilities"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { EmbrMasterChef, EmbrToken, Timelock } from "../types"

export default async function ({ ethers, deployments, getNamedAccounts, network }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments
  const { deployer, dev, treasury } = await getNamedAccounts()
  const embrDeployment = await deployments.get("EmbrToken")
  const embr: EmbrToken = (await ethers.getContractAt(
    "contracts/EmbrToken.sol:EmbrToken",
    embrDeployment.address
  )) as EmbrToken

  const embrPerBlock = bn(505, 16)

  const startBlock = process.env.DEPLOYMENT_MC_START_BLOCK

  const { address, args } = await deploy("EmbrMasterChef", {
    from: deployer,
    args: [embr.address, process.env.TREASURY_ADDRESS, embrPerBlock, startBlock],
    log: true,
    deterministicDeployment: false,
    contract: "contracts/EmbrMasterChef.sol:EmbrMasterChef",
  })

  console.log("masterchef constructor args", JSON.stringify(args))

  if ((await embr.owner()) !== address) {
    // Transfer EMBR Ownership to Chef
    console.log("Transfer Embr Ownership to Chef")
    await (await embr.transferOwnership(address)).wait()
  }
}
