$(async function() {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $navWelcome = $("#nav-welcome");

  const $navUserProfile=$("#nav-user-profile");
  const $userProfile = $("#user-profile");
  const $favoriteArticle=$("#favorited-articles");
  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    //check for the correct credentials
   try{                    
    const userInstance = await User.login(username, password);
    currentUser = userInstance;
   }
   catch{
     throw alert("Wrong credential");
   }
    // set the global user to the user instance
  
    
   // console.log(currentUser);
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function() {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function() {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });

  //On clicking submit in Nav bar , it will appear a form 
  $("#nav-submit").on("click",function(){
    $submitForm.show();
    $("#author").val("");
    $("#title").val("");
    $("#url").val("");
  });

  //get data from the form for creating a new story 
$submitForm.on("submit",async function(e){
  e.preventDefault();
  let author = $("#author").val();
  let title = $("#title").val();
  let url = $("#url").val();
  let story={author:author,title:title,url:url,username:currentUser.username};

  $submitForm.hide();
 const  storyObject= await storyList.addStory(currentUser, story );
 //console.log( storyObject);
 //console.log(storyObject.storyId);
 await generateStories();
 $submitForm.trigger("reset");
});



$navUserProfile.on("click", function() {
  // hide everything
  hideElements();
  // except the user profile
  $userProfile.show();
});

$(".articles-container").on("click", ".star", async function(e) {
//$(".articles-container .star").on("click", async function(e){

  let target=$(e.target);
  let closestLi=target.closest("li");
  const storyId=closestLi.attr("id");
  if(currentUser)
  {
     if(target.hasClass("far"))
      {
        //add favorite
        await  currentUser.addFavorite(storyId);
        target.toggleClass("far fas")
      }
      else 
      {
        //remove favorite
        target.toggleClass("fas far");
        await  currentUser.removeFavorite(storyId);
      }
  }
  else alert("You need to log in for Favorite story");

});

$("#nav-favorites").on("click", function(){

  hideElements();
  if (currentUser) {
    generateFav();
    $favoriteArticle.show();
  }
});

$("body").on("click", "#nav-my-stories", function() {

//$("#nav-my-stories").on("click",async function(){
  hideElements();
  if(currentUser){
    generateOwnStories();
    $ownStories.show();
  }
});


$(".articles-container").on("click", ".trash-can", async function(e) {

  console.log("you have clicked Trash bin ");
  let target=$(e.target);
  let closestLi=target.closest("li");
  const storyId=closestLi.attr("id");

  //closestLi.remove();
  storyList.removeStory(storyId,currentUser);
  generateOwnStories();
  $ownStories.show();

});


  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {

      showNavForLoggedInUser();
      generateProfile();

    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
   
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();

    // update the navigation bar
    showNavForLoggedInUser();
    generateProfile();
    console.log(currentUser);
    
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    console.log("storyListInstance",storyListInstance);

    // update our global variable
    storyList = storyListInstance;  //stoyList is an object StoryList having list of stories
    console.log("storyList",storyList);
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
    
  }

  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);
    let starType = isFavorite(story) ? "fas" : "far";

    
    const storyMarkup = $(`
      <li id="${story.storyId}">
      <span class="star">
        <i class="${starType} fa-star"></i> 
      </span> 
        <a class="article-link" href="${story.url}" target="a_blank">
        <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }
//to check if a specific story is in the user's list of favorites
  function isFavorite(story)
  {
    let favStoryId=[];//is an array of fav story Id's
    if(currentUser)
    {
      for(each of currentUser.favorites)
      {      
        favStoryId.push(each.storyId);
      }

    }
   return favStoryId.includes(story.storyId);

  }
  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm,
      $userProfile,
      $favoriteArticle,
      $loginForm,
      $createAccountForm,
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {

    $navLogin.hide();

    $navLogOut.show();
    $navWelcome.show();
    $userProfile.hide();
    $(".main-nav-links").show();//

  }
//to generate profile 
  function generateProfile(){
    $("#profile-name").text(`Name:${currentUser.name}`);
    $("#profile-username").text(`Username:${currentUser.username}`);
    $("#profile-account-date").text(`Account Created:${currentUser.createdAt}`);

    $navUserProfile.text(`${currentUser.username}`);


  }

function generateFav(){
  $favoriteArticle.empty();

  if(currentUser.favorites.length===0)
  {
   $favoriteArticle.append("<h5>No favorite Story added!</h5>");

  }
  else
  {
    for(each of currentUser.favorites)
   {
      let favArticle=generateStoryHTML(each);
      //console.log(favArticle);
      $favoriteArticle.append(favArticle);

    }
  }
}

 function generateOwnStories(){
 
  $ownStories.empty();     //To avoid duplication in DOM 
  if(currentUser.ownStories.length===0){
    $ownStories.append("<h5>No Own Stories created</h5>");
  }else{
  for(story of currentUser.ownStories)
  {
   // Code for generateStoryHTML(each) to add Remove Story option 
   let hostName = getHostName(story.url);
    let starType = isFavorite(story) ? "fas" : "far";

    const storyMarkup = $(`
     
      <li id="${story.storyId}">
      <span class="star">
        <i class="${starType} fa-star"></i> 
      </span> 
      <span class="trash-can">
       <i class="fas fa-trash-alt"></i>
      </span>
        <a class="article-link" href="${story.url}" target="a_blank">
        <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);
    $ownStories.append(storyMarkup);

  }
  $ownStories.show();

}


}
  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }
});
