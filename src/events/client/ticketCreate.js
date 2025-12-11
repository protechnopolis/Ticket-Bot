const client = require('../../index');
const { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ChannelType, 
    EmbedBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ButtonStyle 
} = require('discord.js');

module.exports = {
    name: "ticketCreate"
};

client.on("interactionCreate", async (interaction) => {

    // ======= BOUTON DU PANEL POUR OUVRIR LE MODAL =======
    if (interaction.isButton()) {
        if (interaction.customId.startsWith(`ticket-setup-${interaction.guild.id}`)) {

            const id = interaction.customId.split('-')[3];

            const modal = new ModalBuilder()
                .setCustomId(`modal-${interaction.guild.id}-${id}`)
                .setTitle(`${interaction.guild.name}'s Ticket`);

            const ticketreason = new TextInputBuilder()
                .setCustomId(`ticket-reason`)
                .setLabel("Reason")
                .setPlaceholder("Provide the reason of creating ticket")
                .setStyle(TextInputStyle.Short)
                .setMinLength(5)
                .setMaxLength(1000);

            const firstActionRow = new ActionRowBuilder().addComponents(ticketreason);

            modal.addComponents(firstActionRow);

            await interaction.showModal(modal);
        }

        // ======= FERMETURE DU TICKET =======
        if (interaction.customId.startsWith(`close-ticket`)) {
            await interaction.deferUpdate();
            const id = interaction.customId.split('-')[2];

            const user = interaction.guild.members.cache.get(`${id}`);
            const channel = interaction.channel;

            if (!channel.permissionsFor(interaction.user.id).has("ManageChannels")) {
                return interaction.followUp({
                    content: `Vous n'avez pas la permission de fermer ce ticket.`,
                    ephemeral: true
                });
            }

            // Désactive le bouton Close
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("close-ticket")
                        .setLabel("🔒 Close")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );

            interaction.editReply({
                components: [disabledRow]
            });

            // Renomme en close-username
            await channel.setName(`close-${user.user.username.toLowerCase()}`);

            channel.permissionOverwrites.edit(user, { ViewChannel: false })
                .then(() => {

                    // ======= BOUTON DELETE-TICKET =======
                    const deleteRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("delete-ticket")
                                .setLabel("🗑️ Supprimer le salon")
                                .setStyle(ButtonStyle.Danger)
                        );

                    const embed = new EmbedBuilder()
                        .setTitle(`Ticket fermé`)
                        .setDescription(`Le ticket a été fermé avec succès.\nVous pouvez maintenant supprimer le salon.`)
                        .setColor("#2f3136")
                        .setTimestamp();

                    return interaction.channel.send({
                        embeds: [embed],
                        components: [deleteRow]
                    });
                })
                .catch(console.error);
        }

        // ======= SUPPRESSION DU TICKET =======
        if (interaction.customId === "delete-ticket") {

            if (!interaction.channel.permissionsFor(interaction.user.id).has("ManageChannels")) {
                return interaction.reply({
                    content: "❌ Vous n'avez pas la permission de supprimer ce ticket.",
                    ephemeral: true
                });
            }

            await interaction.reply({
                content: "🗑️ Le salon sera supprimé dans **3 secondes**...",
                ephemeral: true
            });

            setTimeout(() => {
                interaction.channel.delete().catch(() => {});
            }, 3000);
        }
    }

    // ======= CREATION DU TICKET (AVEC NOUVEAU NOM) =======
    if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith(`modal-${interaction.guild.id}`)) {

            const id = interaction.customId.split('-')[2];
            const reason = interaction.fields.getTextInputValue('ticket-reason');
            const category = interaction.guild.channels.cache.get(`${id}`);

            const username = interaction.user.username.toLowerCase();

            await interaction.guild.channels.create({
                parent: category.id,
                name: `ticket-${username}`,  // 🔥 NOM MODIFIÉ
                permissionOverwrites: [
                    {
                        id: interaction.user.id,
                        allow: ['SendMessages', 'ViewChannel'],
                    },
                    {
                        id: interaction.guild.roles.everyone,
                        deny: ['ViewChannel'],
                    },
                    {
                        id: client.user.id,
                        allow: ['ManageChannels']
                    }
                ],
                type: ChannelType.GuildText,
            }).then(async c => {

                interaction.reply({
                    content: `Le ticket a été créé, passez à <#${c.id}>`,
                    ephemeral: true
                });

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`close-ticket-${interaction.user.id}`)
                            .setLabel("🔒 Close")
                            .setStyle(ButtonStyle.Secondary)
                    );

                const embed = new EmbedBuilder()
                    .setTitle(`Attendez la réponse`)
                    .setAuthor({ name: `${interaction.user.username}'s Ticket`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(`Merci d'avoir créé votre ticket, un membre du staff va vous répondre.`)
                    .addFields({ name: "Reason", value: reason })
                    .setColor("#2f3136")
                    .setTimestamp();

                c.send({
                    content: `${interaction.user}`,
                    components: [row],
                    embeds: [embed]
                });
            });
        }
    }
});
