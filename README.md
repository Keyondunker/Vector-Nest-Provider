# Base Provider Template

This repository contains the base Provider Template for the people wants to create their own Product Categories in Forest Protocols.

## Quickstart

### 1. Fork and edit the repository

Fork this repository and clone it locally. Open the `src/product-category/base-provider.ts` file. The first step is to define the details each resource will have. At the beginning of the file, there is a type definition named `ExampleProductDetails`, which specifies the attributes stored for each resource in this Product Category.

For instance, if your product is a database or API service, it will likely include connection strings, API keys, or endpoints.

Rename the type to match your product and edit the fields accordingly. An example type definition for the SQLite Product Category is shown below:

```typescript
export type SQLiteDatabaseDetails = ResourceDetails & {
  // Fields should use PascalCase with underscores for spaces
  Size_MB: number; // Database file size in MB

  // Fields starting with an underscore are for internal use only and won't be seen by the users.
  _fileName: string; // SQLite database file name
};
```

Once you have defined the details type, update the `BaseExampleProductProvider` abstract class to define the product's functionality. Providers within this Product Category must implement all functions in this class. Rename the class to reflect your product. For example:

```typescript
export abstract class BaseSQLiteDatabaseProvider extends AbstractProvider<SQLiteDatabaseDetails> {
  /**
   * Defines the product's functionality. All functions below
   * must be implemented by providers in this Product Category.
   */

  /**
   * Executes the given SQL query on the database.
   *
   * @param resource Resource information stored in the database.
   * @param query SQL query to execute.
   */
  abstract sqlQuery(resource: Resource, query: string): Promise<any[]>;
}
```

After defining your product's functionalities (e.g., `sqlQuery`), you need to create "Pipe" endpoints to allow resource owners to invoke these functions.

> "**_Pipe_**" is a simple abstraction layer for HTTP-like request-response communication between participants. The current Pipe implementation is built on [XMTP](https://xmtp.org/) for fully decentralized communication within the Protocol.

Define these endpoints in the `init()` method. For example:

```typescript
async init(providerTag: string) {
    // Call the base class' `init` function
    await super.init(providerTag);

    // TODO: Implement your Pipe endpoints

    /**
     * @param 1:
     *  Pipe endpoints can be defined for different methods such as POST, PUT, DELETE, etc.
     *  You can follow the traditional REST pattern to determine which method to use.
     * @param 2:
     *  Path of the endpoint. Clients/users send their requests to this endpoint
     *  to invoke the `sqlQuery` method.
     * @param 3:
     *  Actual handler function that processes the request.
     */
    this.route(PipeMethod.GET, "/query", async (req) => {
        /**
         * In route handler functions, all errors are automatically handled
         * with an "Internal server error" response. If the thrown error
         * is an instance of `PipeError`, the response will use values provided
         * by this error.
         */

        /**
         * Parameters can be extracted from `req.body` or `req.params`.
         * Here, we use `req.body`.
         *
         * We validate the body params using [Zod](https://zod.dev/)
         * to ensure they conform to the expected schema.
         */
        const body = validateBodyOrParams(req.body, z.object({
            id: z.number(), // Resource ID
            pc: addressSchema, // Product Category address
            query: z.string(), // SQL query
        }));

        /**
         * Retrieve the resource from the daemon's database using `getResource`.
         * If the resource is not found, an error is thrown automatically,
         * and the request returns a "Not Found" error.
         *
         * This method also checks resource ownership. If the requester is
         * not the resource owner, the resource will not be found in the database.
         * Even if the return value is not used, calling this method ensures
         * authorization.
         */
        const { resource } = await this.getResource(
          body.id,
          body.pc as Address,
          req.requester
        );

        // Execute the SQL query with the provided arguments
        const result = await this.sqlQuery(resource, body.query);

        // Return the response
        return {
          code: PipeResponseCode.OK,
          body: result,
        };
    });
}
```

Once you are done with defining the abstract class, navigate to `src/product-category/provider.ts` and add a boilerplate implementation for your base class. For example:

```typescript
/**
 * The main class that implements provider specific actions.
 * @responsible Provider
 */
export class MainProviderImplementation extends BaseExampleProductProvider {
  // Other abstract functions...

  async sqlQuery(resource: Resource, query: string): Promise<any[]> {
    /**
     * TODO: Implement how to execute an SQL query within the database.
     * This function should process the query and return results accordingly.
     */
    throw new Error("Method not implemented.");
  }
}
```

### 2. Registering in the Protocol

#### 2.1 Register as a Product Category Owner

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
    forest register pco \
        --details <JSON file name> \
        --account <private key file>
   ```
7. Save your detail file somewhere. Later you'll place this file into `data/details` folder.

#### 2.2 Register a New Product Category

Create a file with detailed information about this Product Category. The file can be in plain text, Markdown or any other format that you want. Save it at `data/details/[file name]` in your forked Provider Template repository.

```sh
forest product-category create \
  --details <details file path> \
  --account <private key file path OR private key itself of the PCO account> \
  --max-validator 10 \
  --max-provider 10 \
  --min-collateral 10 \
  --validator-register-fee 5 \
  --provider-register-fee 3 \
  --offer-register-fee 2 \
  --term-update-delay 400 \
  --provider-share 45 \
  --validator-share 45 \
  --pco-share 10
```

#### Explanation of Command Flags

| Flag                       | Description                                                      |
| -------------------------- | ---------------------------------------------------------------- |
| `--max-validator`          | Maximum number of Validators that can be registered.             |
| `--max-provider`           | Maximum number of Providers that can be registered.              |
| `--min-collateral`         | Minimum FOREST token collateral required for registration.       |
| `--validator-register-fee` | Registration fee (FOREST token) for Validators.                  |
| `--provider-register-fee`  | Registration fee (FOREST token) for Providers.                   |
| `--offer-register-fee`     | Fee for Providers to register a new Offer.                       |
| `--term-update-delay`      | Minimum block count before Providers can close agreements.       |
| `--provider-share`         | Percentage of emissions allocated to Providers.                  |
| `--validator-share`        | Percentage of emissions allocated to Validators.                 |
| `--pco-share`              | Percentage of emissions allocated to the Product Category Owner. |

### Final Steps

Now rename the file `README_template.md` in the root of the repository to `README.md`, then fill out the sections mentioned with `{...}` in the whole file.

Congratulations! You have registered in the Protocol and created your Product Category. Now, publish your Provider Template and inform potential Providers and Validators on how to participate in your Product Category.
