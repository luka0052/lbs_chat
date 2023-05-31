const registerForm = document.getElementById("register-form");
registerForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const { login, password, passwordRepeat } = registerForm;
    if (password.value != passwordRepeat.value) {
        return alert("Passwords not match");
    }
    const user = JSON.stringify({
        login: login.value,
        password: password.value
    });
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "api/register");
    xhr.send(user);
    xhr.onload = function () {
        alert(xhr.response)
        if (xhr.response == "Register is successful") {
            window.open("/login", "_self");
        }
    }
})
const loginForm = document.getElementById("login-form");
loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const { login, password } = loginForm;
    const user = JSON.stringify({
        login: login.value,
        password: password.value
    });
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "api/login");
    xhr.send(user);
    xhr.onload = function () {
        if (xhr.status == 200) {
            const token = xhr.response;
            document.cookie = `token=${token}`;
            window.location.assign("/");
        } else {
            return alert(xhr.response);
        }
    }
})