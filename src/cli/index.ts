#!/usr/bin/env node

import { greet } from "./commands/greet";

/**
 * === В РАЗРАБОТКЕ ===
 */

const args = process.argv.slice(2);

const [command, ...rest] = args;
switch (command) {
  case "greet": {
    const nameArg = rest.find((arg) => arg.startsWith("--name="));
    const name = nameArg ? nameArg.split("=")[1] : "ooo";
    greet(name);
    break;
  }

  case "help":
  default:
    console.log(`
      aaa
    `);
}
