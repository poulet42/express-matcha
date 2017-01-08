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
		console.log("Notification Service started !");
		this.options = extend( {}, this.options );
		extend( this.options, options );
		console.log('default options overwrited');
		this._init();
	}

	Notification.prototype._init = function() {
		console.log('Initializing the component')
		if (this.options.source.length > 0) {
			console.log('rendering first notifications')
			for (var i = Math.min(this.options.source.length, this.options.limit) - 1; i >= 0; i--) {
				this.create(this.options.source[i])
			}
		} else {
			console.log('empty source, waiting for new notifications ...')
		}
		this._events()
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
		console.log('DISMISS ASKED ! ', notificationDom)
		this.options.onDismiss(notificationDom)
		this.options.afterDismiss(notificationDom)
	}
	Notification.prototype.create = function(notificationItem) {
		console.log('creation of ', notificationItem)
		this.options.wrapper.append($(this.options.template(notificationItem)).addClass('testlol'))	
	}
	Notification.prototype.options = {
		wrapper: $('.Notifications__container'),
		source: [],
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