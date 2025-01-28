import { PipeError, PipeResponseCode } from "@forest-protocols/sdk";

export class PipeErrorNotFound extends PipeError {
  constructor(entity: any) {
    super(PipeResponseCode.NOT_FOUND, {
      message: `${entity} not found`,
    });
  }
}
