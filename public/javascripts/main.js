
$(document).ready( function() {

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

  $('.Dropdown__toggle').on('click', function(e) {
    $(this).parent().toggleClass('w-active')
  })

  $('.Dropdown__item').on('click', function() {
    var comp = $(this).parents('.Dropdown');
    var value = comp.data('placeholder');
    $(this).toggleClass('Dropdown__item--selected').siblings().removeClass('Dropdown__item--selected')

    if ($(this).hasClass('Dropdown__item--selected')) {
      value = $(this).text();
      comp.data('value', value)
    } else {
      comp.data('value', "")
    }
    comp.find('.Dropdown__selected').text(value)
    comp.trigger('dropChange', value).removeClass('w-active')
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
    var notif = new Notification ({
      source: {data: 'https://localhost:3001/api/users/' + username + '/notifications', type: 'ajax'},
      limit: 5,
      template: function(notif) {
        return ('<li class="Menu__item"> \
          <a href="#" class="Menu__link Notification__dismiss">' + notif.content + '</a> \
          </li>')
      },
      beforeDismiss: function(domElement) {
        console.log('dismiss notification ')
      }
    })
    socket.on('notification', (notification) => {
      notif.create(notification)
    })
  } else {
    console.log('shieeet')
  }
})