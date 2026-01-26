
  // Get elements
  const pswdBtn = document.getElementById("pswdBtn");
  const passwordInput = document.getElementById("account_password");

  pswdBtn.addEventListener("click", () => {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";  // show password
      pswdBtn.textContent = "Hide Password";
    } else {
      passwordInput.type = "password"; // hide password
      pswdBtn.textContent = "Show Password";
    }
  });

