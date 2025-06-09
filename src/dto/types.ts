export type SelectedRepository = {
  repoName: string;
  clientPort: number;
  serverPort?: number;
};

export type StartRequest = {
  startConfig: SelectedRepository[];
};

export type RunningProcess = {
  repoName: string;
  pid: number;
  ports: {
    clientServerPort: number;
    serverPort?: number;
  };
};

export type RunningProcesses = Record<string, RunningProcess>;
