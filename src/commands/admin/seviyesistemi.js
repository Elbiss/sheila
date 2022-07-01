const { Command } = require("@src/structures");
const { getSettings } = require("@schemas/Guild");
const { Message, CommandInteraction } = require("discord.js");

module.exports = class XPSystem extends Command {
  constructor(client) {
    super(client, {
      name: "seviyesistemi",
      description: "Sunucuda seviye sistemini etkinleştir veya devre dışı bırak",
      category: "ADMIN",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        aliases: ["seviyesistemi", "xpsistemi"],
        usage: "<aç|kapat>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "durum",
            description: "etkin veya devre dışı olduğunu sorgula",
            required: true,
            type: "STRING",
            choices: [
              {
                name: "ON",
                value: "ON",
              },
              {
                name: "OFF",
                value: "OFF",
              },
            ],
          },
        ],
      },
    });
  }

  /**
   * @param {Message} message
   * @param {string[]} args
   */
  async messageRun(message, args) {
    const input = args[0].toLowerCase();
    if (!["aç", "kapat"].includes(input)) return message.reply("Yanlış değer. Sadece `aç/kapat` yazın.");
    const response = await setStatus(message.guild, input);
    return message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const response = await setStatus(interaction.guild, interaction.options.getString("durum"));
    await interaction.followUp(response);
  }
};

async function setStatus(guild, input) {
  const status = input.toLowerCase() === "aç" ? true : false;

  const settings = await getSettings(guild);
  settings.ranking.enabled = status;
  await settings.save();

  return `Yapılandırma kaydedildi! Seviye Sistemi şimdi ${status ? "etkin" : "devre dışı"}`;
}
