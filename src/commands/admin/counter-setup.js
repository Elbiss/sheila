const { Message, CommandInteraction } = require("discord.js");
const { Command } = require("@src/structures");
const { getMemberStats } = require("@utils/guildUtils");
const { getSettings } = require("@schemas/Guild");

module.exports = class CounterSetup extends Command {
  constructor(client) {
    super(client, {
      name: "sayac",
      description: "Sunucuda sayaç kanalı kur",
      category: "ADMIN",
      userPermissions: ["MANAGE_GUILD"],
      botPermissions: ["MANAGE_CHANNELS"],
      command: {
        enabled: true,
        usage: "<tip> <kanal-ismi>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "tür",
            description: "sayaç kanalının türü",
            type: "STRING",
            required: true,
            choices: [
              {
                name: "KULLANICI",
                value: "USERS",
              },
              {
                name: "ÜYE",
                value: "MEMBERS",
              },
              {
                name: "BOT",
                value: "BOTS",
              },
            ],
          },
          {
            name: "isim",
            description: "sayaç kanalının ismi",
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
    const type = args[0].toUpperCase();
    if (!type || !["KULLANICI", "ÜYE", "BOT"].includes(type)) {
      return message.reply("Yanlış argüman kullanıldı! Sayaç kanal türleri: `kullanıcı/üye/bot`");
    }
    if (args.length < 2) return message.reply("Yanlış kullanım! İsim yazmadın");
    args.shift();
    let channelName = args.join(" ");

    const response = await setupCounter(message.guild, type, channelName);
    return message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const type = interaction.options.getString("tür");
    const name = interaction.options.getString("isim");

    const response = await setupCounter(interaction.guild, type.toUpperCase(), name);
    return interaction.followUp(response);
  }
};

async function setupCounter(guild, type, name) {
  let channelName = name;

  const stats = await getMemberStats(guild);
  if (type === "KULLANICI") channelName += ` : ${stats[0]}`;
  else if (type === "ÜYE") channelName += ` : ${stats[2]}`;
  else if (type === "BOT") channelName += ` : ${stats[1]}`;

  const vc = await guild.channels.create(channelName, {
    type: "GUILD_VOICE",
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: ["CONNECT"],
      },
      {
        id: guild.me.id,
        allow: ["VIEW_CHANNEL", "MANAGE_CHANNELS", "CONNECT"],
      },
    ],
  });

  const settings = await getSettings(guild);

  const exists = settings.counters.find((v) => v.counter_type.toUpperCase() === type);
  if (exists) {
    exists.name = name;
    exists.channel_id = vc.id;
  } else {
    settings.counters.push({
      counter_type: type,
      channel_id: vc.id,
      name,
    });
  }

  settings.data.bots = stats[1];
  await settings.save();

  return "Yapılandırma kaydedildi! Sayaç kanalı oluşturuldu";
}
