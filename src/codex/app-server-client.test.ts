import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { beforeEach, describe, expect, it, vi } from "vitest";

const spawnMock = vi.hoisted(() => vi.fn());

vi.mock("node:child_process", () => ({
  spawn: spawnMock,
}));

vi.mock("./command-resolver.js", () => ({
  resolveCodexCommand: () => "codex.exe",
}));

import { CodexAppServerClient } from "./app-server-client.js";

class FakeAppServerProcess extends EventEmitter {
  stdin = new PassThrough();
  stdout = new PassThrough();
  stderr = new PassThrough();
}

describe("CodexAppServerClient protocol", () => {
  beforeEach(() => {
    spawnMock.mockReset();
  });

  it("uses the stable handshake and canonical safety settings", async () => {
    const process = new FakeAppServerProcess();
    const messages: Array<Record<string, unknown>> = [];
    let inputBuffer = "";

    process.stdin.on("data", (chunk: Buffer) => {
      inputBuffer += chunk.toString("utf8");
      const lines = inputBuffer.split("\n");
      inputBuffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line) continue;
        const message = JSON.parse(line) as Record<string, unknown>;
        messages.push(message);

        if (message.method === "initialize") {
          process.stdout.write(`${JSON.stringify({ id: message.id, result: {} })}\n`);
        }

        if (message.method === "thread/start") {
          process.stdout.write(
            `${JSON.stringify({
              id: message.id,
              result: {
                thread: {
                  id: "thread-1",
                  cwd: "C:\\Projects\\bridge",
                  preview: "",
                  source: "appServer",
                  updatedAt: 0,
                  createdAt: 0,
                  modelProvider: "openai",
                  path: null,
                  name: null,
                  status: { type: "idle" },
                  turns: [],
                },
              },
            })}\n`,
          );
        }
      }
    });

    spawnMock.mockReturnValue(process);

    const client = new CodexAppServerClient();
    const thread = await client.startThread("C:\\Projects\\bridge");

    expect(thread.id).toBe("thread-1");
    expect(messages).toEqual([
      {
        id: 1,
        method: "initialize",
        params: {
          clientInfo: {
            name: "codex_openclaw_bridge",
            title: "Codex OpenClaw Bridge",
            version: "0.1.0",
          },
        },
      },
      { method: "initialized", params: {} },
      {
        id: 2,
        method: "thread/start",
        params: {
          cwd: "C:\\Projects\\bridge",
          approvalPolicy: "onRequest",
          sandbox: "workspaceWrite",
          modelProvider: "openai",
        },
      },
    ]);

    for (const message of messages) {
      expect(message).not.toHaveProperty("jsonrpc");
    }
  });
});
