(function(window, $) {
	'use strict';

	// OVERWRITE OPTIONS PAR DEFAUT
	function extend( a, b ) {
		for( var key in b ) { 
			if( b.hasOwnProperty( key ) ) {
				a[key] = b[key];
			}
		}
		return a;
	}

	// CONSTRUCTEUR
	function Notification(options) {
		this.options = extend( {}, this.options );
		extend( this.options, options );
		this._init();
	}

	Notification.prototype._init = function() {
		if (this.options.source.type === "array" && this.options.source.data.length > 0) {
			this.renderPrimarySource(this.options.source.data)
		} else if (this.options.source.type === "ajax") {
			var url = this.options.source.data;
			var _this = this;
			$.ajax({
				url: url,
				type: 'POST',
				success: function(data) {
					_this.renderPrimarySource(data)
				},
				error: function(err) {
				}
			}).catch( function() {
			})
		}
		this._events()
	}

	Notification.prototype.renderPrimarySource = function(source) {
			for (var i = 0, j = Math.min(source.length, this.options.limit) - 1; i <= j; i++) {
				this.create(source[i])
			}
	}
	Notification.prototype._events = function() {
		// var closeBtn = $(this.options.dismissClass),
		// _this = this
		// console.log(closeBtn)
		// closeBtn.on('click', function() {
		// 	_this.dismiss($(this).closest('.testlol'))
		// })
		var _this = this;
		this.options.wrapper.on('click', this.options.dismissClass, function() {
			_this.dismiss($(this).closest('.testlol'))
		})


		// $(this).on('coucou', function() {
		// 	console.log('okay on est bien')
		// })
	}
	Notification.prototype.dismiss = function(notificationDom) {
		this.options.beforeDismiss(notificationDom)
		this.options.onDismiss(notificationDom)
		this.options.afterDismiss(notificationDom)
	}
	Notification.prototype.create = function(notificationItem) {
		this.options.wrapper.prepend($(this.options.template(notificationItem)).addClass('testlol'))	
	}
	Notification.prototype.options = {
		wrapper: $('.Notifications__container'),
		source: {data: [], type: "array"},
		limit: 10,
		template: function(n) {return '<div>' + n + '</div>'},
		dismissClass: '.Notification__dismiss',
		beforeDismiss: function(dom) { return ;},
		onDismiss: function(dom) { console.log('dismissing ...');return ;},
		afterDismiss: function(dom) { return ;},
	}

	window.Notification = Notification
}
)(window, jQuery)