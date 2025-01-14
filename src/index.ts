#!/usr/bin/env node
import {
  Agreement,
  AgreementStatus,
  ForestProtocolMarketplaceABI,
  getForestContractAddress,
  Marketplace,
} from "@forestprotocols/sdk";
import { Provider } from "./provider";
import { config } from "./config";
import { createPublicClient, http, parseEventLogs } from "viem";
import { LocalStorage } from "./database/LocalStorage";
import { logger } from "./logger";
import { privateKeyToAccount } from "viem/accounts";
import * as ansis from "ansis";

async function sleep(ms: number) {
  return await new Promise((res) => setTimeout(res, ms));
}

class Program {
  rpcClient = createPublicClient({
    chain: config.CHAIN,
    transport: http(`http://${config.RPC_HOST}`),
  });
  providerAccount = privateKeyToAccount(
    config.PROVIDER_WALLET_PRIVATE_KEY as `0x${string}`
  );
  marketplace = Marketplace.createWithClient(
    this.rpcClient,
    this.providerAccount
  );
  provider = new Provider();
  contractAddress = getForestContractAddress(config.CHAIN);

  constructor() {}

  // A shorthand for Local Storage instance
  get localStorage() {
    return LocalStorage.instance;
  }

  async processAgreementCreated(agreement: Agreement) {
    try {
      await this.provider.create(agreement);
    } catch (err: any) {
      logger.error(err.stack);
    }
  }

  async processAgreementClosed(agreement: Agreement) {
    try {
      await this.provider.delete(agreement);
    } catch (err: any) {
      logger.error(err.stack);
    }
  }

  async main() {
    await this.init();

    logger.info("Started to listening blockchain events");
    let currentBlockNumber = await this.findStartBlock();

    while (true) {
      await sleep(100);
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

        const receipt = await this.rpcClient.getTransactionReceipt({
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
            event.args.providerOwnerAddr == this.providerAccount.address
          ) {
            const agreement = await this.marketplace.getAgreement(
              Number(event.args.id)
            );
            await this.processAgreementCreated(agreement);
            await this.localStorage.saveTxAsProcessed(
              event.blockNumber,
              event.transactionHash
            );
          } else if (
            event.eventName === "AgreementClosed" &&
            event.args.providerOwnerAddr == this.providerAccount.address
          ) {
            const agreement = await this.marketplace.getAgreement(
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
    const agreements = await this.marketplace.getAllProviderAgreements(
      this.providerAccount.address,
      { status: AgreementStatus.Active }
    );
    const closingRequests: Promise<any>[] = [];

    for (const agreement of agreements) {
      const balance = await this.marketplace.getAgreementBalance(agreement.id);

      // If balance of the agreement is ran out of,
      if (balance <= 0n) {
        // Queue closeAgreement call to the promise list.
        closingRequests.push(
          this.marketplace.closeAgreement(agreement.id).catch((err) => {
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

    return latestProcessedBlock || (await this.rpcClient.getBlockNumber());
  }

  async getBlock(num: bigint) {
    try {
      return await this.rpcClient.getBlock({
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
