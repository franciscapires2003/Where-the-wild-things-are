document.addEventListener("DOMContentLoaded", () => {
    const botoesModo = document.querySelectorAll(".modos");

    botoesModo.forEach((btn) => {
        btn.addEventListener("click", () => {
            const selectedMode = btn.getAttribute("data-mode");

            // Guarda o modo escolhido na sessão
            sessionStorage.setItem("interaction_mode", selectedMode);

            // Redireciona para a página da experiência
            window.location.href = "experiencia.html";
        });
    });
});