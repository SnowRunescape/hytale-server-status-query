declare module "hytale-server-status-query" {
  export interface ServerResponse {
    online: boolean;
    ping: number;
  }

  export class HytaleQuicClient {
    constructor(host: string, port?: number, timeout?: number);

    checkServerStatus(): Promise<ServerResponse>;
  }
}
