const { Command } = require("@src/structures");
const { Message, MessageEmbed, CommandInteraction } = require("discord.js");
const { EMBED_COLORS } = require("@root/config.js");
const { getSettings } = require("@schemas/Guild");
const { table } = require("table");

module.exports = class AutomodConfigCommand extends Command {
  constructor(client) {
    super(client, {
      name: "automodayarla",
      description: "çeşitli automod yapılandırması",
      category: "AUTOMOD",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        minArgsCount: 1,
        subcommands: [
          {
            trigger: "durum",
            description: "bu sunucu için automod yapılandırmasını kontrol edin",
          },
          {
            trigger: "uyarı <sayı>",
            description: "bir üyenin ceza almadan önce alabileceği maksimum uyarı sayısı",
          },
          {
            trigger: "uygula <SUSTUR|AT|BAN>",
            description: "maksimum uyarıları aldıktan sonra gerçekleştirilecek eylemi ayarlayın",
          },
          {
            trigger: "debug <ON|OFF>",
            description: "yöneticiler ve moderatörler tarafından gönderilen iletiler için otomatik mod'u açar",
          },
        ],
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "durum",
            description: "Automod yapılandırmasını kontrol et",
            type: "SUB_COMMAND",
          },
          {
            name: "uyarılar",
            description: "Bir eylemde bulunmadan önce maksimum uyarı sayısını ayarlayın",
            type: "SUB_COMMAND",
            options: [
              {
                name: "miktar",
                description: "uyarı miktarı (varsayılan 5)",
                required: true,
                type: "INTEGER",
              },
            ],
          },
          {
            name: "uygula",
            description: "Maksimum uyarıları aldıktan sonra gerçekleştirilecek eylemi ayarlayın",
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
          {
            name: "debug",
            description: "yöneticiler ve moderatörler tarafından gönderilen iletiler için otomatik mod'u aç veya kapat",
            type: "SUB_COMMAND",
            options: [
              {
                name: "durum",
                description: "yapılandırma durumu",
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
    const settings = await getSettings(message.guild);

    let response;
    if (input === "durum") {
      response = await getStatus(settings, message.guild);
    }

    if (input === "uyarılar") {
      const strikes = args[1];
      if (isNaN(strikes) || Number.parseInt(strikes) < 1) {
        return message.reply("Grevler 0'dan büyük geçerli bir sayı olmalıdır");
      }
      response = await setStrikes(settings, strikes);
    }

    if (input === "uygula") {
      const action = args[1].toUpperCase();
      if (!action || !["SUSTUR", "AT", "BAN"].includes(action))
        return message.reply("Geçerli bir eylem yazın: `Sustur`/`At`/`Ban`");
      response = await setAction(settings, message.guild, action);
    }

    if (input === "debug") {
      const status = args[1].toLowerCase();
      if (!["ac", "kapat"].includes(status)) return message.reply("Geçersiz durum. Değer yalnızca `ac/kapat` olabilir");
      response = await setDebug(settings, status);
    }

    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    const settings = await getSettings(interaction.guild);

    let response;

    // status
    if (sub === "durum") response = await getStatus(settings, interaction.guild);
    else if (sub === "uyarılar") response = await setStrikes(settings, interaction.options.getInteger("miktar"));
    else if (sub === "uygula")
      response = await setAction(settings, interaction.guild, interaction.options.getString("yugula"));
    else if (sub === "debug") response = await setDebug(settings, interaction.options.getString("durum"));

    await interaction.followUp(response);
  }
};

async function getStatus(settings, guild) {
  const { automod } = settings;
  const row = [];

  const logChannel = settings.modlog_channel
    ? guild.channels.cache.get(settings.modlog_channel).toString()
    : "Yapılandırılmadı";

  row.push(["Maksimum satırlar", automod.max_lines || "NA"]);
  row.push(["Maksimum Bahsetmeler", automod.max_mentions || "NA"]);
  row.push(["Maksimum Rol Bahsetmeleri", automod.max_role_mentions || "NA"]);
  row.push(["Anti-Link", automod.anti_links ? "✓" : "✕"]);
  row.push(["Anti-Davet", automod.anti_invites ? "✓" : "✕"]);
  row.push(["Anti-Scam", automod.anti_scam ? "✓" : "✕"]);
  row.push(["Anti-Ghostping", automod.anti_ghostping ? "✓" : "✕"]);

  const asciiTable = table(row, {
    singleLine: true,
    header: {
      content: "Automod Yapılandırma",
      alignment: "center",
    },
    columns: [
      {},
      {
        alignment: "center",
      },
    ],
  });

  const embed = new MessageEmbed()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription("```" + asciiTable + "```")
    .addField("Log Kanalı", logChannel, true)
    .addField("Max Uyarılar", automod.strikes.toString(), true)
    .addField("Uygula", automod.action, true);

  return { embeds: [embed] };
}

async function setStrikes(settings, strikes) {
  settings.automod.strikes = strikes;
  await settings.save();
  return `Configuration saved! Maximum strikes is set to ${strikes}`;
}

async function setAction(settings, guild, action) {
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

  settings.automod.action = action;
  await settings.save();
  return `Yapılandırma kaydedildi! Automod eylemi şu şekilde ayarlandı ${action}`;
}

async function setDebug(settings, input) {
  const status = input.toLowerCase() === "ac" ? true : false;
  settings.automod.debug = status;
  await settings.save();
  return `Yapılandırma kaydedildi! Automod debug şimdi ${status ? "enabled" : "disabled"}`;
}
