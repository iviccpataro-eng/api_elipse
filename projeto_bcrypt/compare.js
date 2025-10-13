const bcrypt = require("bcrypt");
const hash = "$2b$10$bD7P9sYXe.UKvHthg8u8kuMfX8i.Dpz8Ou7XQ2SXrAIQ6hQL9Pjlm";
const senhaDigitada = "R@isenT3ch";

bcrypt.compare(senhaDigitada, hash).then(console.log);
