// Add click event dynamically
$(document).on("click", ".text-toggle-button", function() {

  // Check if text is more or less
  if ($(this).text() == "Read more") {

    // Change link text
    $(this).text("Read less");
    
    $(this).parent().children(".text-toggle").show();
    $(this).parent().children(".dots").hide();
  } else {


    // Change link text
    $(this).text("Read more");
    
    $(this).parent().children(".text-toggle").hide();
    $(this).parent().children(".dots").show();
  }
  
});