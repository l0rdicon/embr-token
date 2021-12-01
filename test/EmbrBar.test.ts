import { bn, deployContract, deployERC20Mock } from "./utilities"
import { ethers } from "hardhat"
import { EmbrPit, IERC20 } from "../types"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"

describe("EmbrPit", function () {
  let vestingToken: IERC20
  let embrBar: EmbrPit
  let owner: SignerWithAddress
  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let carol: SignerWithAddress

  before(async function () {
    const signers = await ethers.getSigners()
    owner = signers[0]
    alice = signers[4]
    bob = signers[5]
    carol = signers[6]
  })

  beforeEach(async function () {
    vestingToken = await deployERC20Mock("FidelioDuetto", "FidelioDuettoBPT", bn(10_000))
    embrBar = await deployContract("EmbrPit", [vestingToken.address])
  })

  it("sets initial state correctly", async () => {
    expect(await embrBar.vestingToken()).to.equal(vestingToken.address)
  })

  it("mints correct amount of fEmbr if no tokens have been locked yet", async () => {
    const enterAmount = bn(100)
    await vestingToken.transfer(bob.address, enterAmount)

    await vestingToken.connect(bob).approve(embrBar.address, enterAmount)
    await expect(embrBar.connect(bob).enter(enterAmount)).to.emit(embrBar, "Enter").withArgs(bob.address, enterAmount, enterAmount)
    expect(await vestingToken.balanceOf(embrBar.address)).to.equal(enterAmount)
    expect(await embrBar.balanceOf(bob.address)).to.equal(enterAmount)
  })

  it("mints correct amount of fEmbr if there are already locked tokens while fEmbr value has not been increased", async () => {
    const aliceEnterAmount = bn(50)
    await vestingToken.transfer(alice.address, aliceEnterAmount)

    const bobEnterAmount = bn(100)
    await vestingToken.transfer(bob.address, bobEnterAmount)

    await vestingToken.connect(alice).approve(embrBar.address, aliceEnterAmount)
    await expect(embrBar.connect(alice).enter(aliceEnterAmount))
      .to.emit(embrBar, "Enter")
      .withArgs(alice.address, aliceEnterAmount, aliceEnterAmount)

    await vestingToken.connect(bob).approve(embrBar.address, bobEnterAmount)
    await expect(embrBar.connect(bob).enter(bobEnterAmount)).to.emit(embrBar, "Enter").withArgs(bob.address, bobEnterAmount, bobEnterAmount)

    expect(await vestingToken.balanceOf(embrBar.address)).to.equal(aliceEnterAmount.add(bobEnterAmount))
    expect(await embrBar.balanceOf(alice.address)).to.equal(aliceEnterAmount)
    expect(await embrBar.balanceOf(bob.address)).to.equal(bobEnterAmount)
  })

  it("mints correct amount of fEmbr after a value increase of fEmbr", async () => {
    const aliceEnterAmount = bn(100)
    await vestingToken.transfer(alice.address, aliceEnterAmount)

    const bobEnterAmount = bn(100)
    await vestingToken.transfer(bob.address, bobEnterAmount)

    await vestingToken.connect(alice).approve(embrBar.address, aliceEnterAmount)
    await expect(embrBar.connect(alice).enter(aliceEnterAmount))
      .to.emit(embrBar, "Enter")
      .withArgs(alice.address, aliceEnterAmount, aliceEnterAmount)

    // lets double the value of fEmbr

    const valueIncreaseAmount = bn(100)
    await vestingToken.approve(embrBar.address, valueIncreaseAmount)
    await expect(embrBar.shareRevenue(valueIncreaseAmount)).to.emit(embrBar, "ShareRevenue").withArgs(valueIncreaseAmount)

    // now bob enters, so his share is now only half of the one of alice
    await vestingToken.connect(bob).approve(embrBar.address, bobEnterAmount)
    await expect(embrBar.connect(bob).enter(bobEnterAmount))
      .to.emit(embrBar, "Enter")
      .withArgs(bob.address, bobEnterAmount, bobEnterAmount.div(2))

    expect(await vestingToken.balanceOf(embrBar.address)).to.equal(aliceEnterAmount.add(bobEnterAmount).add(valueIncreaseAmount))
    expect(await embrBar.balanceOf(alice.address)).to.equal(aliceEnterAmount)
    expect(await embrBar.balanceOf(bob.address)).to.equal(bobEnterAmount.div(2))
  })

  it("transfers correct amount of vesting token after a value increase of fEmbr", async () => {
    const aliceEnterAmount = bn(100)
    await vestingToken.transfer(alice.address, aliceEnterAmount)

    const bobEnterAmount = bn(100)
    await vestingToken.transfer(bob.address, bobEnterAmount)

    await vestingToken.connect(alice).approve(embrBar.address, aliceEnterAmount)
    const expectedAliceCharredEmbrAmount = aliceEnterAmount
    await expect(embrBar.connect(alice).enter(aliceEnterAmount))
      .to.emit(embrBar, "Enter")
      .withArgs(alice.address, aliceEnterAmount, expectedAliceCharredEmbrAmount)

    // lets double the value of fEmbr

    const firstValueIncrease = bn(100)
    await vestingToken.approve(embrBar.address, firstValueIncrease)
    await expect(embrBar.shareRevenue(firstValueIncrease)).to.emit(embrBar, "ShareRevenue").withArgs(firstValueIncrease)

    // now bob enters, so his share is now only half of the one of alice
    await vestingToken.connect(bob).approve(embrBar.address, bobEnterAmount)
    const expectedBobCharredEmbrAmount = bobEnterAmount.div(2)
    await expect(embrBar.connect(bob).enter(bobEnterAmount))
      .to.emit(embrBar, "Enter")
      .withArgs(bob.address, bobEnterAmount, expectedBobCharredEmbrAmount)

    // lets add another 100 fEmbr

    const secondValueIncrease = bn(100)

    await vestingToken.approve(embrBar.address, secondValueIncrease)
    await expect(embrBar.shareRevenue(secondValueIncrease)).to.emit(embrBar, "ShareRevenue").withArgs(secondValueIncrease)

    expect(await vestingToken.balanceOf(embrBar.address)).to.equal(
      aliceEnterAmount.add(bobEnterAmount).add(firstValueIncrease).add(secondValueIncrease)
    )

    /*
       amount = fEmbr *  totalVestedTokens / total_fEmbr;

       so we left with alice first:
        alice_amount = 100 * 400 / 150 = 266.666

       then bob:
        bob_amount = 50 * (400 - 266.666) / 50 = 133.333
     */

    const fEmbrSupplyBeforeAliceLeave = await embrBar.totalSupply()
    const lockedFidelioTokensBeforeAliceLeave = await vestingToken.balanceOf(embrBar.address)
    const aliceAmount = await embrBar.balanceOf(alice.address)
    const expectedAliceLeaveLpAmount = aliceAmount.mul(lockedFidelioTokensBeforeAliceLeave).div(fEmbrSupplyBeforeAliceLeave)

    await expect(embrBar.connect(alice).leave(aliceAmount))
      .to.emit(embrBar, "Leave")
      .withArgs(alice.address, expectedAliceLeaveLpAmount, expectedAliceCharredEmbrAmount)

    expect(await vestingToken.balanceOf(alice.address)).to.equal(expectedAliceLeaveLpAmount)

    const fEmbrSupplyBeforeBobLeave = await embrBar.totalSupply()
    const lockedFidelioTokensBeforeBobLeave = await vestingToken.balanceOf(embrBar.address)
    const bobAmount = await embrBar.balanceOf(bob.address)
    const expectedBobLeaveLpAmount = bobAmount.mul(lockedFidelioTokensBeforeBobLeave).div(fEmbrSupplyBeforeBobLeave)
    await expect(embrBar.connect(bob).leave(bobAmount))
      .to.emit(embrBar, "Leave")
      .withArgs(bob.address, expectedBobLeaveLpAmount, expectedBobCharredEmbrAmount)
    expect(await vestingToken.balanceOf(bob.address)).to.equal(expectedBobLeaveLpAmount)
  })
})
