var socket = io()
$(document).ready( function() {
  if (typeof me !== 'undefined')
    socket.emit('init', me)
  Errors.use('#js-errors')
  //MENU TOGGLE
  //Toggle pour les composants de type menu (a refaire de facon plus générique ?)
  $('.Menu__toggle').on('click', function(e) {
    if ($(this).hasClass('js-prevent'))
      e.preventDefault()
    e.stopPropagation()
    $(this).toggleClass('w-active');
    $(this).siblings('.Menu').toggleClass('w-active');
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
  if (typeof me !== 'undefined' && typeof username !== 'undefined') {
    $('#test').on('click', (e) => {
      var msg = prompt('WUW')
      socket.emit('send notification', {receiver: username, notification: msg})
    })
    socket.on('notification', (notif) => {
      console.log('hey !', notif)
    })
  }
})