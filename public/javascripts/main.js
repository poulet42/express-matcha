
$(document).ready( function() {




  var notif = new Notification ({
    source: {data: 'https://localhost:3001/api/users/' + username + '/notifications', type: 'ajax'},
    limit: 5,
    template: function(notif) {
      return ('<li class="Menu__item"> \
        <a href="#" class="Menu__link Notification__dismiss">' + notif.content + '</a> \
        </li>')
    },
    beforeDismiss: function(domElement) {
      console.log('g reussi !!! lol ', domElement)
    }
  })
  Errors.use('#js-errors')
  //MENU TOGGLE
  //Toggle pour les composants de type menu (a refaire de facon plus générique ?)
  $('.Menu__toggle').on('click', function(e) {
    var currentMenu = $(this).siblings('.Menu');
    $('.Menu').not(currentMenu).removeClass('w-active')
    //$('.Menu__toggle, .Menu').removeClass('w-active').css({background:'red'})
    if ($(this).hasClass('js-prevent'))
      e.preventDefault()
    e.stopPropagation()
    //$(this).toggleClass('w-active').siblings('.Menu').toggleClass('w-active');
    currentMenu.toggleClass('w-active')
  })

  //Toggle pour les composants de type modal
  $('.Modal__toggle').on('click', function(e) {
    $('body').addClass('utils-overlay')
    e.stopPropagation()
    if ($(this).hasClass('js-prevent'))
      e.preventDefault()
    var target = $("." + $(this).data('modal'))
    if (target.length) {
      target.addClass('w-active')
      target.trigger('modalOpen')
    }
  })
  //Note : les classes fermables par un clic sur la window sont prefixées par w-
  $(window).on('click', function(e) {
    if (!$(e.target).is('.w-active') && !$(e.target).parents('.w-active').length) {
      $('.w-active').removeClass('w-active').trigger('modalClose')
      $('.utils-overlay').removeClass('utils-overlay')
    }
  })

  
  if (typeof username !== 'undefined') {
    $('#test').on('click', (e) => {
      var msg = prompt('WUW')
      socket.emit('send notification', {receiver: username, notification: msg})
    })
    socket.on('notification', (notification) => {
      notif.create(notification)
    })
  } else {
    console.log('shieeet')
  }
})