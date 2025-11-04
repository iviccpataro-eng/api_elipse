// modules/updater.js
import { generateFrontendData } from "./structureBuilder.js";
import { getByPath } from "./utils.js";

export async function regenerateStructure(dados) {
  try {
    const tagsList =
      dados.tagsList ||
      getByPath(dados, "tags") ||
      getByPath(dados, "Tags");

    if (!Array.isArray(tagsList) || tagsList.length === 0) {
      console.log("⚠️ Nenhuma tagsList disponível — ignorando atualização automática.");
      return;
    }

    console.log("♻️ Atualizando estrutura global...");
    const generated = generateFrontendData(tagsList);
    dados.structure = generated.structure;
    dados.structureDetails = generated.details;
    dados.lastAutoUpdate = new Date();

    console.log(
      `✅ Estrutura regenerada em ${dados.lastAutoUpdate.toLocaleTimeString()} (${tagsList.length} tags)`
    );
  } catch (err) {
    console.error("❌ Erro ao regenerar estrutura:", err);
  }
}

export async function initUpdater(dados, pool) {
  try {
    const refreshTime = await getRefreshTime(pool);
    console.log(`⏱️ Atualização automática a cada ${refreshTime}s`);
    setInterval(() => regenerateStructure(dados), refreshTime * 1000);
  } catch (err) {
    console.error("⚠️ Falha ao iniciar updater:", err);
    setInterval(() => regenerateStructure(dados), 30000);
  }
}

async function getRefreshTime(pool) {
  try {
    const result = await pool.query("SELECT COALESCE(MAX(refreshtime),15) AS rt FROM users");
    return Math.max(5, parseInt(result.rows[0].rt || 15));
  } catch {
    return 15;
  }
}
