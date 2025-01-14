#!/usr/bin/env node
import {
  Agreement,
  AgreementStatus,
  DeploymentStatus,
  ForestProtocolMarketplaceABI,
  getForestContractAddress,
} from "@forest-protocols/sdk";
import { Provider } from "./provider";
import { config } from "./config";
import { parseEventLogs } from "viem";
import { LocalStorage } from "./database/LocalStorage";
import { logger } from "./logger";
import * as ansis from "ansis";
import { marketplace, providerAccount, rpcClient } from "./clients";

async function sleep(ms: number) {
  return await new Promise((res) => setTimeout(res, ms));
}

class Program {
  provider = new Provider();
  contractAddress = getForestContractAddress(config.CHAIN);

  constructor() {}

  // A shorthand for Local Storage instance
  get localStorage() {
    return LocalStorage.instance;
  }

  async processAgreementCreated(agreement: Agreement) {
    try {
      const offer = await this.localStorage.getOffer(agreement.offerId);
      const details = await this.provider.create(agreement, offer);
      await this.localStorage.createResource({
        id: agreement.id,
        deploymentStatus: details.status,
        name: details.name,
        offerId: agreement.offerId,
        ownerAddress: agreement.ownerAddress,
        details: {
          ...details,
          // These are already stored in the other column
          status: undefined,
          name: undefined,
        },
      });
      // TODO: If the deployment status is deploying, start an async function to keep track of the deployment
    } catch (err: any) {
      logger.error(`Error while creating the resource: ${err.stack}`);

      // Save that resource as a failed deployment
      await this.localStorage.createResource({
        id: agreement.id,
        deploymentStatus: DeploymentStatus.Failed,
        name: "",
        offerId: agreement.offerId,
        ownerAddress: agreement.ownerAddress,
        details: {},
      });
    }
  }

  async processAgreementClosed(agreement: Agreement) {
    try {
      const resource = await this.localStorage.getResource(
        agreement.id,
        agreement.ownerAddress
      );
      await this.provider.delete(agreement, resource);
    } catch (err: any) {
      logger.error(`Error while deleting the resource: ${err.stack}`);
    }

    await this.localStorage.deleteResource(agreement.id);
  }

  async main() {
    await this.init();
    await this.provider.init();

    logger.info(
      `Provider address: ${ansis.yellow.bold(providerAccount.address)}`
    );
    logger.info("Started to listening blockchain events");
    let currentBlockNumber = await this.findStartBlock();

    while (true) {
      const block = await this.getBlock(currentBlockNumber);

      if (!block) {
        logger.info(
          `Waiting for block ${this.colorBlockNumber(currentBlockNumber)}...`
        );
        await this.waitBlock(currentBlockNumber);
        continue;
      }

      if (block.transactions.length == 0) {
        logger.info(
          `No transactions found in block ${this.colorBlockNumber(
            currentBlockNumber
          )}, skipping...`
        );
        await LocalStorage.instance.saveTxAsProcessed(currentBlockNumber, "");
        currentBlockNumber++;
        continue;
      }

      logger.info(`Processing block ${this.colorBlockNumber(block.number)}`);
      for (const tx of block.transactions) {
        if (tx.to?.toLowerCase() !== this.contractAddress.toLowerCase()) {
          continue;
        }

        const receipt = await rpcClient.getTransactionReceipt({
          hash: tx.hash,
        });

        if (receipt.status == "reverted") {
          logger.info(`${this.colorTxHash(tx.hash)} is reverted, skipping...`);
          continue;
        }

        const txRecord = await LocalStorage.instance.getTransaction(
          tx.blockNumber,
          tx.hash
        );

        if (txRecord?.isProcessed) {
          logger.info(
            `${this.colorTxHash(tx.hash)} is already processed, skipping...`
          );
          continue;
        }

        const events = parseEventLogs({
          abi: ForestProtocolMarketplaceABI,
          logs: receipt.logs,
        });

        for (const event of events) {
          if (
            event.eventName === "AgreementCreated" &&
            event.args.providerOwnerAddr == providerAccount.address
          ) {
            const agreement = await marketplace.getAgreement(
              Number(event.args.id)
            );
            await this.processAgreementCreated(agreement);
            await this.localStorage.saveTxAsProcessed(
              event.blockNumber,
              event.transactionHash
            );
          } else if (
            event.eventName === "AgreementClosed" &&
            event.args.providerOwnerAddr == providerAccount.address
          ) {
            const agreement = await marketplace.getAgreement(
              Number(event.args.id)
            );
            await this.processAgreementClosed(agreement);
            await this.localStorage.saveTxAsProcessed(
              event.blockNumber,
              event.transactionHash
            );
          }
        }
      }

      // Empty hash means block itself, so this block is completely processed
      await LocalStorage.instance.saveTxAsProcessed(currentBlockNumber, "");
      currentBlockNumber++;
    }
  }

  async init() {
    logger.info("Initializing database connection");
    await this.localStorage.init();

    // Check agreement balances at startup then in every minute
    this.checkAgreementBalances();
    setInterval(() => this.checkAgreementBalances(), 60 * 1000);
  }

  async checkAgreementBalances() {
    logger.info("Checking balances of the agreements", { context: "Checker" });
    const agreements = await marketplace.getAllProviderAgreements(
      providerAccount.address,
      { status: AgreementStatus.Active }
    );
    const closingRequests: Promise<any>[] = [];

    for (const agreement of agreements) {
      const balance = await marketplace.getAgreementBalance(agreement.id);

      // If balance of the agreement is ran out of,
      if (balance <= 0n) {
        logger.warning(
          `User ${agreement.ownerAddress} has ran out of balance for agreement #${agreement.id}`
        );
        // Queue closeAgreement call to the promise list.
        closingRequests.push(
          marketplace.closeAgreement(agreement.id).catch((err) => {
            logger.error(
              `Error thrown while trying to force close agreement #${agreement.id}: ${err.stack}`
            );
          })
        );
      }
    }

    // Wait until all of the closeAgreement calls (if there are) are finished
    await Promise.all(closingRequests);
  }

  async findStartBlock() {
    const latestProcessedBlock =
      await LocalStorage.instance.getLatestProcessedBlockHeight();

    // TODO: Find the registration TX of the provider and start from there

    return latestProcessedBlock || (await rpcClient.getBlockNumber());
  }

  async getBlock(num: bigint) {
    try {
      return await rpcClient.getBlock({
        blockNumber: num,
        includeTransactions: true,
      });
    } catch (err: any) {
      // logger.debug(err.stack);
    }
  }

  async waitBlock(num: bigint) {
    while (true) {
      const block = await this.getBlock(num);

      if (block) return;

      await sleep(3000);
    }
  }

  colorBlockNumber(num: bigint) {
    return ansis.bold.red(`#${num}`);
  }
  colorTxHash(hash: string) {
    return ansis.bold.red(`TX (${hash})`);
  }
}

const program = new Program();
program.main();
// eslint-disable-next-line @typescript-eslint/no-redeclare
interface BigInt {
  /** Convert to BigInt to string form in JSON.stringify */
  toJSON: () => string;
}
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
