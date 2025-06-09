import React, { useCallback, useEffect, useState } from "react";
import { Typography } from "@alfalab/core-components/typography";
import { CheckboxGroupDesktop } from "@alfalab/core-components/checkbox-group/desktop";
import { Gap } from "@alfalab/core-components/gap";
import { Checkbox } from "@alfalab/core-components/checkbox";
import { Button } from "@alfalab/core-components/button";
import { Spinner } from "@alfalab/core-components/spinner";

import type {
  RunningProcess,
  RunningProcesses,
  SelectedRepository,
} from "../dto/types";
import { useProcessSocket } from "./hooks/use-processes-socket";

import styles from "./app.module.css";
import { getNextAvailablePort } from "./helpers/go-next-available-port";

export default function App() {
  const [repos, setRepos] = useState<string[]>([]);
  const [selected, setSelected] = useState<SelectedRepository[]>([]);
  const [running, setRunning] = useState<RunningProcess[]>([]);

  const updateFunction = useCallback(
    (data: RunningProcesses) => {
      const repos = Object.keys(data).map((repoName) => data[repoName]);
      setRunning(repos);
    },
    [setRunning]
  );

  useProcessSocket(updateFunction);

  useEffect(() => {
    if (repos.includes("newclick-host-ui")) {
      setSelected([{ repoName: "newclick-host-ui", clientPort: 9090 }]);
    }

    if (running.length) {
      const repos = running.map((process) => ({
        repoName: process.repoName,
        clientPort: process.ports.clientServerPort,
        serverPort: process.ports.serverPort,
      }));
      setSelected(repos);
    }
  }, [repos, running]);

  useEffect(() => {
    fetch("http://localhost:4000/api/repos")
      .then((res) => res.json())
      .then((data) => {
        setRepos(data.repos);
      });
  }, []);

  const toggleCheckbox = (repo: string) => {
    setSelected((prevSelected) => {
      const isSelected = prevSelected.some((el) => el.repoName === repo);

      if (isSelected) {
        return prevSelected.filter((el) => el.repoName !== repo);
      } else {
        if (repo === "newclick-host-ui")
          return [...prevSelected, { repoName: repo, clientPort: 9090 }];

        const usedClientPorts = prevSelected.map((el) => el.clientPort);
        const nextClientPort = getNextAvailablePort(usedClientPorts, 8082);

        const usedServerPorts = prevSelected.map((el) => el.serverPort);
        const nextServerPort = getNextAvailablePort(
          usedServerPorts as number[],
          3002
        );

        return [
          ...prevSelected,
          {
            repoName: repo,
            clientPort: nextClientPort,
            serverPort: nextServerPort,
          },
        ];
      }
    });
  };

  const handleStart = async () => {
    await fetch("http://localhost:4000/api/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startConfig: selected }),
    });
  };

  const handleStopOne = async (repo: string) => {
    await fetch("http://localhost:4000/api/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoName: repo }),
    });
  };

  const handleStopAll = async () => {
    await fetch("http://localhost:4000/api/stop-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    setSelected([]);
  };

  return (
    <div className={styles.app}>
      {repos.length !== 0 && (
        <Typography.Title tag="h1">
          Выберите репозитории для запуска
        </Typography.Title>
      )}

      {repos.length === 0 && (
        <Typography.Title tag="h3" view="small">
          Репозитории не найдены
        </Typography.Title>
      )}

      <Gap size={20} direction="vertical" />

      <CheckboxGroupDesktop>
        {repos.map((repo) => (
          <React.Fragment key={repo}>
            <div className={styles.checkboxBlock}>
              <Checkbox
                label={repo}
                name={repo}
                size={24}
                checked={selected.some((el) => el.repoName === repo)}
                disabled={running.some((el) => el.repoName === repo)}
                onChange={() => toggleCheckbox(repo)}
              />

              {selected.some((el) => el.repoName === repo) && (
                <div className={styles.infoBlock}>
                  <Typography.Text view="secondary-small" color="secondary">
                    ({selected.find((el) => el.repoName === repo)?.clientPort})
                  </Typography.Text>
                </div>
              )}

              {running.some((el) => el.repoName === repo) && (
                <div className={styles.infoBlock}>
                  <Typography.Text view="secondary-medium" color="secondary">
                    running
                  </Typography.Text>
                  <Spinner
                    preset={16}
                    lineWidth={24}
                    className={styles.spinner}
                  />
                  <Button
                    size="xxs"
                    view="accent"
                    onClick={() => handleStopOne(repo)}
                  >
                    Stop
                  </Button>
                  <Button
                    size="xxs"
                    view="secondary"
                    onClick={() =>
                      window.open(
                        `http://localhost:${
                          selected.find((el) => el.repoName === repo)
                            ?.clientPort
                        }`
                      )
                    }
                  >
                    Open
                  </Button>
                </div>
              )}
            </div>

            <Gap size={12} direction="vertical" />
          </React.Fragment>
        ))}
      </CheckboxGroupDesktop>

      {repos.length !== 0 && (
        <>
          <Gap size={20} direction="vertical" />
          <Button
            size="xs"
            view="accent"
            onClick={handleStart}
            disabled={Object.values(selected).every((v) => !v)}
          >
            Start
          </Button>
          <Gap size={12} direction="horizontal" />
          <Button view="primary" size="xs" onClick={handleStopAll}>
            Kill all
          </Button>
        </>
      )}
    </div>
  );
}
