import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { parseArgs } from "node:util";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import {
  queryLocalDatabase,
  disconnectLocalDatabase,
} from "../../src/infrastructure/database/index.js";
import { authRepository } from "../../src/common/auth/repositories/auth.repository.js";
import { hashPassword } from "../../src/common/auth/services/password.service.js";
import { validateUsername, validatePassword } from '../../src/common/auth/rules/credentials.js';

async function passwordPrompt(prompt) {
  if (!process.stdin.isTTY)
    throw new Error(
      "Run account creation in an interactive terminal. Passwords are never accepted as arguments.",
    );
  process.stdout.write(prompt);
  const hiddenOutput = new Writable({
    write(_chunk, _encoding, done) {
      done();
    },
  });
  const input = createInterface({
    input: process.stdin,
    output: hiddenOutput,
    terminal: true,
  });
  try {
    return await input.question("");
  } finally {
    input.close();
    process.stdout.write("\n");
  }
}

try {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      username: { type: "string" },
      name: { type: "string" },
      channel: { type: "string", default: "admin" },
      roles: { type: "string", default: "" },
      permissions: { type: "string", default: "" },
    },
  });
  if (
    positionals.length !== 1 ||
    !["init", "create"].includes(positionals[0])
  ) {
    throw new Error(
      "Usage: npm run auth:db:init | npm run auth:user:create -- --username NAME --name DISPLAY --channel admin",
    );
  }
  if (positionals[0] === "init") {
    const sql = await readFile(
      new URL("../database/sql/local-auth-schema.sql", import.meta.url),
      "utf8",
    );
    try {
      await queryLocalDatabase(sql);
    } catch {
      throw new Error(
        "Cannot initialize the local auth schema. Check LOCAL_DB_* and the Windows account SQL permissions.",
      );
    }
    console.log("Local auth schema is ready. No accounts were created.");
  } else {
    const username = validateUsername(values.username),
      displayName = values.name?.trim();
    if (
      !username ||
      !displayName ||
      displayName.length > 150 ||
      values.channel !== "admin"
    ) {
      throw new Error(
        "A valid username, display name and admin channel are required. Students use DUT SSO; provision specialists through auth organization.",
      );
    }
    const list = (value) => [
      ...new Set(
        value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ];
    const roles = list(values.roles),
      permissions = list(values.permissions);
    if(roles.length||permissions.length)throw new Error('Provision accounts through auth organization roles and taskIds; direct permission grants are disabled.');
    if (
      roles.length > 16 ||
      permissions.length > 32 ||
      ![...roles, ...permissions].every((value) =>
        /^[a-z][a-z0-9:-]{0,99}$/.test(value),
      )
    ) {
      throw new Error(
        "Invalid role or permission names. Use explicit lowercase names separated by commas.",
      );
    }
    const password = await passwordPrompt(
      "Password (9–128 characters, letters and numbers, hidden): ",
    );
    if (password !== (await passwordPrompt("Confirm password (hidden): ")))
      throw new Error("Passwords do not match.");
    validatePassword(password, username);
    const passwordHash = await hashPassword(password);
    await authRepository.createLocalAccount({
      id: randomUUID(),
      username,
      displayName,
      channel: values.channel,
      passwordHash,
      roles,
      permissions,
    });
    console.log("Local account created. No SSO capability was granted.");
  }
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Local account operation failed.",
  );
  process.exitCode = 1;
} finally {
  await disconnectLocalDatabase();
}
