import { spawnSync } from "node:child_process";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
	createBashToolDefinition,
	createLocalBashOperations,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

function findXonsh(): string {
	const lookup = process.platform === "win32" ? "where" : "which";
	const result = spawnSync(lookup, ["xonsh"], { encoding: "utf8" });
	const path = result.stdout?.trim().split(/\r?\n/, 1)[0];

	if (result.status !== 0 || !path) {
		throw new Error("xonsh was not found on PATH");
	}

	return path;
}

export default function (pi: ExtensionAPI) {
	const cwd = process.cwd();
	const xonshTool = createBashToolDefinition(cwd, {
		// createLocalBashOperations provides Pi's standard streaming, timeout,
		// cancellation, process-tree cleanup, and environment handling. The
		// explicit executable is still invoked with xonsh's `-c` interface.
		operations: createLocalBashOperations({ shellPath: findXonsh() }),
	});

	pi.registerTool({
		...xonshTool,
		name: "xonsh",
		label: "xonsh",
		description:
			"Execute a xonsh command in the current working directory. Prefer xonsh over bash when Python syntax, Python libraries, or shell/Python mixing is useful. Use bash for Bash-specific syntax, POSIX shell compatibility, and .sh scripts. Returns stdout and stderr. Output is truncated to the last 2000 lines or 50KB (whichever is hit first). If truncated, full output is saved to a temp file. Optionally provide a timeout in seconds.",
		promptSnippet: "Execute xonsh commands with shell and Python syntax; prefer it when Python is useful",
		promptGuidelines: [
			"Prefer xonsh over bash when Python syntax, Python libraries, or shell/Python mixing is useful.",
			"Prefer bash for Bash-specific syntax, POSIX shell compatibility, and .sh scripts.",
		],
		parameters: Type.Object({
			command: Type.String({ description: "Xonsh command to execute" }),
			timeout: Type.Optional(
				Type.Number({
					description: "Timeout in seconds (optional, no default timeout).",
				}),
			),
		}),
	});
}
