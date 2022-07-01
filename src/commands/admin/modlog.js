const { Command } = require("@src/structures");
const { getSettings } = require("@schemas/Guild");
const { Message, CommandInteraction } = require("discord.js");
const { canSendEmbeds } = require("@utils/guildUtils");

module.exports = class ModLog extends Command {
  constructor(client) {
    super(client, {
      name: "modlog",
      description: "denetleme günlüğünü etkinleştir veya devre dışı bırak",
      category: "ADMIN",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        usage: "<#kanal|kapat>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "kanal",
            description: "denetleme logları için kanal ayarla",
            required: false,
            type: "CHANNEL",
            channelTypes: ["GUILD_TEXT"],
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
    let targetChannel;

    if (input === "none" || input === "kapat" || input === "disable") targetChannel = null;
    else {
      if (message.mentions.channels.size === 0) return message.reply("Yanlış komut kullanımı");
      targetChannel = message.mentions.channels.first();
    }

    const response = await setChannel(message.guild, targetChannel);
    return message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const response = await setChannel(interaction.guild, interaction.options.getChannel("kanal"));
    return interaction.followUp(response);
  }
};

async function setChannel(guild, targetChannel) {
  const settings = await getSettings(guild);

  if (targetChannel) {
    if (!canSendEmbeds(targetChannel))
      return "Ugh! O kanala günlük gönderemez miyim? Bu kanalda 'Mesaj Yaz' ve` Bağlantı Yerleştir ' izinlerine ihtiyacım var";
  }

  settings.modlog_channel = targetChannel?.id;
  await settings.save();
  return `Yapılandırma kaydedildi! Modlog kanalı: ${targetChannel ? "güncellendi" : "kaldırıldı"}`;
}
