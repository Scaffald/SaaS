import type { Duplex } from "node:stream";

declare module "pg-copy-streams" {
  export function from(sql: string): Duplex;
  export function to(sql: string): Duplex;
}


