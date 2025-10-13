// Dentro do arquivo: gerarHash.js

const bcrypt = require("bcrypt");

(async () => {
  try {
    const saltRounds = 10;
    // IMPORTANTE: Troque "SUA_SENHA_FORTE" pela senha que deseja criptografar.
    const senhaOriginal = "R@isenT3ch"; 

    console.log("Gerando hash para a senha...");
    const hash = await bcrypt.hash(senhaOriginal, saltRounds);
    
    console.log("\nHash gerado com sucesso!");
    console.log(hash);

  } catch (error) {
    console.error("Ocorreu um erro:", error);
  }
})();