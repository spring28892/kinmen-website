jQuery(document).ready(function ($) {

	var my_nav = $('.navbar-sticky');

	// 主選單改用 CSS position: sticky，這段只在舊版 .navbar-sticky 還存在時才執行。
	if (my_nav.length) {
		var sticky_navigation_offset_top = my_nav.offset().top;

		var sticky_navigation = function () {
			var scroll_top = $(window).scrollTop();
			if (scroll_top > sticky_navigation_offset_top) {
				my_nav.addClass('stick');
			} else {
				my_nav.removeClass('stick');
			}
		};

		sticky_navigation();
		$(window).scroll(sticky_navigation);
	}

	var initio_parallax_animation = function () {
		$('.parallax').each(function () {
			var speed = $(this).data('parallax-speed');
			if (speed) {
				$(this).css('background-position', 'center -' + (window.pageYOffset / speed) + 'px');
			}
		});
	};

	if ($('.parallax').length) {
		$(window).scroll(initio_parallax_animation);
	}

});
