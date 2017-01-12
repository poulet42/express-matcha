module.exports = function Notification(options) {
	var emitter = options.emitter;
	var receiver = options.receiver;
	var type = options.type || 'default';
	var id = options.id;
	var content = {
		like: emitter + " a aimé votre profil",
		dislike: emitter + " n'aime plus votre profil",
		check: emitter + " a visité votre profil",
		default: "Oups, petit probleme"
	}
	console.log(content[type])
	return {emitter, receiver, content: content[type], id}
}