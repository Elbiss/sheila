const { Command } = require("@src/structures");
const { getSettings } = require("@schemas/Guild");
const { Message, CommandInteraction } = require("discord.js");
const { findMatchingRoles } = require("@utils/guildUtils");

module.exports = class AutoRole extends Command {
  constructor(client) {
    super(client, {
      name: "otorol",
      description: "Yeni katılan üyelere verilecek rolleri ayarla",
      category: "ADMIN",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        usage: "<rol|kapat>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "ekle",
            description: "Otomatik rolü ayarla",
            type: "SUB_COMMAND",
            options: [
              {
                name: "rol",
                description: "verilecek rol",
                type: "ROLE",
                required: false,
              },
              {
                name: "role_id",
                description: "verilecek rol id",
                type: "STRING",
                required: false,
              },
            ],
          },
          {
            name: "kapat",
            description: "otomatik rolü devre dışı bırak",
            type: "SUB_COMMAND",
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
    const input = args.join(" ");
    let response;

    if (input.toLowerCase() === "kapat") {
      response = await setAutoRole(message, null);
    } else {
      const roles = findMatchingRoles(message.guild, input);
      if (roles.length === 0) response = "Rol bulunamadı!";
      else response = await setAutoRole(message, roles[0]);
    }

    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    let response;

    // add
    if (sub === "ekle") {
      let role = interaction.options.getRole("rol");
      if (!role) {
        const role_id = interaction.options.getString("role_id");
        if (!role_id) return interaction.followUp("Lütfen rol veya rol id yazın");

        const roles = findMatchingRoles(interaction.guild, role_id);
        if (roles.length === 0) return interaction.followUp("Rol bulunamadı!");
        role = roles[0];
      }

      response = await setAutoRole(interaction, role);
    }

    // remove
    else if (sub === "kaldır") {
      response = await setAutoRole(interaction, null);
    }

    // default
    else response = "Geçersiz alt komut";

    await interaction.followUp(response);
  }
};

async function setAutoRole({ guild }, role) {
  const settings = await getSettings(guild);

  if (role) {
    if (!guild.me.permissions.has("MANAGE_ROLES")) return "Rolleri düzenleme yetkim yok";
    if (guild.me.roles.highest.position < role.position) return "Bu rolü vermek için yetkim yok";
    if (role.managed) return "Oops! Bu rol bir entegrasyon tarafından yönetiliyor";
  }

  if (!role) settings.autorole = null;
  else settings.autorole = role.id;

  await settings.save();
  return `Configuration saved! Autorole is ${!role ? "disabled" : "setup"}`;
}
