const { Command } = require("@src/structures");
const { getSettings } = require("@schemas/Guild");
const { Message, CommandInteraction } = require("discord.js");

module.exports = class MaxWarn extends Command {
  constructor(client) {
    super(client, {
      name: "maxuyari",
      description: "Maksimum uyarı limitini ayarla",
      category: "ADMIN",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        minArgsCount: 1,
        subcommands: [
          {
            trigger: "limit <sayı>",
            description: "Maksimum uyarı limitini ayarlayabilirsiniz",
          },
          {
            trigger: "uygula <sustur|at|ban>",
            description: "maksimum uyarıya ulaşınca uygulanacak eylemi ayarlayın",
          },
        ],
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "limit",
            description: "maksimum uyarı limiti",
            type: "SUB_COMMAND",
            options: [
              {
                name: "miktar",
                description: "max yapılan hata sayısı",
                type: "INTEGER",
                required: true,
              },
            ],
          },
          {
            name: "uygula",
            description: "maksimum uyarıları aldıktan sonra eylemi gerçekleştir olarak ayarlayın",
            type: "SUB_COMMAND",
            options: [
              {
                name: "uygula",
                description: "gerçekleştirilecek eylem",
                type: "STRING",
                required: true,
                choices: [
                  {
                    name: "SUSTUR",
                    value: "MUTE",
                  },
                  {
                    name: "AT",
                    value: "KICK",
                  },
                  {
                    name: "BAN",
                    value: "BAN",
                  },
                ],
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
    if (!["limit", "uygula"].includes(input)) return message.reply("Yanlış komut kullanımı");

    let response;
    if (input === "limit") {
      const max = parseInt(args[1]);
      if (isNaN(max) || max < 1) return message.reply("Maksimum Uyarılar 0'dan büyük geçerli bir sayı olmalıdır");
      response = await setLimit(message.guild, max);
    }

    if (input === "uygula") {
      const action = args[1]?.toUpperCase();
      if (!action || !["SUSTUR", "AT", "BAN"].includes(action))
        return message.reply("Geçerli bir eylem değil. Şunlardan biri olabilir `Sustur`/`At`/`Ban`");
      response = await setAction(message.guild, action);
    }

    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();

    let response;
    if (sub === "limit") {
      response = await setLimit(interaction.guild, interaction.options.getInteger("miktar"));
    }

    if (sub === "uygula") {
      response = await setAction(interaction.guild, interaction.options.getString("uygula"));
    }

    await interaction.followUp(response);
  }
};

async function setLimit(guild, limit) {
  const settings = await getSettings(guild);
  settings.max_warn.limit = limit;
  await settings.save();
  return `Configuration saved! Maximum warnings is set to ${limit}`;
}

async function setAction(guild, action) {
  if (action === "SUSTUR") {
    if (!guild.me.permissions.has("MODERATE_MEMBERS")) {
      return "Üyelere zaman aşımı uygulama yetkim yok";
    }
  }

  if (action === "AT") {
    if (!guild.me.permissions.has("KICK_MEMBERS")) {
      return "Üyeleri atma yetkim yok";
    }
  }

  if (action === "BAN") {
    if (!guild.me.permissions.has("BAN_MEMBERS")) {
      return "Üyeleri banlama yetkim yok";
    }
  }

  const settings = await getSettings(guild);
  settings.max_warn.action = action;
  await settings.save();
  return `Yapılandırma kaydedildi! Automod eylemi şu şekilde ayarlandı ${action}`;
}
