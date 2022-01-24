const Token = artifacts.require("Token")
const Timelock = artifacts.require("Timelock")
const Governance = artifacts.require("Governance")
const Treasury = artifacts.require("Treasury")

module.exports = async function (deployer) {

    const [executor, proposer, voter1, voter2, voter3, voter4, voter5] = await web3.eth.getAccounts()

    const name = "DApp University"
    const symbol = "DAPPU"
    const supply = web3.utils.toWei('1000', 'ether') // 1000 Tokens

    // Deploy token
    await deployer.deploy(Token, name, symbol, supply)
    const token = await Token.deployed()

    const amount = web3.utils.toWei('50', 'ether')
    await token.transfer(voter1, amount, { from: executor })
    await token.transfer(voter2, amount, { from: executor })
    await token.transfer(voter3, amount, { from: executor })
    await token.transfer(voter4, amount, { from: executor })
    await token.transfer(voter5, amount, { from: executor })

    // Deploy timelock
    const minDelay = 1 // How long do we have to wait until we can execute after a passed proposal

    // In addition to passing minDelay, we also need to pass 2 arrays.
    // The 1st array contains addresses of those who are allowed to make a proposal.
    // The 2nd array contains addresses of those who are allowed to make executions.

    await deployer.deploy(Timelock, minDelay, [proposer], [executor])
    const timelock = await Timelock.deployed()

    // Deploy governanace
    const quorum = 5 // Percentage of total supply of tokens needed to aprove proposals (5%)
    const votingDelay = 0 // How many blocks after proposal until voting becomes active
    const votingPeriod = 5 // How many blocks to allow voters to vote

    await deployer.deploy(Governance, token.address, timelock.address, quorum, votingDelay, votingPeriod)
    const governance = await Governance.deployed()

    // Deploy Treasury

    // Timelock contract will be the owner of our treasury contract.
    // In the provided example, once the proposal is successful and executed,
    // timelock contract will be responsible for calling the function.

    const funds = web3.utils.toWei('25', 'ether')

    await deployer.deploy(Treasury, executor, { value: funds })
    const treasury = await Treasury.deployed()

    await treasury.transferOwnership(timelock.address, { from: executor })

    // Assign roles

    // You can view more information about timelock roles from the openzeppelin documentation:
    // --> https://docs.openzeppelin.com/contracts/4.x/api/governance#timelock-proposer
    // --> https://docs.openzeppelin.com/contracts/4.x/api/governance#timelock-executor

    const proposerRole = await timelock.PROPOSER_ROLE()
    const executorRole = await timelock.EXECUTOR_ROLE()

    await timelock.grantRole(proposerRole, governance.address, { from: executor })
    await timelock.grantRole(executorRole, governance.address, { from: executor })
};