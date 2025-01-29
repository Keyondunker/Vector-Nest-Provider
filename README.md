# Vector Storage

## Description

This product category aims to create a competition between different Vector Database solutions such as Milvus, pgvector, Chroma etc.

## Basic Info

|                               |                                                                 |
| ----------------------------- | --------------------------------------------------------------- |
| Software Stack / Service Type | `Vector Storage`                                                |
| Software Version (optional)   | `N/A`                                                           |
| PC Smart Contract Address     | `0x61b9D923744013c28DAd1F7855c812A676D9Ba7A`                    |
| PC Registration Date          | `29 January 2025`                                               |
| PC Owner Website              | `N/A`                                                           |
| PC Owner Contact Info         | `N/A`                                                           |
| PC Owner Wallet Address       | `0x765765F597222b524F0412a143094E118ddAB5Fd`                    |
| PC Owner Details File CID     | `bagaaierageowudmpux2tmq4occ7m3zg5vpwjxpbfbkkwbrgvzwrquep5fzmq` |

## Offer Specification

Each Offer in this Product Category must include the following properties:
|Name|Units|Description|
|-|-|-|
|CPU|`Cores`|CPU core count|
|RAM|`GB`|Total usable RAM amount in GB|
|Disk Type|`["SSD", "HDD", "M2"]`|Disk type|
|Disk Size|`GB`|Total usable disk size|
|Virtualization|`["VM", "Container"]`|Virtualization technology|
|CPU Architecture|`["x86", "ARM"]`|CPU architecture|
|Isolation|`["Shared", "Dedicated"]`|CPU core count|

## Configuration Parameters [TODO]

This Product Category has the following configuration. These are enforced by the logic of the on-chain smart contract.
|Config|Value|Enforced by|  
|----------------|-------------------------------|---|
|Maximum Number of Validators|`2`|Smart Contract|
|Maximum Number of Providers|`5`|Smart Contract|
|Validator Registration Fee|`1` FOREST tokens|Smart Contract|
|Provider Registration Fee|`2` FOREST tokens|Smart Contract|
|Offer Registration Fee|`3` FOREST tokens|Smart Contract|
|Update Delay for Terms Change|`300` blocks|Smart Contract|
|Validators Share of Emissions|`55%`|Smart Contract|
|Providers Share of Emissions|`35%`|Smart Contract|
|PC Owner Share of Emissions|`10%`|Smart Contract|
|CID of the Details File|`bagaaieralyeoeb4om3buogatsa22vu45ydaa2ahm7a7bfv57twzvibbe22qq`|Smart Contract|
|Performance Optimization Weight |`60%`|Validator|
|Price Optimization Weight|`10%`|Validator|
|Price-to-Performance Optimization Weight|`20%`|Validator|
|Popularity Optimization Weight|`10%`|Validator|

You can always double-check the on-chain values e.g. [here](https://sepolia-optimism.etherscan.io/address/0x61b9D923744013c28DAd1F7855c812A676D9Ba7A#readContract)

## Tests and Quality Thresholds [TODO]

The Validators are performing a number of tests on Resources to ensure quality across the board. Below is a list of checked Benchmarks:
|Name|Units| Threshold Value| Min / Max|  
|-|-|-|-|
|{Test Name 1}|`{Units}`|`{Value}`|{Min / Max}|
|{Test Name 2}|`{Units}`|`{Value}`|{Min / Max}|
|{Test Name 3}|`{Units}`|`{Value}`|{Min / Max}|
...

More in-depth descriptions of the Tests:
|Name|Description|  
|-|-|
|{Test Name 1}|{Long form description}|
|{Test Name 2}|{Long form description}|
|{Test Name 3}|{Long form description}|
...

## Become a Provider

#### Step-by-step instructions

In order to start providing services for this Product Category you need to:

1. Create a Provider class that inherits from `BaseVectorDBProvider` and implement all of the abstract methods (take a look at the diagram below for more information).
2. Enable that Provider class by adding it inside the `providers` object in `src/index.ts`:

src/index.ts

```typescript
class Program {
  providers = {
    main: new VectorDBProvider(), // If your provider class defined in another name, update here
  };
....
```

3. Install Forest Protocols CLI by following these instructions: [link](https://github.com/Forest-Protocols/forest-cli)
4. Register in the protocol as a provider:
   - `TODO: Write related CLI commands`
5. Register in this product category as a provider:
   - `TODO: Write related CLI commands`
6. Register your offers for this provider:
   - `TODO: Write related CLI commands`
7. Put the provider details that you've got from registration process to `data/providers.json`. You can refer to `data/providers.example.jsonc` file.
8. Put the offer details inside `data/offers` directory. If you want you can create sub directories as well. You can refer to `data/offers/offer.example.jsonc` file.
9. Edit `.env` file.
10. Run the Provider daemon.

#### Provider Class Hierarchy

Your Provider class must inherit from this Product Category's base Provider class, `BaseVectorDBProvider`. This class design unifies the way all Providers, Users and Validators communicate.

```mermaid
classDiagram
	class YourProvider {

	}

	class BaseVectorDBProvider {
		<<abstract class>>
		+search(agreement Agreement, resource Resource, collection string, vectorField string, embeddings any[], options(optional) { limit(optional) number, metricType(optional) MetricType })* Promise~any[]~
		+insertData(agreement Agreement, resource Resource, collection string, data { [field string] any })* Promise~void~
		+deleteData(agreement Agreement, resource Resource, collection string, conditions { [field string] ConditionValue })* Promise~void~
		+createCollection(agreement Agreement, resource Resource, name string, fields Field[])* Promise~void~
		+deleteCollection(agreement Agreement, resource Resource, name string)* Promise~void~
	}

	class AbstractProvider~DetailsType=ResourceDetails~ {
		<<abstract class>>
		account(optional) Account
		pipe(optional) XMTPPipe
		marketplace Marketplace

		+init(providerTag string) void
		+create(agreement Agreement, offer OfferDetails)* Promise~DetailsType~
		+getDetails(agreement Agreement, resource Resource)* Promise~DetailsType~
		+delete(agreement Agreement, resource Resource)* Promise~DetailsType~
	}

	class ResourceDetails {
		<<type or interface>>
		status DeploymentStatus
		name(optional) string
		[fieldName string] any
	}

	class VectorDBDetails {
		<<type or interface>>
		_credentials any;
	}

	BaseVectorDBProvider <|-- AbstractProvider~VectorDBDetails~ inherits
	YourProvider <|-- BaseVectorDBProvider inherits and implements abstract methods
	VectorDBDetails <|-- ResourceDetails extends
```

## Become a Validator [TODO]

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
