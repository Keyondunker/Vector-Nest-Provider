/**
 * Parses a database connection string into an object
 */
export function parseDatabaseConnectionString(connectionString: string) {
  const regex =
    /^(?<protocol>[a-z]+):\/\/(?<username>[^:]+):(?<password>[^@]+)@(?<host>[^:\/]+)(?::(?<port>\d+))?(?:\/(?<database>[^?]+))?(?:\?(?<parameters>.*))?$/;

  const match = connectionString.match(regex);
  if (!match)
    throw new Error(`Unknown connection string format: ${connectionString}`);

  return {
    Connection_String: connectionString,
    Username: match.groups?.username,
    Password: match.groups?.password,
    Port: match.groups?.port,
    Database_Name: match.groups?.database,
    Hostname: match.groups?.host,
  };
}
