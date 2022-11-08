const Discord = require("discord.js")
const client = new Discord.Client({ intents: [32767], partials: ["CHANNEL"] })

const mongoose = require("mongoose")

const config = require("./config.json")

mongoose.connect(config.MONGOURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("Mongodb esta conectado!")).catch(err => console.log(err))

const Schema = require("./Schemas/globalban.js")

client.on("ready", async () => { console.log(`${client.user.tag} esta online`) })

client.on("messageCreate", async (message) => {
    if(message.author.bot || message.channel.type === "DM") return;
    let prefix = config.PREFIX;
    if(!prefix) return;
    if(!message.content.toLowerCase().startsWith(prefix)) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/)
    const command = args.shift().toLowerCase()

    if(command === "banear"){
        var ids_autorizadas = [`${config.ID1 || "null"}`, `${config.ID2 || "null"}`]
        if(ids_autorizadas.includes(message.author.id)){
            let id = args[0]
            let imagen = args[1]
            let razon = args.slice(2).join(" ") || "Sin especificar"

            if(id){

                let embed = new Discord.MessageEmbed()
                .setTitle("Usuario globalmente baneado")
                .addFields(
                    { name: "ID:", value: `${id}`, inline: true },
                    { name: "Razon:", value: `${razon || "Sin especificar"}`, inline: true }
                )
                .setColor("ORANGE")
                .setTimestamp()
                .setFooter({ text: `Baneado por: ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                if(imagen) embed.setImage(imagen)
                if(client.users.cache.get(id)) embed.setImage(client.users.cache.get(id).displayAvatarURL({ dynamic: true }) || "nulo")

                message.reply({
                    embeds: [embed]
                })

                await Schema.findOneAndUpdate({ userId: id }, {
                    baneado: true,
                    razon: razon,
                    imagen: imagen
                })
            } else { return message.reply({ content: `Indica una ID` }) };
        } else return;
    }

    if(command === "instantban"){
        var ids_autorizadas = [`${config.ID1 || "null"}`, `${config.ID2 || "null"}`]
        if(!ids_autorizadas.includes(message.author.id)) return;
        let id = args[0]
        let razon = args.slice(1).join(" ")
        if(id){
            let userFetch = client.users.cache.get(id, true)
            let countSi = 0;
            let countNo = 0;
            if(userFetch){
                client.guilds.cache.forEach(async (guild) => {
                    try {
                        await guild.members.ban(userFetch, { reason: `INSTANTBAN - ${razon || "Sin especificar"} `})
                        countSi++
                    } catch (err) {
                        console.log(err)
                    }

                    if(countSi+countNo === client.guilds.cache.size){
                        message.channel.send({
                            embeds: [
                                new Discord.MessageEmbed()
                                .setDescription(`He baneado a \`${id}\` de ${countSi}/${client.guilds.cache.forEach}`)
                                .addFields(
                                    { name: `Servidores Baneado:`, value: `${countSi}/${client.guilds.cache.size}`, inline: true  },
                                    { name: `Servidores No Baneado`, value: `${countNo}/${client.guilds.cache.size}`, inline: true  }
                                )
                                .setColor("GREEN")
                                .setTimestamp()
                            ]
                        })
                    } 
                })
            } else { return message.reply({ content: `El usuario no fue encontrado` })}
        } else { return message.reply({ content: `Debes indicar una ID` }) }
    }

    if(command === "unban"){
        var ids_autorizadas = [`${config.ID1 || "null"}`, `${config.ID2 || "null"}`]
        if(!ids_autorizadas.includes(message.author.id)) return;
        let id = args[0]
        if(id){
            message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                    .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
                    .setDescription(`He desbaneado a \`${id}\` de mi lista globalban`)
                    .setColor("GREEN")
                    .setTimestamp()
                ]
            })
            await Schema.findOneAndUpdate({ userId: id }, { baneado: false })
        }
    }
})

client.on("guildMemberAdd", async (member) => {
    let data = await Schema.findOne({ userId: member.id })
    if(!data || data.baneado === null || !data.baneado) return;

    await member.ban({ reason: `Usuario globalmente baneado\nRazon: ${data.razon}` })

    client.users.cache.get(member.id).send({
        embeds: [
            new Discord.MessageEmbed()
            .setTitle("Estas globalmente baneado")
            .setImage(data.imagen || "null")
            .addFields(
                { name: `Razon:`, value: `${data.razon || "No se encontro una razon"}`, inline: true  }
            )
            .setColor("RED")
            .setTimestamp()
        ]
    })
})

client.login(config.TOKEN)