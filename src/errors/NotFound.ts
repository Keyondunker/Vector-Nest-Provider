export class NotFound extends Error {
  constructor(entity: any) {
    super(`${entity} not found`);
  }
}
