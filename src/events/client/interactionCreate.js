const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const client = require('../../index');

module.exports = {
    name: "interactionCreate"
};

client.on("interactionCreate", async interaction => {

    // 🔥 IMPORTANT : laisser passer les boutons pour le système de tickets
    if (interaction.isButton()) return;

    // ========= SYSTÈME DE COMMANDES SLASH =========

    if (!interaction.isChatInputCommand()) return;

    const command = client.slash.get(interaction.commandName);
    if (!command) return;

    try {

        // Vérification ownerOnly
        if (command.ownerOnly) {
            if (!client.config.OWNER.includes(interaction.user.id)) {
                return interaction.reply({
                    content: `Vous ne pouvez pas utiliser les commandes propriétaires.`,
                    ephemeral: true
                });
            }
        }

        // Permissions utilisateur
        if (command.userPermissions) {
            const embed = new EmbedBuilder()
                .setTitle(`Permissions requises`)
                .setDescription(`${interaction.user} vous n'avez pas les permissions nécessaires.`)
                .addFields({ name: "Permissions", value: command.userPermissions.join(", ") })
                .setColor("#2f3136");

            if (!interaction.member.permissions.has(PermissionsBitField.resolve(command.userPermissions))) {
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

        // Permissions bot
        if (command.botPermissions) {
            const embed = new EmbedBuilder()
                .setTitle(`Permissions requises`)
                .setDescription(`Je n'ai pas les permissions nécessaires.`)
                .addFields({ name: "Permissions", value: command.botPermissions.join(", ") })
                .setColor("#2f3136");

            if (!interaction.channel.permissionsFor(client.user.id).has(PermissionsBitField.resolve(command.botPermissions))) {
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

        await command.run(client, interaction, interaction.options);

    } catch (err) {
        console.log(err);
    }
});
 
