var navbar = document.querySelector('.navbar')
var prevScrollPos = window.pageYOffset;

// scroll function
window.onscroll = function() {
	var currentScrollPos = window.pageYOffset;
	
    // add/remove class to navbar when scrolling to hide/show
    if (currentScrollPos > prevScrollPos && currentScrollPos > 150) {
		navbar.classList.add("navbar-hide");
    } else {
        navbar.classList.remove("navbar-hide");
    }
	
	prevScrollPos = currentScrollPos;
};
