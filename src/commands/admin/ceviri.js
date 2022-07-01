const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");
const { getSettings } = require("@schemas/Guild");

module.exports = class FlagTranslation extends Command {
  constructor(client) {
    super(client, {
      name: "ceviri",
      description: "Sunucuda dil çevirisini ayarla",
      category: "ADMIN",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        aliases: ["dilceviri"],
        minArgsCount: 1,
        usage: "<ac|kapat>",
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "durum",
            description: "etkin veya devre dışı",
            required: true,
            type: "STRING",
            choices: [
              {
                name: "AC",
                value: "ON",
              },
              {
                name: "KAPAT",
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
    const status = args[0].toLowerCase();
    if (!["ac", "kapat"].includes(status)) return message.reply("Geçersiz komut. Değer `ac/kapat` olmalıdır.");

    const response = await setFlagTranslation(message.guild, status);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const response = await setFlagTranslation(interaction.guild, interaction.options.getString("durum"));
    await interaction.followUp(response);
  }
};

async function setFlagTranslation(guild, input) {
  const status = input.toLowerCase() === "ac" ? true : false;

  const settings = await getSettings(guild);
  settings.flag_translation.enabled = status;
  await settings.save();

  return `Yapılandırma kaydedildi! Bayrak çevirisi şimdi ${status ? "aktif" : "devre dışı"}`;
}
