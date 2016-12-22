var Errors = {
  errs: [],
  el: null,
  use: function(elem) {
    this.el = elem
    var self = this;
    $(this.el).on('newErr', function () {
      for (var i = 0, j = self.errs.length; i < j; i++) {
        $(this).append(" \
          <div class='Error'> \
            <p class='Error__message'> " + self.errs[i] + "</p> \
            <a href='#' class='Error__close-btn'>╋</a> \
          </div>");
      }
      console.log('loop end')
    })
  },
  add: function(msg) {
    this.errs.push(msg)
    this.errs.push(msg)
    $(this.el).trigger("newErr")
  },
  flush: function() {
    this.errs = []
  }
}


$(document).on('click', '.Error__close-btn', function() {
  $(this).parent('.Error').fadeOut(300, function() { $(this).remove(); });
})