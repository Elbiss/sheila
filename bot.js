require("dotenv").config();
require("module-alias/register");

const path = require("path");
const { startupCheck } = require("@utils/botUtils");
const { BotClient } = require("@src/structures");

global.__appRoot = path.resolve(__dirname);

// initialize client
const client = new BotClient();
client.loadCommands("src/commands");
client.loadContexts("src/contexts");
client.loadEvents("src/events");


// find unhandled promise rejections
process.on("unhandledRejection", (err) => client.logger.error(`İşlenmeyen özel durum`, err));

(async () => {
  await startupCheck();
  if (client.config.DASHBOARD.enabled) {
    client.logger.log("Web paneli başlatılıyor..");
    try {
      const { launch } = require("@root/dashboard/app");
      await launch(client);
    } catch (ex) {
      client.logger.error("Web paneli başlatılırken hata!", ex);
    }
  }
  await client.initializeMongoose();
  await client.login(process.env.BOT_TOKEN);
})();
