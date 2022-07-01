const { Command } = require("@src/structures");
const { getSettings } = require("@schemas/Guild");
const { Message, CommandInteraction } = require("discord.js");

module.exports = class SetPrefix extends Command {
  constructor(client) {
    super(client, {
      name: "prefix",
      description: "Bu sunucu için yeni bir ön ek (prefix) ayarlar",
      category: "ADMIN",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        usage: "<yeniprefix>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "yeniprefix",
            description: "yeni prefix ayarla",
            type: "STRING",
            required: true,
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
    const newPrefix = args[0];
    const response = await setNewPrefix(message.guild, newPrefix);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const response = await setNewPrefix(interaction.guild, interaction.options.getString("yeniprefix"));
    await interaction.followUp(response);
  }
};

async function setNewPrefix(guild, newPrefix) {
  if (newPrefix.length > 2) return "Prefix uzunluğu `2` karakteri geçmemeli";
  const settings = await getSettings(guild);
  settings.prefix = newPrefix;
  await settings.save();

  return `Yeni prefix ayarlandı \`${newPrefix}\``;
}
