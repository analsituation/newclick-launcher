import fs from "fs";
import path from "path";
import { getRepositoryPath } from "../../utils/get-repository-path.ts";

export function scanRepos(): string[] {
  const reposRoot = getRepositoryPath();

  const entries = fs.readdirSync(reposRoot, { withFileTypes: true });

  const repos = entries
    .filter((entry) => {
      if (!entry.isDirectory()) return false;
      const { name } = entry;
      return name.startsWith("newclick-") && name.endsWith("-ui");
    })
    .map((dir) => {
      const packageJsonPath = path.join(reposRoot, dir.name, "package.json");
      return fs.existsSync(packageJsonPath) ? dir.name : null;
    })
    .filter((repo): repo is string => repo !== null);

  return repos;
}
