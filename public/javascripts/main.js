
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

  var getConversationData = function(args, whenDone) {

      $.ajax({
        url: 'https://localhost:3001/api/chat/' + args.id,
        type: 'GET',
        success: function (data) {
          whenDone(args, data);
        }
      })
  }

  var populateConversation = function(chatId, data) {
    var messagesContainer = $('.Messages__wrapper');
    var fakeMsgContainer = $('<div></div>')
    for (var i = 0, j = data.messages.length - 1; i <= j; i++) {
      console.log(data.messages[i])
      fakeMsgContainer.append(createMessage(data.messages[i]))
    }
    messagesContainer.html(fakeMsgContainer.children())
    console.log('\n\n\n\n\n\n\n-------------------\n\n\n\n', chatId)
    $('#chatHelper__id').val(chatId.id)
  }

  var createMessage = function(data) {
    var msgClass = "Messages__item"
    if (data.emitter === me)
      msgClass += " Messages__item--me"
    return ('\
      <li class="' + msgClass + '"> \
        <span class="Message__from">' + data.emitter + '</span> \
        <span class="Message__content">' + data.content + '</span> \
      </li> \
      ')
  }

  $('.Chat__zone').on('submit', function(e) {
    e.preventDefault();
    var formdata = $(this).serialize();
    console.log(formdata)
    $('.Chat__input').val('')
    $.ajax({
      url: 'https://localhost:3001/api/chat/' + $('#chatHelper__id').val() + '/messages',
      type: 'POST',
      data: formdata,
      success: function(data) {
        console.log('sweg')
      }
    })
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
    socket.on('chatStatus', (chat) => {
      if (chat.can == true) {
        $('.Profile__chat').append("<div class='Chat__Item' data-chatwith='" + chat.from + "'  data-chatid='" + chat.chatId + "'><a href='#' class='Chat__toggle'><span>" + chat.from + "</span></a></div>")
      } else {
        $('.Profile__chat').find('[data-chatwith="' + chat.from + '"]').remove();
      }
    })
    socket.on('message', (message) => {
      console.log(message)
      $('.Messages__wrapper').append(createMessage({emitter: message.username, content: message.content}))
    })
    $('.Profile__chat').on('click', '.Chat__toggle', function() {
      var chatItem = $(this).parent();
      $(this).toggleClass('active').parent().siblings().find('.Chat__toggle').removeClass('active')
      if ($(this).hasClass('active'))
        $('.Chat__container').data('use', chatItem.data('chatid')).addClass('Chat__container--active')
      else
        $('.Chat__container').removeClass('Chat__container--active').data('use', '')
      getConversationData({id: chatItem.data('chatid'), connectedTo: chatItem.data('chatwith')}, populateConversation)
    })
  } else {
    console.log('shieeet')
  }
})