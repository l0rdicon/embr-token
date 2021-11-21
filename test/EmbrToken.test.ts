import { deployContract, bn } from "./utilities"
import { EmbrToken } from "../types"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { ethers } from "hardhat"
import { expect } from "chai"

describe("Embr token tests", () => {
  let embr: EmbrToken
  let owner: SignerWithAddress
  let dev: SignerWithAddress
  let treasury: SignerWithAddress

  beforeEach(async function () {
    embr = await deployContract("EmbrToken", [])
    const signers = await ethers.getSigners()
    owner = signers[0]
    dev = signers[1]
    treasury = signers[2]
  })

  it("allows owner to mint", async () => {
    const amountToMint = bn(1000)
    await embr.mint(dev.address, amountToMint)
    expect(await embr.balanceOf(dev.address)).to.be.equal(amountToMint)
  })

  it("reverts when someone else than the owner wants to mint", async () => {
    const amountToMint = bn(1000)
    await expect(embr.connect(treasury).mint(dev.address, amountToMint)).to.be.revertedWith("Ownable: caller is not the owner")
  })

  it("allows transfershipt of owner", async () => {
    await embr.transferOwnership(treasury.address)
    await expect(embr.connect(treasury).mint(dev.address, bn(1000))).not.to.be.reverted
  })

  it("reverts minting if total supply >= max supply of 250mio tokens", async () => {
    const amountToMint = bn(250_000_000)
    await embr.mint(dev.address, amountToMint)
    // we try to mint 1 additional token which should be reverted
    await expect(embr.mint(dev.address, 1)).to.be.revertedWith("EMBR::mint: cannot exceed max supply")
  })
})
