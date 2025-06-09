import { ChildProcess, spawn } from "child_process";
import path from "path";
import kill from "tree-kill";
import type { RunningProcesses, SelectedRepository } from "../../dto/types";
import { getRepositoryPath } from "../../utils/get-repository-path.ts";
import { broadcastProcesses } from "../ws.ts";

export const runningProcesses: RunningProcesses = {};

export async function startHost(startConfig: SelectedRepository[]) {
  const repoPath = path.resolve(getRepositoryPath(), "newclick-host-ui");

  if (runningProcesses["newclick-host-ui"]?.pid) {
    kill(runningProcesses["newclick-host-ui"].pid, "SIGKILL");
  }

  let child: ChildProcess;

  const isOnlyHost =
    Object.keys(startConfig).length === 1 &&
    startConfig[0].repoName === "newclick-host-ui";

  if (isOnlyHost) {
    child = spawn("yarn", ["start"], {
      cwd: repoPath,
      stdio: "ignore",
      shell: true,
    });
  } else {
    const preparedConfig: SelectedRepository[] = startConfig
      .filter((repo) => repo.repoName !== "newclick-host-ui")
      .map((repo) => {
        const cleanName = repo.repoName
          .replace(/^newclick-/, "")
          .replace(/-ui$/, "");
        return {
          ...repo,
          repoName: cleanName,
        };
      });

    const applications: Record<string, { host: string }> = {};

    for (const repo of preparedConfig) {
      applications[repo.repoName] = {
        host: `http://localhost:${repo.clientPort}`,
      };
    }

    const nodeConfig = {
      client: {
        applications,
      },
    };

    child = spawn("yarn", ["start"], {
      cwd: repoPath,
      stdio: "ignore",
      shell: true,
      env: {
        ...process.env,
        NODE_CONFIG: JSON.stringify(nodeConfig),
      },
    });
  }

  if (child.pid) {
    runningProcesses["newclick-host-ui"] = {
      repoName: "newclick-host-ui",
      pid: child.pid,
      ports: { clientServerPort: 9090, serverPort: 3001 },
    };
  }

  child.on("exit", () => {
    delete runningProcesses["newclick-host-ui"];
  });

  // костыль для вызова ws сообщения после того как завершаться асинхронные вызовы
  setTimeout(() => {
    broadcastProcesses();
  }, 300);
}

export function startRepo(repo: SelectedRepository): Promise<void> {
  return new Promise((resolve) => {
    const repoPath = path.resolve(getRepositoryPath(), repo.repoName);

    const child = spawn("yarn", ["start"], {
      cwd: repoPath,
      stdio: "ignore",
      shell: true,
      env: {
        ...process.env,
        ARUI_SCRIPTS_CONFIG: JSON.stringify({
          serverPort: repo.serverPort,
          clientServerPort: repo.clientPort,
        }),
        NODE_CONFIG: JSON.stringify({
          server: {
            port: repo.serverPort,
          },
        }),
        API_GATEWAY_PATH: `http://localhost:${repo.clientPort}`,
      },
    });

    if (child.pid) {
      runningProcesses[repo.repoName] = {
        repoName: repo.repoName,
        pid: child.pid,
        ports: {
          serverPort: repo.serverPort,
          clientServerPort: repo.clientPort,
        },
      };
    }

    child.on("exit", () => {
      delete runningProcesses[repo.repoName];
    });

    resolve();

    broadcastProcesses();
  });
}

export function stopRepo(repoName: string) {
  const process = runningProcesses[repoName];
  if (process?.pid) {
    kill(process.pid, "SIGKILL", (err) => {
      if (err) {
        console.error(`Ошибка при остановке ${repoName}:`, err);

        return;
      }

      console.log(`Процесс ${repoName} остановлен`);

      delete runningProcesses[repoName];

      broadcastProcesses();
    });
  }
}

export function stopAllRepos() {
  for (const [repoName, process] of Object.entries(runningProcesses)) {
    if (process.pid) {
      kill(process.pid, "SIGKILL", (err) => {
        if (err) {
          console.error(`Ошибка при остановке ${repoName}:`, err);
        } else {
          console.log(`Процесс ${repoName} остановлен`);
        }
      });
    }
  }

  // костыль для вызова ws сообщения после того как завершаться асинхронные вызовы остановки всех процессов
  setTimeout(() => {
    broadcastProcesses();
  }, 300);
}
