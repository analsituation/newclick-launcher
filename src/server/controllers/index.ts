import { type Request, type Response } from "express";
import {
  runningProcesses,
  startHost,
  startRepo,
  stopAllRepos,
  stopRepo,
} from "../services/index.ts";
import { scanRepos } from "../scanner/scanRepos.ts";
import type { StartRequest } from "../../dto/types";

export async function getReposController(_: Request, res: Response) {
  try {
    const repos = scanRepos();
    res.status(200).json({ repos });
  } catch (err) {
    res.status(500).json({ error: "Ошибка при сканировании репозиториев" });
  }
}

export async function startNewclickController(
  req: Request<{}, {}, StartRequest>,
  res: Response
) {
  const { startConfig } = req.body;

  startHost(startConfig);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const startPromises = startConfig.map((repo) => {
    // Если репозиторий уже запущен то скипаем, так как с фронта приходит объект со всеми выбранными репозиториями
    if (repo.repoName in runningProcesses) return;

    console.log(`Запуск ${repo}...`);
    return startRepo(repo);
  });

  await Promise.all(startPromises);

  res.status(200).send({ message: `Приложения запущены` });
}

export function stopRepoController(req: Request, res: Response) {
  const { repoName } = req.body;
  stopRepo(repoName);
  res.status(200).send({ message: `Процесс ${repoName} остановлен` });
}

export function stopAllReposController(_: Request, res: Response) {
  stopAllRepos();
  res.status(200).send({ message: "Все процессы остановлены" });
}
