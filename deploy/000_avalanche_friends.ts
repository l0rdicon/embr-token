import { HardhatRuntimeEnvironment } from "hardhat/types"
import { AvalancheFriendsCollectible } from "../types"
import { bn } from "../test/utilities"

export default async function ({ ethers, getNamedAccounts, deployments }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  const { address } = await deploy("AvalancheFriendsCollectible", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
    contract: "contracts/AvalancheFriendsCollectible.sol:AvalancheFriendsCollectible",
  })

  console.log("deployed at ", address)
  //const avalnacheFriends = (await ethers.getContractAt("contracts/AvalancheFriendsCollectible.sol:AvalancheFriendsCollectible", address)) as AvalancheFriendsCollectible
}
