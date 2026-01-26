document.getElementById("pswdBtn").addEventListener("click", () => {
  const pswdInput = document.getElementById("accountPassword");
  if (pswdInput.type === "password") {
    pswdInput.type = "text";
    pswdBtn.textContent = "Hide Password";
  } else {
    pswdInput.type = "password";
    pswdBtn.textContent = "Show Password";
  }
});
