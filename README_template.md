# Product Category: `{Product Category Name}`

## Description

{Explanation about what this Product Category for}

## Basic Info

| Name                      | Value                                           |
| ------------------------- | ----------------------------------------------- |
| PC Smart Contract Address | `{Smart Contract Address}`                      |
| PC Registration Date      | `{Date of registration}`                        |
| PC Owner Website          | `{Website address link}`                        |
| PC Owner Contact Info     | `{Contact info (e-mail, social accounts etc.)}` |
| PC Owner Wallet Address   | `{Public Wallet Address}`                       |
| PC Owner Details File CID | `{CID}`                                         |

## Configuration Parameters

This Product Category has the following configuration. Some of them are enforced by the logic of the on-chain smart contract an the others are Validator code.

| Config                                   | Value                      | Enforced by    |
| ---------------------------------------- | -------------------------- | -------------- |
| Maximum Number of Validators             | `{Number}`                 | Smart Contract |
| Maximum Number of Providers              | `{Number}`                 | Smart Contract |
| Minimum Collateral                       | `{Amount of FOREST Token}` | Smart Contract |
| Validator Registration Fee               | `{Amount of FOREST Token}` | Smart Contract |
| Provider Registration Fee                | `{Amount of FOREST Token}` | Smart Contract |
| Offer Registration Fee                   | `{Amount of FOREST Token}` | Smart Contract |
| Update Delay for Terms Change            | `{Block Count}`            | Smart Contract |
| Validators Share of Emissions            | `{+Percentage}`            | Smart Contract |
| Providers Share of Emissions             | `{+Percentage}`            | Smart Contract |
| PC Owner Share of Emissions              | `{+Percentage}`            | Smart Contract |
| CID of the Details File                  | `{CID}`                    | Smart Contract |
| Performance Optimization Weight          | `{*Percentage}`            | Validator      |
| Price Optimization Weight                | `{*Percentage}`            | Validator      |
| Price-to-Performance Optimization Weight | `{*Percentage}`            | Validator      |
| Popularity Optimization Weight           | `{*Percentage}`            | Validator      |

> Sum of the percentages mentioned with `+` sign must equal to 100. Same thing applies for `*` too.

You can always double-check the on-chain values e.g. [here](https://sepolia-optimism.etherscan.io/address/`{Smart Contract Address}`#readContract)

## Tests and Quality Thresholds [WIP]

The Validators are performing a number of tests on Resources to ensure quality across the board. Below is a list of checked Benchmarks:

| Name          | Units     | Threshold Value | Min / Max   |
| ------------- | --------- | --------------- | ----------- |
| {Test Name 1} | `{Units}` | `{Value}`       | {Min / Max} |
| {Test Name 2} | `{Units}` | `{Value}`       | {Min / Max} |
| {Test Name 3} | `{Units}` | `{Value}`       | {Min / Max} |

More in-depth descriptions of the Tests:

| Name          | Description             |
| ------------- | ----------------------- |
| {Test Name 1} | {Long form description} |
| {Test Name 2} | {Long form description} |
| {Test Name 3} | {Long form description} |

## Become a Provider

### Step-by-step instructions

In order to start providing services for this Product Category you need to follow the steps below. But before, you need to install Forest Protocols CLI by following these instructions: [link](https://github.com/Forest-Protocols/forest-cli)

#### 1. Register in the Protocol

> You can skip this part if you are already registered in the Protocol as a Provider.

1. Create a JSON detail file in the following schema and save it somewhere:

```json
{
  "name": "<Name, will be visible to users>",
  "description": "<[Optional] Description>",
  "homepage": "<[Optional] Homepage address>"
}
```

2. Create a set of pub / priv keys using an EVM-compatible wallet.
3. Take that account's private key and save it to a file.
4. Put the JSON file and that private key file into the same folder.
5. Open up a terminal in that folder.
   > If you are planning to use different accounts for billing and operating, you need to pass additional flags: `--billing <address>` and `--operator <address>`. If you don't need that, just skip those flags.
6. Run the following command:
   ```sh
    forest register provider \
        --details <JSON file name> \
        --account <private key file>
   ```
7. Save your detail file somewhere. Later you'll place this file into `data/details` folder.

#### 2. Register in this Product Category

Use the following command to register in this Product Category:

```shell
forest provider register-in \
  --account <private key file path OR private key itself of the Provider account> \
  {Product Category Smart Contract Address} \
  {Minimum Collateral}
```

#### 3. Register Offers

Now that you are registered in the Protocol and this Product Category, the next step is to register your Offers.

First, create files that contain details for each Offer you plan to register. You have two options for these detail files:

- Create a plain text or Markdown file with human-readable Offer details. This approach does not allow parameterization of Offers. Also these details won't be visible in the CLI.
- Create a JSON file following the schema below. This approach makes Offer details visible and filterable in the CLI and marketplace while also allowing parameterization of resource creation.

##### 3.1 JSON Schemed Offer Details

**If you are not using this option, you may skip this section.**

Create a JSON file following the type definitions below:

> These are pseudo-type definitions to illustrate the JSON schema.

```typescript
type Numeric_Offer_Parameter = {
  value: number;
  unit: string;
};

type Single_Offer_Parameter = string | boolean | Numeric_Offer_Parameter;

type Multiple_Offer_Parameter = Single_Offer_Parameter[];

type Offer_Parameter = Single_Offer_Parameter | Multiple_Offer_Parameter;

type JSON_Offer_Details = {
  name: string; // Descriptive name
  deploymentParams?: any; // Deployment parameters for resource creation in the Provider daemon.

  // Visible parameters to users
  params: {
    [visible_parameter_name: string]: Offer_Parameter;
  };
};
```

An example JSON file based on these type definitions:

```json
{
  "name": "SQLite Cheap Small Disk",
  "deploymentParams": {
    "maxRAM": "512",
    "diskSize": "1024"
  },
  "params": {
    "RAM": {
      "value": 512,
      "unit": "MB"
    },
    "Disk Size": {
      "value": 1,
      "unit": "GB"
    },
    "Disk Type": "SSD",
    "Features": ["Query over Pipe", "Super cheap"]
  }
}
```

After creating the Offer details file, save it in an accessible location. Now register your Offer using the following command:

```shell
forest provider register-offer \
     {Product Category Smart Contract Address} \
    --account <private key file path OR private key itself of the PROV account> \
    --details <path of the details file> \
    --fee 1 \
    --stock 100
```

- `--fee`: The per-second price of the Offer in USDC. 1 unit of fee = 2.60 USDC per month.
- `--stock`: The maximum number of Agreements that can exist simultaneously for this Offer.

#### 4. Fork and Implement This Repository

Fork this repository, then clone it locally.

Open the `src/product-category/provider.ts` file and implement all of the following methods;

| Method                                                                                          | Description                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `create(agreement: Agreement, offer: DetailedOffer): Promise<*Details>`                         | This method is triggered when a user enters an Agreement. It provisions the actual resource based on the Agreement and Offer, returning resource details. If provisioning takes time, it returns a `Deploying` status. The daemon process then tracks the deployment using `getDetails` until the resource reaches `Running` status. |
| `getDetails(agreement: Agreement, offer: DetailedOffer, resource: Resource): Promise<*Details>` | Called periodically if the resource is not in `Running` status after `create()`. It retrieves current details about the resource from the actual source. The daemon process saves the returned details to the database after each call.                                                                                              |
| `delete(agreement: Agreement, offer: DetailedOffer, resource: Resource): Promise<void>`         | Called when a user closes an Agreement, ensuring the actual resource is deleted.                                                                                                                                                                                                                                                     |
| `{Method definition}`                                                                           | `{Purpose of the method and explanation}`                                                                                                                                                                                                                                                                                            |

Once implementation is complete, place your Provider and Offer detail files into the `data/details` folder.

> You can create subdirectories to better organize detail files.

Now, create a `.env` file based on the example (`.env.example`) and configure the necessary variables:

| Name           | Possible Values                                              | Default     | Description                                           |
| -------------- | ------------------------------------------------------------ | ----------- | ----------------------------------------------------- |
| `NODE_ENV`     | `dev`, `production`                                          | `dev`       | The environment mode.                                 |
| `RPC_URL`      | An RPC host without the protocol part (`http://` or `ws://`) | `undefined` | The RPC host used to communicate with the blockchain. |
| `CHAIN`        | `anvil`, `optimism`, `optimism-sepolia`                      | `anvil`     | Specifies the blockchain to use.                      |
| `DATABASE_URL` | PostgreSQL connection string                                 | `undefined` | The database connection string for the daemon.        |

Then rename `data/providers.example.jsonc` to `data/providers.json`, clear the comments inside of it and fill the `main` tag with your private keys.

As the last step, don't forget to put detail files of the Provider, Product Category and Offers into `data/details` folder.

#### 5. Run the Provider Daemon

You can run the daemon process with or without a container.

##### 5.1 Without a Container

> Ensure you have a running PostgreSQL database before proceeding.

Run the following commands in the daemon directory:

```sh
npm i
npm run build
npm run db:migrate
npm run start
```

##### 5.2 With a Container

If you prefer to use containers, build the container image and run it with Docker Compose. First, update the `DATABASE_URL` host to point to the database container:

```dotenv
...
# Update the host to "db"
# Database credentials are defined in "docker-compose.yaml";
# update the compose file if you change them.
DATABASE_URL=postgresql://postgres:postgres@db:5432/postgres

# If using a local Foundry blockchain, update the RPC_HOST variable.
# RPC_HOST=172.17.0.1:8545
...
```

Now run the compose file:

```shell
docker compose up # Add "-d" to run in detached mode
```

That's all folks!

## Become a Validator [WIP]

#### Step-by-step instructions

In order to start providing validation services for this Product Category you need to:

1. Run your Validator Node based on the code from this repository. Detailed instructions here: [link](https://github.com/this_repo/validator/README.md)
2. Install a Forest Protocols CLI by following these instructions: [link](https://github.com/forest-protocols/cli....)
3. Using the CLI register in the Protocol as a Validator:
   a. `command 1`
   b. `command 2`
4. Using the CLI register in our Product Category:
   a. `command 1`
   b. `command 2`
