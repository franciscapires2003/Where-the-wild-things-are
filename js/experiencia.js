document.addEventListener("DOMContentLoaded", () => {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);


  const popup = document.getElementById("popup-instrucoes");
  const btnComecar = document.getElementById("btn-comecar");
  const btnFechar = document.getElementById("btn-fechar-popup");
  const btnInfo = document.getElementById("infoButton");
  const video = document.getElementById("story-video");
  const scrollTrack = document.querySelector(".scroll-track");

  // Barra de Progresso
  const progressTrack = document.querySelector(".progressbarTrack");
  const progressFill = document.getElementById("progress-fill");
  const progressPointer = document.getElementById("progress-pointer");

  // Modo Automático
  const controlos = document.getElementById("controlos");
  const btnPause = document.getElementById("pause");
  const iconPause = document.getElementById("iconpause");
  const btnRestart = document.getElementById("restart");

  // Modo selecionado no modo.html ('auto' ou 'manual')
  const modo = sessionStorage.getItem("interaction_mode") || "manual";

  if (video) {
    video.muted = true;
    video.defaultMuted = true;
    video.load();
    video.pause();
  }

  function updateProgressBar(progress) {
    const percentage = Math.min(Math.max(progress, 0), 1) * 100;
    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressPointer) progressPointer.style.left = `${percentage}%`;
  }

  function updateVideoAndBar(progress) {
    progress = Math.min(Math.max(progress, 0), 1);

    if (video && video.duration && !isNaN(video.duration)) {
      video.currentTime = video.duration * progress;
    }

    updateProgressBar(progress);
  }

  function fecharPopup() {
    if (popup) popup.classList.add("hidden");
    document.body.classList.remove("no-scroll");

    if (modo === "auto") {
      iniciarAutoplay();
    } else {
      if (video) {
        video.play().then(() => video.pause()).catch(err => console.log("Aviso:", err));
      }
    }
  }

  function abrirPopup() {
    if (popup) popup.classList.remove("hidden");
    document.body.classList.add("no-scroll");

    if (modo === "auto" && video && !video.paused) {
      video.pause();
      if (iconPause) iconPause.src = "assets/play.svg";
    }
  }

  if (modo === "manual") {
    if (popup) popup.classList.remove("hidden");
    document.body.classList.add("no-scroll");
  } else {
    if (popup) popup.classList.add("hidden");
    document.body.classList.remove("no-scroll");
  }

  if (btnComecar) btnComecar.addEventListener("click", fecharPopup);
  if (btnFechar) btnFechar.addEventListener("click", fecharPopup);

  if (popup) {
    popup.addEventListener("click", (e) => {
      if (e.target === popup) fecharPopup();
    });
  }

  if (btnInfo) {
    btnInfo.addEventListener("click", (e) => {
      e.preventDefault();
      abrirPopup();
    });
  }

  // auoplay
  function iniciarAutoplay() {
    if (!video) return;
    video.muted = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          if (iconPause) iconPause.src = "assets/pause.svg";
        })
        .catch(() => {
          if (iconPause) iconPause.src = "assets/play.svg";

          const unlockTouch = () => {
            video.play().then(() => {
              if (iconPause) iconPause.src = "assets/pause.svg";
            });
            window.removeEventListener("touchstart", unlockTouch);
            window.removeEventListener("click", unlockTouch);
          };

          window.addEventListener("touchstart", unlockTouch, { once: true });
          window.addEventListener("click", unlockTouch, { once: true });
        });
    }
  }

  if (modo === "auto") {
    document.body.classList.add("mode-auto");
    if (controlos) controlos.classList.remove("hidden");

    iniciarAutoplay();

    video.addEventListener("timeupdate", () => {
      if (video.duration) {
        const progress = video.currentTime / video.duration;
        updateProgressBar(progress);
      }
    });

    if (btnPause) {
      btnPause.addEventListener("click", () => {
        if (video.paused) {
          video.play();
          if (iconPause) iconPause.src = "assets/pause.svg";
        } else {
          video.pause();
          if (iconPause) iconPause.src = "assets/play.svg";
        }
      });
    }

    video.addEventListener("ended", () => {
      if (btnRestart) btnRestart.classList.remove("hidden");
      if (btnPause) btnPause.classList.add("hidden");
    });

    if (btnRestart) {
      btnRestart.addEventListener("click", () => {
        video.currentTime = 0;
        updateProgressBar(0);
        btnRestart.classList.add("hidden");
        if (btnPause) {
          btnPause.classList.remove("hidden");
          if (iconPause) iconPause.src = "assets/pause.svg";
        }
        video.play();
      });
    }

    if (progressTrack) {
      progressTrack.addEventListener("click", (e) => {
        const rect = progressTrack.getBoundingClientRect();
        let progress = (e.clientX - rect.left) / rect.width;
        progress = Math.min(Math.max(progress, 0), 1);

        if (video && video.duration) {
          video.currentTime = video.duration * progress;
          updateProgressBar(progress);
        }
      });
    }

    // scroll manual
  } else {
    let isDragging = false;
    let isBarNavigation = false;
    let ticking = false;

    function getMaxScroll() {
      if (!scrollTrack) return 1;
      return Math.max(scrollTrack.offsetHeight - window.innerHeight, 1);
    }

    function syncWithScroll() {
      if (isDragging || isBarNavigation) {
        ticking = false;
        return;
      }

      const maxScroll = getMaxScroll();
      const currentScroll = window.scrollY || window.pageYOffset;
      const progress = currentScroll / maxScroll;

      updateVideoAndBar(progress);
      ticking = false;
    }

    const requestTick = () => {
      if (!ticking) {
        window.requestAnimationFrame(syncWithScroll);
        ticking = true;
      }
    };

    window.addEventListener("scroll", requestTick, { passive: true });

    video.addEventListener("loadedmetadata", () => {
      updateVideoAndBar(0);
    });

    if (progressTrack && scrollTrack) {
      function handleScrub(clientX) {
        const rect = progressTrack.getBoundingClientRect();
        let progress = (clientX - rect.left) / rect.width;
        progress = Math.min(Math.max(progress, 0), 1);

        updateVideoAndBar(progress);

        isBarNavigation = true;
        const maxScroll = getMaxScroll();
        window.scrollTo(0, progress * maxScroll);

        setTimeout(() => {
          isBarNavigation = false;
        }, 50);
      }

      function stopDragging() {
        isDragging = false;
        document.body.style.userSelect = "";
        setTimeout(() => {
          isBarNavigation = false;
        }, 100);
      }

      progressTrack.addEventListener("mousedown", (e) => {
        e.preventDefault();
        isDragging = true;
        document.body.style.userSelect = "none";
        handleScrub(e.clientX);
      });

      window.addEventListener("mousemove", (e) => {
        if (isDragging) handleScrub(e.clientX);
      });

      window.addEventListener("mouseup", stopDragging);

      progressTrack.addEventListener("touchstart", (e) => {
        if (!e.touches.length) return;
        isDragging = true;
        handleScrub(e.touches[0].clientX);
      }, { passive: true });

      window.addEventListener("touchmove", (e) => {
        if (isDragging && e.touches.length) {
          handleScrub(e.touches[0].clientX);
        }
      }, { passive: true });

      window.addEventListener("touchend", stopDragging);
      window.addEventListener("touchcancel", stopDragging);
    }
  }


  function verificarOrientacao() {
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    const isMobile = window.innerWidth <= 900;

    if (isPortrait && isMobile) {
      if (video) video.pause();
    } else {
      if (modo === "auto") {
        if (video && video.paused && !btnRestart?.classList.contains("hidden")) {
          video.play().catch(() => { });
          if (iconPause) iconPause.src = "assets/pause.svg";
        }
      } else if (modo === "manual" && video && scrollTrack) {
        const maxScroll = Math.max(scrollTrack.offsetHeight - window.innerHeight, 1);
        const progress = Math.min(Math.max((window.scrollY || window.pageYOffset) / maxScroll, 0), 1);
        updateVideoAndBar(progress);
      }
    }
  }

  verificarOrientacao();
  window.addEventListener("resize", verificarOrientacao);
  window.addEventListener("orientationchange", verificarOrientacao);
});